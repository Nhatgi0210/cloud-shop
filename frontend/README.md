# Cloud Shop Frontend

Next.js App Router hiển thị giao diện CloudKicks và proxy `/api/*` đến NestJS. Không dùng Clerk hay Convex React.

```powershell
npm.cmd ci
npm.cmd run dev
```

Đặt `BACKEND_URL=http://localhost:3001` trong `.env.local`. Chạy thêm Nest và Convex từ `../backend/` theo [README chính](../README.md). Đăng ký/đăng nhập dùng email và mật khẩu.

Kiểm tra: `npm.cmd test`, `npm.cmd run lint`, `npm.cmd run build`.
