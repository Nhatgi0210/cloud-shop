// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../lib/shop-api";
import { money } from "../lib/format";
import type { Order, User } from "../lib/types";

const state = vi.hoisted(() => ({
  orders: undefined as Order[] | undefined,
  cancel: vi.fn(),
  update: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("./providers", () => ({
  useSession: () => ({ refresh: state.refresh }),
}));
vi.mock("../lib/shop-client", async (importOriginal) => {
  const original = await importOriginal<typeof import("../lib/shop-client")>();
  return {
    ...original,
    useQuery: () => state.orders,
    useMutation: (endpoint: unknown) =>
      endpoint === original.api.orders.cancel ? state.cancel : state.update,
  };
});
import { AccountPanel } from "./account-panel";

const user: User = {
  _id: "customer-a",
  _creationTime: 0,
  name: "Khách A",
  email: "a@example.com",
  role: "customer",
};
const order: Order = {
  _id: "order-12345678",
  _creationTime: Date.UTC(2026, 10, 8, 3, 30),
  status: "pending",
  paymentStatus: "unpaid",
  totalAmount: 2460000,
  shippingName: "Nguyễn An",
  shippingPhone: "0901234567",
  shippingAddress: "123 Đường Demo",
  items: [
    {
      _id: "item-a",
      productName: "Tên giày lúc mua",
      variantName: "Trắng lúc mua",
      size: 40,
      quantity: 2,
      unitPrice: 1230000,
    },
  ],
};
let container: HTMLDivElement;
let root: Root;
async function render(account = user) {
  await act(async () => {
    root.render(
      createElement(AccountPanel, {
        view: "orders",
        user: account,
        goShopping: vi.fn(),
      }),
    );
  });
}
function button(text: string) {
  const found = [...container.querySelectorAll("button")].find(
    (element) => element.textContent?.trim() === text,
  );
  expect(found, `button: ${text}`).toBeDefined();
  return found!;
}
function feedback() {
  return container.querySelector(".feedback")?.textContent;
}
beforeEach(async () => {
  (
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  state.orders = structuredClone([order]);
  state.cancel.mockReset().mockResolvedValue(null);
  state.update.mockReset().mockResolvedValue(null);
  state.refresh.mockReset();
  vi.spyOn(window, "confirm").mockReturnValue(true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await render();
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

describe("customer order history", () => {
  it("identifies the order in each cancellation control", async () => {
    state.orders!.push({ ...order, _id: "order-87654321" });
    await render();
    const buttons = [
      ...container.querySelectorAll<HTMLButtonElement>("article button"),
    ];
    expect(buttons.map((button) => button.getAttribute("aria-label"))).toEqual([
      "Hủy đơn #12345678",
      "Hủy đơn #87654321",
    ]);
    await act(async () => buttons[1].click());
    expect(state.cancel).toHaveBeenCalledExactlyOnceWith({ id: "order-87654321" });
  });

  it("shows snapshot unit price, line amount, delivery and COD data", () => {
    const article = container.querySelector("article")!;
    expect(article.textContent).toContain("#12345678");
    expect(article.textContent).toContain("10:30");
    expect(article.textContent).toContain("8/11/2026");
    expect(article.textContent).toContain(
      "Tên giày lúc mua / Trắng lúc mua / EU 40 × 2",
    );
    expect(article.textContent).toContain(`Đơn giá lúc mua: ${money(1230000)}`);
    expect(article.textContent).toContain(money(2460000));
    expect(article.textContent).toContain("Nguyễn An · 0901234567");
    expect(article.textContent).toContain("123 Đường Demo");
    expect(article.textContent).toContain("COD · Chưa thanh toán");
  });

  it("distinguishes loading from empty history", async () => {
    state.orders = undefined;
    await render();
    expect(container.textContent).toContain("Đang tải đơn hàng");
    state.orders = [];
    await render();
    expect(container.textContent).toContain("Chưa có đơn hàng");
    expect(container.textContent).not.toContain("Đang tải đơn hàng");
  });

  it.each(["confirmed", "shipping", "delivered", "cancelled"] as const)(
    "does not offer customer cancellation or admin controls for %s",
    async (status) => {
      state.orders = [
        {
          ...order,
          status,
          paymentStatus: status === "delivered" ? "paid" : "unpaid",
        },
      ];
      await render();
      expect(container.querySelector("article button")).toBeNull();
      if (status === "delivered")
        expect(container.textContent).toContain("COD · Đã thanh toán");
    },
  );

  it("keeps the order when confirmation is declined", async () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    await act(async () => button("Hủy đơn").click());
    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining("#12345678"),
    );
    expect(state.cancel).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Chờ xác nhận");
  });

  it("blocks immediate duplicate cancellation and retains success across stale GETs", async () => {
    let resolve!: (value: null) => void;
    state.cancel.mockImplementation(
      () =>
        new Promise<null>((done) => {
          resolve = done;
        }),
    );
    const cancel = button("Hủy đơn");
    await act(async () => {
      cancel.click();
      cancel.click();
    });
    expect(state.cancel).toHaveBeenCalledExactlyOnceWith({ id: order._id });
    expect(window.confirm).toHaveBeenCalledTimes(1);
    expect(cancel.disabled).toBe(true);
    expect(feedback()).toBe("Đang hủy đơn…");
    await act(async () => resolve(null));
    expect(feedback()).toContain("Đã hủy đơn #12345678");
    expect(container.querySelector(".status")?.textContent).toBe("Đã hủy");
    await render(); // The GET still contains pending; success must not re-enable cancel.
    expect(container.querySelector("article button")).toBeNull();
    state.orders = undefined;
    await render();
    expect(feedback()).toContain("Đã hủy đơn #12345678");
    state.orders = structuredClone([order]);
    await render();
    expect(container.querySelector("article button")).toBeNull();
  });

  it.each([400, 409])(
    "shows a %s conflict and can refresh the new server status",
    async (status) => {
      state.cancel.mockRejectedValueOnce(
        new ApiError("Đơn hàng không thể hủy", status),
      );
      await act(async () => button("Hủy đơn").click());
      expect(feedback()).toContain("Đơn hàng không thể hủy");
      expect(feedback()).toContain("trạng thái");
      expect(feedback()).not.toContain("Đã hủy đơn");
      expect(button("Hủy đơn").disabled).toBe(false);
      await act(async () => button("Làm mới danh sách").click());
      expect(state.refresh).toHaveBeenCalledTimes(1);
      state.orders = [{ ...order, status: "confirmed" }];
      await render();
      expect(container.querySelector(".status")?.textContent).toBe(
        "Đã xác nhận",
      );
      expect(container.querySelector("article button")).toBeNull();
    },
  );

  it("keeps a failed cancellation retryable and does not claim success on a server failure", async () => {
    state.cancel.mockRejectedValueOnce(
      new ApiError("Dịch vụ tạm gián đoạn", 503),
    );
    await act(async () => button("Hủy đơn").click());
    expect(feedback()).toContain("Dịch vụ tạm gián đoạn");
    expect(feedback()).toContain("Chưa xác định");
    expect(container.querySelector(".status")?.textContent).toBe(
      "Chờ xác nhận",
    );
    await act(async () => button("Hủy đơn").click());
    expect(state.cancel).toHaveBeenCalledTimes(2);
    expect(container.querySelector(".status")?.textContent).toBe("Đã hủy");
  });

  it("resets local cancellation results for B and ignores A's late response", async () => {
    let resolve!: (value: null) => void;
    state.cancel.mockImplementation(
      () =>
        new Promise<null>((done) => {
          resolve = done;
        }),
    );
    await act(async () => button("Hủy đơn").click());
    state.orders = [];
    await render({ ...user, _id: "customer-b", name: "Khách B" });
    await act(async () => resolve(null));
    expect(container.textContent).toContain("Chưa có đơn hàng");
    expect(container.textContent).not.toContain("12345678");
    expect(feedback()).toBe("");
  });

  it("preserves the existing admin transition and locks it during cancellation", async () => {
    await render({ ...user, role: "admin" });
    expect(container.textContent).toContain("Đơn hàng cửa hàng");
    let resolve!: (value: null) => void;
    state.cancel.mockImplementation(
      () =>
        new Promise<null>((done) => {
          resolve = done;
        }),
    );
    const cancel = button("Hủy đơn");
    const update = button("Đã xác nhận →");
    await act(async () => {
      cancel.click();
      update.click();
    });
    expect(state.update).not.toHaveBeenCalled();
    await act(async () => resolve(null));
    expect(container.querySelector("article button")).toBeNull();
  });

  it("keeps other pending orders cancellable after one succeeds", async () => {
    state.orders = [
      structuredClone(order),
      { ...structuredClone(order), _id: "order-87654321" },
    ];
    await render();
    await act(async () => button("Hủy đơn").click());
    expect(container.querySelectorAll("article button")).toHaveLength(1);
    await act(async () => button("Hủy đơn").click());
    expect(state.cancel.mock.calls).toEqual([
      [{ id: order._id }],
      [{ id: "order-87654321" }],
    ]);
    expect(container.querySelectorAll(".status")).toHaveLength(2);
    expect(
      [...container.querySelectorAll(".status")].every(
        (element) => element.textContent === "Đã hủy",
      ),
    ).toBe(true);
  });

  it.each([
    ["pending", "confirmed", "Đã xác nhận →"],
    ["confirmed", "shipping", "Đang giao →"],
    ["shipping", "delivered", "Đã giao →"],
  ] as const)(
    "preserves the admin %s to %s action",
    async (status, next, label) => {
      state.orders = [{ ...order, status }];
      await render({ ...user, role: "admin" });
      await act(async () => button(label).click());
      expect(state.update).toHaveBeenCalledExactlyOnceWith({
        id: order._id,
        status: next,
      });
      expect(state.cancel).not.toHaveBeenCalled();
      expect(feedback()).toBe("Đã cập nhật đơn hàng.");
    },
  );
});
