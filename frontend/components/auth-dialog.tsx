"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "./providers";
import { Brand, Icon } from "./store-icons";

export function AuthDialog({ onClose }: { onClose: () => void }) {
  const { authenticate } = useSession();
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current?.showModal();
    return () => {
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="info-dialog auth-dialog"
      onCancel={onClose}
      aria-labelledby="auth-title"
    >
      <button className="close" onClick={onClose} aria-label="Đóng đăng nhập">
        <Icon name="close" />
      </button>
      <Brand />
      <h2 id="auth-title">
        {register ? "Bắt đầu hành trình mới." : "Chào mừng bạn trở lại."}
      </h2>
      <div className="tabs auth-tabs">
        <button
          disabled={busy}
          className={!register ? "chosen" : ""}
          onClick={() => {
            setRegister(false);
            setError("");
          }}
        >
          Đăng nhập
        </button>
        <button
          disabled={busy}
          className={register ? "chosen" : ""}
          onClick={() => {
            setRegister(true);
            setError("");
          }}
        >
          Đăng ký
        </button>
      </div>
      <form
        key={register ? "register" : "login"}
        onSubmit={async (event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setBusy(true);
          setError("");
          try {
            await authenticate(
              {
                email: String(data.get("email")),
                password: String(data.get("password")),
                ...(register ? { name: String(data.get("name")) } : {}),
              },
              register,
            );
            onClose();
          } catch (failure) {
            setError(
              failure instanceof Error
                ? failure.message
                : "Không thể đăng nhập. Vui lòng thử lại.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        {register && (
          <label>
            Họ và tên
            <input
              name="name"
              autoComplete="name"
              required
              maxLength={100}
              disabled={busy}
            />
          </label>
        )}
        <label>
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            disabled={busy}
          />
        </label>
        <label>
          Mật khẩu
          <input
            name="password"
            type="password"
            autoComplete={register ? "new-password" : "current-password"}
            required
            minLength={8}
            maxLength={128}
            disabled={busy}
          />
        </label>
        {register && <p className="subtle">Mật khẩu từ 8 đến 128 ký tự.</p>}
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        <button className="primary full" disabled={busy}>
          {busy ? "Đang xử lý…" : register ? "Tạo tài khoản" : "Đăng nhập"}
          <Icon name="arrow" size={17} />
        </button>
      </form>
    </dialog>
  );
}

export function AuthControls() {
  const { user, isLoading, openAuth, logout } = useSession();
  if (isLoading)
    return (
      <span className="subtle" role="status">
        Đang tải…
      </span>
    );
  if (!user)
    return (
      <button className="text-button" onClick={openAuth}>
        Đăng nhập
      </button>
    );
  return (
    <details className="account-menu">
      <summary aria-label="Menu tài khoản">
        <span className="account-avatar">
          {user.name.slice(0, 1).toUpperCase()}
        </span>
        <Icon name="chevron" size={14} />
      </summary>
      <div>
        <strong>{user.name}</strong>
        <span>{user.email}</span>
        <button
          onClick={(event) => {
            event.currentTarget.closest("details")?.removeAttribute("open");
            void logout();
          }}
        >
          Đăng xuất
        </button>
      </div>
    </details>
  );
}
