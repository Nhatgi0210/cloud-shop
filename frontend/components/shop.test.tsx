import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "../lib/types";
const state = vi.hoisted(() => ({
  user: null as User | null,
  isLoading: false,
  query: vi.fn<(...args: unknown[]) => undefined>(() => undefined),
}));
vi.mock("./providers", () => ({
  useSession: () => ({ ...state, openAuth: vi.fn(), logout: vi.fn() }),
}));
vi.mock("../lib/shop-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/shop-client")>()),
  useQuery: state.query,
  useMutation: () => vi.fn(),
}));
vi.mock("./account-panel", () => ({ AccountPanel: () => null }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
import { Shop } from "./shop";
describe("Nest session controls", () => {
  beforeEach(() => {
    state.user = null;
    state.isLoading = false;
    state.query.mockClear();
  });
  it("offers email sign-in to a signed-out visitor", () => {
    const html = renderToStaticMarkup(createElement(Shop));
    expect(html).toContain("Đăng nhập");
    expect(html).not.toContain("Menu tài khoản");
    expect(state.query.mock.calls[1]?.[1]).toBe("skip");
  });
  it("waits while checking the HTTP session", () => {
    state.isLoading = true;
    const html = renderToStaticMarkup(createElement(Shop));
    expect(html).toContain("Đang tải");
    expect(html).not.toContain("Đăng nhập</button>");
  });
  it("shows account controls and loads the cart after email sign-in", () => {
    state.user = {
      _id: "u1",
      _creationTime: 0,
      name: "Alice",
      email: "alice@example.com",
      role: "customer",
    };
    const html = renderToStaticMarkup(createElement(Shop));
    expect(html).toContain("Menu tài khoản");
    expect(html).toContain("Đăng xuất");
    expect(html).not.toContain("Đăng nhập</button>");
    expect(state.query.mock.calls[1]?.[1]).toEqual({});
    expect(html).not.toContain(">Quản trị</button>");
  });
});

describe("separate product catalog page", () => {
  it("places Products between Home and About without rendering the full catalog on home", () => {
    state.user = null;
    state.isLoading = false;
    const html = renderToStaticMarkup(createElement(Shop));
    const navigation =
      html.match(
        /<nav[^>]*aria-label="Điều hướng chính"[\s\S]*?<\/nav>/,
      )?.[0] ?? "";
    expect(navigation).toContain('href="/products"');
    expect(navigation.indexOf("Trang chủ")).toBeLessThan(
      navigation.indexOf("Sản phẩm"),
    );
    expect(navigation.indexOf("Sản phẩm")).toBeLessThan(
      navigation.indexOf("Về chúng tôi"),
    );
    expect(html).toContain('id="hero-title"');
    expect(html).not.toContain('id="collection"');
  });

  it("renders the full catalog and selects the Products navigation item on the product page", () => {
    const html = renderToStaticMarkup(
      createElement(Shop, { page: "products" }),
    );
    expect(html).toContain('id="products-title"');
    expect(html).toContain('id="collection"');
    expect(html).not.toContain('id="hero-title"');
    expect(html).not.toContain('id="popular-title"');
    expect(html).toMatch(/<a[^>]*aria-current="page"[^>]*>Sản phẩm<\/a>/);
  });
});
