"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { ApiError, request } from "../lib/shop-api";
import type { User } from "../lib/types";
import { AuthDialog } from "./auth-dialog";

type Credentials = { name?: string; email: string; password: string };
type Session = {
  user: User | null;
  isLoading: boolean;
  revision: number;
  openAuth: () => void;
  logout: () => Promise<void>;
  authenticate: (credentials: Credentials, register: boolean) => Promise<void>;
  refresh: () => void;
  reportError: (error: unknown) => void;
};
const Context = createContext<Session | null>(null);
export function useSession() {
  const value = useContext(Context);
  if (!value) throw new Error("Session provider is missing.");
  return value;
}
export function Providers({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [authOpen, setAuthOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const refresh = useCallback(() => {
    setRevision((value) => value + 1);
    setNotice("");
  }, []);
  const reportError = useCallback((error: unknown) => {
    if (error instanceof ApiError && error.status === 401) setUser(null);
    setNotice(
      error instanceof Error
        ? error.message
        : "Không thể tải dữ liệu cửa hàng.",
    );
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void request<User | null>("/auth/me", "GET", undefined, controller.signal)
      .then(setUser)
      .catch((error) => {
        if (
          !controller.signal.aborted &&
          !(error instanceof ApiError && error.status === 401)
        )
          reportError(error);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [reportError]);
  const authenticate = async (credentials: Credentials, register: boolean) => {
    setUser(
      await request<User>(
        register ? "/auth/register" : "/auth/login",
        "POST",
        credentials,
      ),
    );
    refresh();
  };
  const logout = async () => {
    try {
      await request("/auth/logout", "POST", {});
      setUser(null);
      refresh();
    } catch (error) {
      reportError(error);
    }
  };
  return (
    <Context.Provider
      value={{
        user,
        isLoading,
        revision,
        openAuth: () => setAuthOpen(true),
        logout,
        authenticate,
        refresh,
        reportError,
      }}
    >
      {notice && (
        <div className="notice" role="alert">
          {notice} <button onClick={refresh}>Thử lại</button>
        </div>
      )}
      {children}
      {authOpen && <AuthDialog onClose={() => setAuthOpen(false)} />}
    </Context.Provider>
  );
}
