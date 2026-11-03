import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect, vi } from "vitest";
import type { User } from "../../lib/types";
const state = vi.hoisted(() => ({
  user: null as User | null,
  isLoading: false,
}));
vi.mock("../providers", () => ({
  useSession: () => ({ ...state, openAuth: vi.fn(), logout: vi.fn() }),
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/admin/orders" }));
import { AdminShell } from "./admin-shell";
describe("admin workspace access", () => {
  it("keeps private panels hidden for visitors and customers", () => {
    state.user = null;
    expect(
      renderToStaticMarkup(createElement(AdminShell, null, "PRIVATE PANEL")),
    ).not.toContain("PRIVATE PANEL");
    state.user = {
      _id: "u1",
      _creationTime: 0,
      name: "Customer",
      email: "customer@example.com",
      role: "customer",
    };
    const html = renderToStaticMarkup(
      createElement(AdminShell, null, "PRIVATE PANEL"),
    );
    expect(html).toContain("Bạn không có quyền quản trị");
    expect(html).not.toContain("PRIVATE PANEL");
  });
  it("renders three real navigation routes and private content for admins", () => {
    state.user = {
      _id: "u1",
      _creationTime: 0,
      name: "Admin",
      email: "admin@example.com",
      role: "admin",
    };
    const html = renderToStaticMarkup(
      createElement(AdminShell, null, "PRIVATE PANEL"),
    );
    for (const path of ["orders", "products", "users"])
      expect(html).toContain(`href="/admin/${path}"`);
    expect(html).toContain('aria-current="page"');
    expect(html).toContain("PRIVATE PANEL");
  });
});
