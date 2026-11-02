"use client";
import { useEffect, useState } from "react";
import { useSession } from "../components/providers";
import { request, type Endpoint } from "./shop-api";
export { api } from "./shop-api";

export function useQuery<A, R>(
  endpoint: Endpoint<A, R>,
  args: A | "skip",
): R | undefined {
  const { revision, reportError, user } = useSession();
  const argsKey = JSON.stringify(args);
  // Preserve the current view during a refresh, but never reuse another
  // account's private data after a sign-in or sign-out.
  const key = `${endpoint.path}:${argsKey}:${user?._id ?? "guest"}`;
  const [state, setState] = useState<{ key: string; data: R } | null>(null);
  useEffect(() => {
    if (argsKey === '"skip"') return;
    const controller = new AbortController();
    const parsed = JSON.parse(argsKey) as A;
    void request<R>(endpoint.path(parsed), "GET", undefined, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ key, data });
      })
      .catch((error) => {
        if (!controller.signal.aborted) reportError(error);
      });
    return () => controller.abort();
  }, [endpoint, key, argsKey, revision, reportError]);
  return args === "skip" || state?.key !== key ? undefined : state.data;
}
export function useMutation<A, R>(endpoint: Endpoint<A, R>) {
  const { refresh } = useSession();
  return async (args: A): Promise<R> => {
    const result = await request<R>(
      endpoint.path(args),
      endpoint.method,
      endpoint.body(args),
    );
    refresh();
    return result;
  };
}
