import { type NextRequest } from "next/server";

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  if (
    ![
      "auth",
      "admin",
      "users",
      "products",
      "categories",
      "variants",
      "cart",
      "orders",
    ].includes(path[0])
  )
    return Response.json({ message: "Không tìm thấy API." }, { status: 404 });
  const base = process.env.BACKEND_URL ?? "http://localhost:3001";
  const url = `${base.replace(/\/$/, "")}/api/${path.map(encodeURIComponent).join("/")}`;
  const headers = new Headers({ "Content-Type": "application/json" });
  for (const name of ["cookie", "origin"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  try {
    const upstream = await fetch(url, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method)
        ? undefined
        : await request.text(),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(20_000),
    });
    const responseHeaders = new Headers({
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    });
    for (const cookie of upstream.headers.getSetCookie())
      responseHeaders.append("Set-Cookie", cookie);
    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return Response.json(
      { message: "Không thể kết nối cửa hàng. Vui lòng thử lại sau." },
      { status: 503 },
    );
  }
}
export { proxy as GET, proxy as POST, proxy as PATCH, proxy as DELETE };
