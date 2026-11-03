# Cloud Shop Backend

NestJS REST API trên port 3001, dùng database và nghiệp vụ trong `convex/`. Xác thực bằng email/mật khẩu scrypt và JWT RS256 lưu trong cookie HttpOnly.

```powershell
npm.cmd ci
npm.cmd run convex:dev
```

Terminal khác, thiết lập lần đầu và chạy Nest:

```powershell
npm.cmd run auth:setup
npm.cmd run convex:seed
npm.cmd run start:dev
```

Xem [README chính](../README.md) để cấu hình môi trường, chạy frontend, cấp admin và triển khai. Không có tài khoản mặc định; đăng ký trên giao diện.

API public: `GET /api/products`, `GET /api/categories`. Auth: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`. Giỏ hàng, đơn hàng và thao tác sản phẩm ghi dữ liệu yêu cầu phiên đăng nhập; Convex kiểm tra quyền admin/ownership.

Admin: `GET /api/admin/products` (gồm sản phẩm ẩn), `PATCH /api/products/:id/restore`, `GET /api/users`, `PATCH /api/users/:id/role` với JSON `{ "role": "admin" | "customer" }`. Các hàm Convex kiểm tra lại quyền admin, lọc trường nhạy cảm khỏi danh sách tài khoản và chặn tự đổi quyền.
