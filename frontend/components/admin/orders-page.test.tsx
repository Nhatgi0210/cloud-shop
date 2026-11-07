// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../lib/shop-api";
import { money } from "../../lib/format";
import type { Order, User } from "../../lib/types";

const state = vi.hoisted(() => ({
  orders: undefined as Order[] | undefined,
  user: null as User | null,
  query: vi.fn(),
  cancel: vi.fn(),
  update: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("../providers", () => ({
  useSession: () => ({ user: state.user, refresh: state.refresh }),
}));
vi.mock("../../lib/shop-client", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("../../lib/shop-client")>();
  return {
    ...original,
    useQuery: () => {
      state.query();
      return state.orders;
    },
    useMutation: (endpoint: unknown) =>
      endpoint === original.api.orders.cancel ? state.cancel : state.update,
  };
});
import { AdminOrdersPage } from "./orders-page";

const admin: User = {
  _id: "admin-a",
  _creationTime: 0,
  name: "Admin A",
  email: "admin-a@example.com",
  role: "admin",
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
      productName: "Giày lúc mua",
      variantName: "Trắng",
      size: 40,
      quantity: 2,
      unitPrice: 1230000,
    },
  ],
};
let container: HTMLDivElement;
let root: Root;
async function render() {
  await act(async () => root.render(createElement(AdminOrdersPage)));
}
function button(text: string) {
  const found = [...container.querySelectorAll("button")].find(
    (element) => element.textContent?.trim() === text,
  );
  expect(found, `button: ${text}`).toBeDefined();
  return found!;
}
function feedback() {
  return container.querySelector(".admin-feedback")?.textContent;
}
async function expand() {
  await act(async () => button("Chi tiết").click());
}
function deferred() {
  let resolve!: (value: null) => void;
  const promise = new Promise<null>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
beforeEach(async () => {
  (
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  state.orders = structuredClone([order]);
  state.user = { ...admin };
  state.query.mockReset();
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

describe("admin order dashboard", () => {
  it("provides keyboard access to the scroll area and identifies each order's controls", async () => {
    state.orders!.push({ ...order, _id: "order-87654321" });
    await render();
    const region = container.querySelector<HTMLElement>(
      '.admin-table-scroll[role="region"]',
    );
    expect(region?.getAttribute("aria-label")).toContain("Danh sách đơn hàng");
    region?.focus();
    expect(document.activeElement).toBe(region);
    const details = [
      ...container.querySelectorAll<HTMLButtonElement>("tbody button"),
    ];
    expect(details.map((button) => button.getAttribute("aria-label"))).toEqual([
      "Chi tiết đơn #12345678",
      "Chi tiết đơn #87654321",
    ]);
    await act(async () => details[1].click());
    const detail = document.getElementById(
      details[1].getAttribute("aria-controls") ?? "",
    );
    expect(detail).not.toBeNull();
    expect(detail?.textContent).toContain("123 Đường Demo");
    const cancel = detail!.querySelector<HTMLButtonElement>(
      'button[aria-label="Hủy đơn #87654321"]',
    )!;
    expect(cancel).not.toBeNull();
    expect(
      detail!.querySelector('button[aria-label="Đã xác nhận đơn #87654321"]'),
    ).not.toBeNull();
    await act(async () => cancel.click());
    expect(state.cancel).toHaveBeenCalledExactlyOnceWith({ id: "order-87654321" });
  });

  it("shows snapshot prices and shipping details", async () => {
    await expand();
    expect(container.textContent).toContain("#12345678");
    expect(container.textContent).toContain("8/11/2026");
    expect(container.textContent).toContain("Giày lúc mua · Trắng · EU 40 × 2");
    expect(container.textContent).toContain(
      `Đơn giá lúc mua: ${money(1230000)}`,
    );
    expect(container.textContent).toContain(money(2460000));
    expect(container.textContent).toContain("123 Đường Demo");
    expect(container.textContent).toContain("COD · Chưa thanh toán");
    expect(button("Chi tiết").getAttribute("aria-expanded")).toBe("true");
    await expand();
    expect(container.querySelector(".admin-order-detail")).toBeNull();
  });

  it("searches by code, name or phone and combines the status filter", async () => {
    state.orders = [
      order,
      {
        ...order,
        _id: "order-87654321",
        shippingName: "Trần Bình",
        shippingPhone: "0912345678",
        status: "shipping",
        totalAmount: 1000000,
      },
    ];
    await render();
    const input = container.querySelector("input")!;
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!;
    for (const text of ["87654321", "TRẦN BÌNH", "0912345678"]) {
      await act(async () => {
        setter.call(input, text);
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
      expect(container.querySelector("tbody")?.textContent).toContain(
        "#87654321",
      );
      expect(container.querySelector("tbody")?.textContent).not.toContain(
        "#12345678",
      );
    }
    const select = container.querySelector("select")!;
    await act(async () => {
      select.value = "pending";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(container.textContent).toContain("Chưa có đơn hàng phù hợp");
    // Statistics describe all loaded records, even when the filter has no matches.
    expect(container.querySelector(".admin-stat strong")?.textContent).toBe(
      "2",
    );
  });

  it("distinguishes initial loading from no orders", async () => {
    state.orders = undefined;
    await render();
    expect(container.textContent).toContain("Đang tải dữ liệu");
    state.orders = [];
    await render();
    expect(container.textContent).toContain("Chưa có đơn hàng phù hợp");
    expect(container.textContent).not.toContain("Đang tải dữ liệu");
  });

  it.each([null, { ...admin, role: "customer" as const }])(
    "hides private data and skips querying for a non-admin session %s",
    async (user) => {
      state.user = user;
      state.query.mockClear();
      await render();
      expect(container.textContent).not.toContain(order.shippingName);
      expect(state.query).not.toHaveBeenCalled();
    },
  );

  it("identifies the order in cancellation confirmation and respects decline", async () => {
    await expand();
    vi.mocked(window.confirm).mockReturnValue(false);
    await act(async () => button("Hủy đơn").click());
    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining("#12345678"),
    );
    expect(state.cancel).not.toHaveBeenCalled();
  });

  it("blocks duplicate and competing actions before rerender", async () => {
    const pending = deferred();
    state.update.mockReturnValue(pending.promise);
    await expand();
    const update = button("Đã xác nhận"),
      cancel = button("Hủy đơn");
    await act(async () => {
      update.click();
      update.click();
      cancel.click();
    });
    expect(state.update).toHaveBeenCalledExactlyOnceWith({
      id: order._id,
      status: "confirmed",
    });
    expect(state.cancel).not.toHaveBeenCalled();
    expect(feedback()).toContain("Đang cập nhật");
    expect(button("Làm mới danh sách").disabled).toBe(true);
    await act(async () => pending.resolve(null));
  });

  it.each([
    ["pending", "confirmed", "Đã xác nhận", "Đang giao"],
    ["confirmed", "shipping", "Đang giao", "Đã giao"],
    ["shipping", "delivered", "Đã giao", null],
  ] as const)(
    "retains %s → %s during a stale GET and unlocks after acknowledgement",
    async (from, to, action, following) => {
      state.orders = [{ ...order, status: from }];
      await render();
      await expand();
      await act(async () => button(action).click());
      expect(state.update).toHaveBeenCalledExactlyOnceWith({
        id: order._id,
        status: to,
      });
      expect(container.querySelector(".admin-badge")?.textContent).toBe(action);
      expect(feedback()).toContain("#12345678");
      if (following) expect(button(following).disabled).toBe(true);
      expect(
        container.querySelector(".admin-row-actions")?.textContent,
      ).not.toContain("Hủy đơn");
      if (to === "delivered")
        expect(container.textContent).toContain("COD · Đã thanh toán");
      state.orders = undefined;
      await render();
      state.orders = [{ ...order, status: from }];
      await render();
      expect(container.querySelector(".admin-badge")?.textContent).toBe(action);
      state.orders = [
        {
          ...order,
          status: to,
          paymentStatus: to === "delivered" ? "paid" : "unpaid",
        },
      ];
      await render();
      if (following) expect(button(following).disabled).toBe(false);
    },
  );

  it("retains successful cancellation through stale GETs and blocks another action", async () => {
    const pending = deferred();
    state.cancel.mockReturnValue(pending.promise);
    await expand();
    const cancel = button("Hủy đơn"),
      update = button("Đã xác nhận");
    await act(async () => {
      cancel.click();
      cancel.click();
      update.click();
    });
    expect(state.cancel).toHaveBeenCalledExactlyOnceWith({ id: order._id });
    expect(state.update).not.toHaveBeenCalled();
    await act(async () => pending.resolve(null));
    expect(container.querySelector(".admin-badge")?.textContent).toBe("Đã hủy");
    expect(container.querySelector(".admin-row-actions button")).toBeNull();
    await render();
    expect(container.querySelector(".admin-badge")?.textContent).toBe("Đã hủy");
  });

  it.each([400, 409, 503])(
    "shows a recoverable update error %s with manual refresh",
    async (code) => {
      state.update.mockRejectedValueOnce(
        new ApiError("Không thể cập nhật", code),
      );
      await expand();
      await act(async () => button("Đã xác nhận").click());
      expect(feedback()).toContain("Không thể cập nhật");
      expect(feedback()).toContain("làm mới danh sách");
      expect(feedback()).not.toContain("Đã cập nhật");
      expect(button("Đã xác nhận").disabled).toBe(false);
      await act(async () => button("Làm mới danh sách").click());
      expect(state.refresh).toHaveBeenCalledOnce();
      state.orders = [{ ...order, status: "shipping" }];
      await render();
      expect(container.querySelector(".admin-badge")?.textContent).toBe(
        "Đang giao",
      );
      expect(
        container.querySelector(".admin-row-actions")?.textContent,
      ).not.toContain("Hủy đơn");
    },
  );

  it.each(["delivered", "cancelled"] as const)(
    "offers no mutation for terminal status %s",
    async (status) => {
      state.orders = [{ ...order, status }];
      await render();
      await expand();
      expect(container.querySelector(".admin-row-actions button")).toBeNull();
    },
  );

  it("continues through all delivery steps only after each server acknowledgement", async () => {
    await expand();
    for (const [status, action] of [
      ["confirmed", "Đã xác nhận"],
      ["shipping", "Đang giao"],
      ["delivered", "Đã giao"],
    ] as const) {
      await act(async () => button(action).click());
      state.orders = [
        {
          ...order,
          status,
          paymentStatus: status === "delivered" ? "paid" : "unpaid",
        },
      ];
      await render();
    }
    expect(state.update.mock.calls).toEqual([
      [{ id: order._id, status: "confirmed" }],
      [{ id: order._id, status: "shipping" }],
      [{ id: order._id, status: "delivered" }],
    ]);
    expect(container.querySelector(".admin-row-actions button")).toBeNull();
    expect(
      container.querySelectorAll(".admin-stat strong")[3].textContent,
    ).toBe(money(order.totalAmount));
  });

  it("preserves payment data from GET without inferring a successful payment", async () => {
    state.orders = [{ ...order, status: "delivered", paymentStatus: "unpaid" }];
    await render();
    expect(container.textContent).toContain("COD · Chưa thanh toán");
    expect(
      container.querySelectorAll(".admin-stat strong")[3].textContent,
    ).toBe(money(0));
  });

  it("accepts a newer server status and keeps independent actions available on other orders", async () => {
    await expand();
    await act(async () => button("Đã xác nhận").click());
    state.orders = [order, { ...order, _id: "order-87654321" }];
    await render();
    const details = container.querySelectorAll(
      "tbody > tr:not(.admin-detail-row) button",
    );
    await act(async () => (details[1] as HTMLButtonElement).click());
    expect(button("Đã xác nhận").disabled).toBe(false);
    await act(async () => button("Đã xác nhận").click());
    expect(state.update).toHaveBeenLastCalledWith({
      id: "order-87654321",
      status: "confirmed",
    });
    state.orders = [{ ...order, status: "shipping" }];
    await render();
    expect(container.querySelector(".admin-badge")?.textContent).toBe(
      "Đang giao",
    );
    await expand();
    expect(button("Đã giao").disabled).toBe(false);
  });

  it("does not claim cancellation success on a network error and allows retry after refreshing", async () => {
    state.cancel.mockRejectedValueOnce(new TypeError("Mất kết nối"));
    await expand();
    await act(async () => button("Hủy đơn").click());
    expect(feedback()).toContain(
      "Chưa xác định thao tác đã thành công hay chưa",
    );
    expect(container.querySelector(".admin-badge")?.textContent).toBe(
      "Chờ xác nhận",
    );
    expect(button("Hủy đơn").disabled).toBe(false);
    await act(async () => button("Làm mới danh sách").click());
    await render();
    await act(async () => button("Hủy đơn").click());
    expect(state.cancel).toHaveBeenCalledTimes(2);
    expect(container.querySelector(".admin-badge")?.textContent).toBe("Đã hủy");
  });

  it("clears filters, details and a late mutation result on switching admin accounts", async () => {
    const pending = deferred();
    state.cancel.mockReturnValue(pending.promise);
    const select = container.querySelector("select")!;
    await act(async () => {
      select.value = "pending";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await expand();
    await act(async () => button("Hủy đơn").click());
    state.user = { ...admin, _id: "admin-b" };
    state.orders = [];
    await render();
    await act(async () => pending.resolve(null));
    expect(feedback()).toBe("");
    expect(container.querySelector("select")?.value).toBe("");
    expect(container.textContent).not.toContain(order.shippingName);
    state.orders = [{ ...order, shippingName: "Khách mới" }];
    await render();
    expect(container.querySelector(".admin-order-detail")).toBeNull();
    await expand();
    expect(button("Hủy đơn").disabled).toBe(false);
  });
});
