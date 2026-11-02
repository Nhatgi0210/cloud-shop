"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useSession } from "../providers";
import { Brand, Icon } from "../store-icons";

const navigation = [
  { href: "/admin/orders", name: "Quản lý đơn hàng", symbol: "orders" },
  { href: "/admin/products", name: "Quản lý sản phẩm", symbol: "products" },
  { href: "/admin/users", name: "Quản lý người dùng", symbol: "users" },
];
export function AdminSymbol({ name }: { name: string }) {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === "orders" ? (
        <>
          <rect x="5" y="4" width="14" height="17" rx="2" />
          <path d="M9 4V2h6v2M9 10h6M9 14h6M9 18h3" />
        </>
      ) : name === "products" ? (
        <>
          <path d="m12 3 9 5-9 5-9-5 9-5ZM3 8v9l9 5 9-5V8M12 13v9M7 5l10 6" />
        </>
      ) : (
        <>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M21 21v-3a6 6 0 0 0-3-5" />
        </>
      )}
    </svg>
  );
}
export function AdminShell({ children }: { children: ReactNode }) {
  const { user, isLoading, openAuth, logout } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    if (open) window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  if (isLoading)
    return (
      <div className="admin-access" role="status">
        <Brand />
        <h1>Đang kiểm tra tài khoản…</h1>
      </div>
    );
  if (!user || user.role !== "admin")
    return (
      <div className="admin-access">
        <Brand />
        <span className="admin-access-icon">
          <AdminSymbol name="users" />
        </span>
        <h1>
          {user
            ? "Bạn không có quyền quản trị"
            : "Đăng nhập để quản lý cửa hàng"}
        </h1>
        <p>
          {user
            ? "Khu vực này dành cho tài khoản quản trị viên."
            : "Sử dụng tài khoản admin để truy cập dashboard CloudKicks."}
        </p>
        {!user && (
          <button className="primary" onClick={openAuth}>
            Đăng nhập
          </button>
        )}
        <Link href="/">
          Về cửa hàng <Icon name="arrow" size={16} />
        </Link>
      </div>
    );
  const current = navigation.find((item) => pathname.startsWith(item.href));
  return (
    <div className="admin-shell">
      <a className="skip-link" href="#admin-content">
        Đến nội dung quản trị
      </a>
      {open && (
        <button
          className="admin-backdrop"
          aria-label="Đóng thanh điều hướng"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`admin-sidebar ${open ? "sidebar-open" : ""}`}>
        <Link href="/" className="admin-brand">
          <Brand />
        </Link>
        <span className="admin-workspace">KHÔNG GIAN QUẢN TRỊ</span>
        <nav aria-label="Điều hướng quản trị">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname.startsWith(item.href) ? "page" : undefined}
              className={pathname.startsWith(item.href) ? "selected" : ""}
              onClick={() => setOpen(false)}
            >
              <AdminSymbol name={item.symbol} />
              <span>{item.name}</span>
              <Icon name="chevron" size={15} />
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <Link href="/">
            <Icon name="arrow" size={17} /> Xem cửa hàng
          </Link>
          <div className="admin-profile">
            <span className="account-avatar">
              {user.name.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <strong>{user.name}</strong>
              <small>Quản trị viên</small>
            </div>
          </div>
          <button onClick={() => void logout()}>
            Đăng xuất <Icon name="arrow" size={16} />
          </button>
        </div>
      </aside>
      <div className="admin-workarea">
        <header className="admin-topbar">
          <div>
            <button
              className="icon-button admin-menu-toggle"
              onClick={() => setOpen(!open)}
              aria-label="Mở điều hướng quản trị"
              aria-expanded={open}
            >
              <Icon name="menu" />
            </button>
            <span>
              Quản trị <span className="admin-divider">/</span>{" "}
              <strong>{current?.name}</strong>
            </span>
          </div>
          <Link href="/products">
            Đến cửa hàng <Icon name="arrow" size={16} />
          </Link>
        </header>
        <main id="admin-content" className="admin-content">
          {children}
        </main>
        <footer className="admin-page-footer">
          © 2026 CloudKicks <span>Không gian quản lý cửa hàng</span>
        </footer>
      </div>
    </div>
  );
}
