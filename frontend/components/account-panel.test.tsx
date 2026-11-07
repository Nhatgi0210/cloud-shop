// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CartItem, User } from "../lib/types";
import { ApiError } from "../lib/shop-api";

const state = vi.hoisted(() => ({
  cart: undefined as CartItem[] | undefined,
  place: vi.fn(),
  mutate: vi.fn(),
}));
vi.mock("../lib/shop-client", async (importOriginal) => {
  const original = await importOriginal<typeof import("../lib/shop-client")>();
  return {
    ...original,
    useQuery: () => state.cart,
    useMutation: (endpoint: unknown) =>
      endpoint === original.api.orders.place ? state.place : state.mutate,
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
let container: HTMLDivElement;
let root: Root;

async function render(account = user) {
  await act(async () => {
    root.render(
      createElement(AccountPanel, {
        view: "cart",
        user: account,
        goShopping: vi.fn(),
      }),
    );
  });
}
function field(name: string) {
  return container.querySelector<HTMLInputElement | HTMLTextAreaElement>(
    `[name="${name}"]`,
  )!;
}
function fill(
  name = "Nguyễn An",
  phone = "0901234567",
  address = "123 Đường Demo",
) {
  field("name").value = name;
  field("phone").value = phone;
  field("address").value = address;
}
function submit() {
  container
    .querySelector("form")!
    .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
}

beforeEach(async () => {
  (
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  state.cart = [
    {
      _id: "cart-a",
      quantity: 2,
      size: 40,
      product: { name: "Giày Demo" },
      variant: {
        _id: "variant-a",
        name: "Trắng",
        price: 1000000,
        imageUrl: "",
        sold: 0,
        sizes: [{ size: 40, stock: 5 }],
      },
    },
  ];
  state.place.mockReset().mockResolvedValue("order-12345678");
  state.mutate.mockReset().mockResolvedValue(null);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await render();
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

describe("COD checkout", () => {
  it.each([
    ["", "", "", "name"],
    ["   ", "0901234567", "123 Đường Demo", "name"],
    [" A ", "0901234567", "123 Đường Demo", "name"],
    ["A".repeat(101), "0901234567", "123 Đường Demo", "name"],
    ["Nguyễn An", "12345", "123 Đường Demo", "phone"],
    ["Nguyễn An", "0901234567", " 123456789 ", "address"],
    ["Nguyễn An", "0901234567", "A".repeat(501), "address"],
  ])(
    "rejects invalid shipping data and focuses %s / %s / %s",
    async (name, phone, address, invalid) => {
      fill(name, phone, address);
      await act(async () => submit());
      expect(state.place).not.toHaveBeenCalled();
      expect(field(invalid).getAttribute("aria-invalid")).toBe("true");
      expect(document.activeElement).toBe(field(invalid));
      expect(
        container.querySelector('[role="status"]')?.textContent,
      ).toBeTruthy();
    },
  );

  it.each([
    [" An ", " 0901234567 ", " 1234567890 "],
    ["A".repeat(100), "+84901234567", "A".repeat(500)],
  ])(
    "trims valid boundaries and sends only shipping fields",
    async (name, phone, address) => {
      fill(name, phone, address);
      await act(async () => submit());
      expect(state.place).toHaveBeenCalledExactlyOnceWith({
        shippingName: name.trim(),
        shippingPhone: phone.trim(),
        shippingAddress: address.trim(),
      });
    },
  );

  it("locks duplicate submits immediately and keeps success when the cart GET is stale", async () => {
    let resolve!: (id: string) => void;
    state.place.mockImplementation(
      () =>
        new Promise<string>((done) => {
          resolve = done;
        }),
    );
    fill();
    await act(async () => {
      submit();
      submit();
    });
    expect(state.place).toHaveBeenCalledTimes(1);
    expect(
      container.querySelector<HTMLButtonElement>('button[type="submit"]')
        ?.disabled,
    ).toBe(true);
    await act(async () => resolve("order-12345678"));
    expect(container.textContent).toContain("Đặt hàng thành công");
    expect(container.textContent).toContain("12345678");
    expect(container.querySelector("form")).toBeNull();
    // An old cart or failed refresh must never expose another checkout submit.
    await render();
    expect(container.querySelector("form")).toBeNull();
    state.cart = undefined;
    await render();
    expect(container.textContent).toContain("Đặt hàng thành công");
    expect(state.place).toHaveBeenCalledTimes(1);
  });

  it("preserves the form after a rejected checkout and allows retry", async () => {
    state.place.mockRejectedValueOnce(
      new Error("Size đã hết hoặc không đủ hàng."),
    );
    fill();
    await act(async () => submit());
    expect(container.textContent).toContain("Size đã hết hoặc không đủ hàng.");
    expect(field("name").value).toBe("Nguyễn An");
    expect(field("phone").value).toBe("0901234567");
    expect(field("address").value).toBe("123 Đường Demo");
    await act(async () => submit());
    expect(state.place).toHaveBeenCalledTimes(2);
    expect(container.textContent).toContain("Đặt hàng thành công");
  });

  it("resets shipping data and validation when the account changes", async () => {
    fill(" ");
    await act(async () => submit());
    await render({ ...user, _id: "customer-b", name: "Khách B" });
    expect(field("name").value).toBe("");
    expect(field("phone").value).toBe("");
    expect(field("address").value).toBe("");
    expect(field("name").getAttribute("aria-invalid")).not.toBe("true");
  });

  it("does not apply the old account's late checkout result to the new account", async () => {
    let resolve!: (id: string) => void;
    state.place.mockImplementation(
      () =>
        new Promise<string>((done) => {
          resolve = done;
        }),
    );
    fill();
    await act(async () => submit());
    await render({ ...user, _id: "customer-b", name: "Khách B" });
    field("name").focus();
    await act(async () => resolve("order-of-customer-a"));
    expect(container.textContent).not.toContain("Đặt hàng thành công");
    expect(document.activeElement).toBe(field("name"));
    expect(field("name").value).toBe("");
    expect(
      container.querySelector<HTMLButtonElement>('button[type="submit"]')
        ?.disabled,
    ).toBe(false);
  });

  it.each([
    new ApiError("Không thể kết nối cửa hàng.", 503),
    new TypeError("Failed to fetch"),
  ])(
    "asks the customer to check orders after an uncertain POST: %s",
    async (error) => {
      state.place.mockRejectedValueOnce(error);
      fill();
      await act(async () => submit());
      expect(container.textContent).toContain(
        "kiểm tra mục Đơn hàng trước khi gửi lại",
      );
      expect(container.textContent).not.toContain("Đặt hàng thành công");
      expect(field("address").value).toBe("123 Đường Demo");
      expect(
        container.querySelector<HTMLButtonElement>('button[type="submit"]')
          ?.disabled,
      ).toBe(false);
    },
  );

  it("allows correcting a rejected checkout without suggesting an order was created", async () => {
    state.place.mockRejectedValueOnce(new ApiError("Size không đủ hàng.", 400));
    fill();
    await act(async () => submit());
    expect(container.querySelector(".feedback")?.textContent).toContain(
      "Size không đủ hàng.",
    );
    expect(container.textContent).not.toContain("Chưa xác định");
    expect(field("address").value).toBe("123 Đường Demo");
    await act(async () => submit());
    expect(state.place).toHaveBeenCalledTimes(2);
  });

  it("announces checkout progress and moves focus to success only once", async () => {
    let resolve!: (id: string) => void;
    state.place.mockImplementation(
      () => new Promise<string>((done) => { resolve = done; }),
    );
    fill();
    await act(async () => submit());
    expect(
      container.querySelector('.feedback[role="status"]')?.textContent,
    ).toContain("Đang đặt đơn");
    await act(async () => resolve("order-12345678"));
    expect(document.activeElement?.textContent).toBe("Đặt hàng thành công!");
    const shopping = container.querySelector<HTMLButtonElement>(".empty button")!;
    shopping.focus();
    state.cart = [];
    await render();
    expect(document.activeElement).toBe(shopping);
  });

  it("keeps a successful POST visible when the shared client returns no order ID", async () => {
    state.place.mockResolvedValueOnce(null);
    fill();
    await act(async () => submit());
    expect(container.textContent).toContain("Đặt hàng thành công");
    expect(container.textContent).toContain("Đơn hàng");
    expect(container.textContent).not.toContain("#NULL");
    expect(container.querySelector("form")).toBeNull();
    await render();
    expect(container.querySelector("form")).toBeNull();
    expect(state.place).toHaveBeenCalledTimes(1);
  });
});

function quantityInput() {
  return container.querySelector<HTMLInputElement>('input[type="number"]')!;
}

async function changeQuantity(value: string) {
  const input = quantityInput();
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )!.set!;
  await act(async () => {
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

describe("cart quantities and unavailable rows", () => {
  it("distinguishes removal controls for the same shoe in different sizes", async () => {
    state.cart!.push({ ...state.cart![0], _id: "cart-b", size: 41 });
    await render();
    const buttons = [
      ...container.querySelectorAll<HTMLButtonElement>(".cart-row button"),
    ];
    expect(buttons.map((button) => button.getAttribute("aria-label"))).toEqual([
      "Xóa Giày Demo / Trắng / Size 40 khỏi giỏ",
      "Xóa Giày Demo / Trắng / Size 41 khỏi giỏ",
    ]);
    await act(async () => buttons[1].click());
    expect(state.mutate).toHaveBeenCalledExactlyOnceWith({ id: "cart-b" });
  });

  it("announces a pending cart change and recovers after a network failure", async () => {
    let reject!: (error: Error) => void;
    state.mutate.mockImplementation(
      () => new Promise<null>((_, fail) => { reject = fail; }),
    );
    await changeQuantity("3");
    expect(
      container.querySelector('.feedback[role="status"]')?.textContent,
    ).toContain("Đang cập nhật giỏ hàng");
    await act(async () => reject(new TypeError("Failed to fetch")));
    expect(quantityInput().disabled).toBe(false);
    expect(quantityInput().value).toBe("2");
    expect(container.querySelector(".feedback")?.textContent).toContain("Failed to fetch");
    state.mutate.mockResolvedValueOnce(null);
    await changeQuantity("3");
    expect(state.mutate).toHaveBeenCalledTimes(2);
  });

  it.each(["", "0", "-1", "1.5", "6"])(
    "rejects quantity %s before sending a mutation",
    async (value) => {
      await changeQuantity(value);
      expect(state.mutate).not.toHaveBeenCalled();
      expect(container.querySelector(".feedback")?.textContent).toBeTruthy();
      expect(quantityInput().value).toBe("2");
    },
  );

  it("sends valid quantities and uses the refreshed server total", async () => {
    await changeQuantity("3");
    expect(state.mutate).toHaveBeenCalledExactlyOnceWith({
      id: "cart-a",
      quantity: 3,
    });
    state.cart = [{ ...state.cart![0], quantity: 3 }];
    await render();
    expect(quantityInput().value).toBe("3");
    expect(container.querySelector(".total")?.textContent).toContain(
      "3.000.000",
    );
    expect(container.querySelector(".cart-row")?.textContent).toContain(
      "3.000.000",
    );
  });

  it("does not send a mutation when the quantity has not changed", async () => {
    await changeQuantity("2");
    expect(state.mutate).not.toHaveBeenCalled();
  });

  it.each(["product", "variant", "stock"])(
    "blocks checkout for an unavailable %s and keeps removal usable",
    async (missing) => {
      if (missing === "stock") state.cart![0].variant!.sizes[0].stock = 1;
      else if (missing === "product") state.cart![0].product = null;
      else state.cart![0].variant = null;
      await render();
      if (missing === "variant") {
        expect(container.querySelector(".total")?.textContent).toContain(
          "Chưa xác định",
        );
      }
      expect(
        container.querySelector<HTMLButtonElement>('button[type="submit"]')
          ?.disabled,
      ).toBe(true);
      fill();
      await act(async () => submit());
      expect(state.place).not.toHaveBeenCalled();
      const remove =
        container.querySelector<HTMLButtonElement>(".cart-row button")!;
      expect(remove.disabled).toBe(false);
      await act(async () => remove.click());
      expect(state.mutate).toHaveBeenCalledExactlyOnceWith({ id: "cart-a" });
    },
  );

  it("preserves the server quantity and shows an error when the PATCH is rejected", async () => {
    state.mutate.mockRejectedValueOnce(
      new ApiError("Số lượng vượt tồn kho hoặc không hợp lệ.", 400),
    );
    await changeQuantity("3");
    expect(quantityInput().value).toBe("2");
    expect(container.textContent).toContain(
      "Số lượng vượt tồn kho hoặc không hợp lệ.",
    );
    expect(quantityInput().disabled).toBe(false);
  });

  it("locks repeated removals and shows the empty cart only after the refreshed result", async () => {
    let resolve!: (value: null) => void;
    state.mutate.mockImplementation(
      () =>
        new Promise<null>((done) => {
          resolve = done;
        }),
    );
    const remove =
      container.querySelector<HTMLButtonElement>(".cart-row button")!;
    await act(async () => {
      remove.click();
      remove.click();
    });
    expect(state.mutate).toHaveBeenCalledTimes(1);
    expect(container.querySelector(".cart-row")).not.toBeNull();
    expect(quantityInput().disabled).toBe(true);
    await act(async () => resolve(null));
    state.cart = [];
    await render();
    expect(container.textContent).toContain("Giỏ hàng đang trống");
    expect(container.querySelector("form")).toBeNull();
  });

  it("keeps the cart row and allows retry when removal fails", async () => {
    state.mutate.mockRejectedValueOnce(
      new ApiError("Không thể xóa giỏ hàng.", 503),
    );
    const remove =
      container.querySelector<HTMLButtonElement>(".cart-row button")!;
    await act(async () => remove.click());
    expect(container.querySelector(".cart-row")).not.toBeNull();
    expect(container.textContent).toContain("Không thể xóa giỏ hàng.");
    expect(remove.disabled).toBe(false);
    await act(async () => remove.click());
    expect(state.mutate).toHaveBeenCalledTimes(2);
  });
});
