# CloudKicks — Next.js + NestJS + Convex

Kiến trúc: **trình duyệt → Next.js `/api` → NestJS → Convex**. Schema và toàn bộ nghiệp vụ database nằm trong `backend/convex/`. Frontend giữ giao diện CloudKicks hiện tại và gọi REST API; không còn Clerk hoặc Convex client trong trình duyệt.

## Chạy dự án

Dùng Node.js 22.22.3+ trong nhánh 22, hoặc Node.js 24.15+.

Cài dependencies một lần:

```powershell
cd backend
npm.cmd ci
cd ../frontend
npm.cmd ci
```

Thiết lập backend lần đầu, từ `backend/`:

```powershell
npm.cmd run convex:dev
```

Chọn deployment phát triển của backend, giữ terminal này chạy. Terminal mới, vẫn trong `backend/`:

```powershell
npm.cmd run auth:setup
npm.cmd run convex:seed
npm.cmd run start:dev
```

`auth:setup` tạo khóa RSA và secret trong `backend/.env.local`, đồng bộ public JWKS và secret đăng ký/đăng nhập vào Convex development. Nếu terminal Convex đang báo thiếu `NEST_JWKS_BASE64`, chạy `auth:setup` ở terminal khác rồi chờ đồng bộ lại. Script giữ nguyên khóa đã tạo khi chạy lại. `convex:seed` chỉ khởi tạo database chưa có sản phẩm, không xóa/ghi đè dữ liệu.

Terminal frontend:

```powershell
cd frontend
npm.cmd run dev
```

Mở **http://localhost:3000**. NestJS chạy ở **http://localhost:3001**. Mở **Đăng nhập → Đăng ký**, nhập họ tên, email và mật khẩu 8–128 ký tự. Không có tài khoản/mật khẩu mặc định. Nếu môi trường hiện tại đã được cấu hình, chỉ cần chạy ba terminal: Convex, Nest và Next.js.

## Cấu hình

- `frontend/.env.local`: `BACKEND_URL=http://localhost:3001`. Đây là biến server-only; trình duyệt chỉ gọi `/api` cùng origin.
- `backend/.env.local`: `CONVEX_DEPLOYMENT`, `CONVEX_URL`, `PORT=3001`, `FRONTEND_ORIGIN=http://localhost:3000`, cùng ba biến khóa do `auth:setup` tạo.
- Chỉ chạy Convex từ **backend/**. Không chạy lại Convex từ frontend.
- Khi triển khai, đặt `BACKEND_URL` thành URL HTTPS của Nest và `FRONTEND_ORIGIN` thành origin chính xác của frontend. Cấu hình riêng khóa/secret trên backend và Convex production; script setup mặc định chỉ cấu hình development.
- Không commit các file `.env.local`, private key hoặc secret. Không cần cấu hình Clerk nữa.

## Tài khoản và phân quyền

Mật khẩu được băm bằng scrypt với salt riêng. Nest ký JWT RS256, lưu trong cookie HttpOnly/SameSite, hết hạn sau một giờ; trình duyệt không lưu token trong localStorage. Convex xác minh chữ ký bằng public JWKS và tìm người dùng theo `tokenIdentifier`. Đăng xuất tăng `sessionVersion` để thu hồi các token cũ của tài khoản. API lấy lại quyền từ database, không tin role hay userId gửi từ frontend. Giới hạn đăng nhập/đăng ký hiện áp dụng trong từng tiến trình Nest.

Đăng ký tài khoản trước, sau đó cấp admin từ `backend/`:

```powershell
npx.cmd convex run users:setAdmin '{"email":"email-cua-ban@example.com"}'
```

Nếu PowerShell thay đổi JSON, chạy internal mutation `users:setAdmin` trong Convex Dashboard với cùng đối số. Không tự cấp admin cho người đăng ký đầu tiên.

Sau khi cấp quyền, tải lại website và mở **Quản trị** hoặc `/admin`. Dashboard có sidebar và các trang riêng:

- `/admin/orders`: tìm/lọc đơn, xem chi tiết, hủy đơn hợp lệ và cập nhật tiến trình giao hàng.
- `/admin/products`: tìm/lọc sản phẩm, thêm/sửa mẫu giày và biến thể, cập nhật giá/kho, ẩn/hiển thị lại sản phẩm.
- `/admin/users`: xem/tìm tài khoản, lọc vai trò và đổi quyền customer/admin. Không cho tự đổi quyền; tài khoản được đổi quyền cần đăng nhập lại.

Danh sách admin hiện giới hạn 100 bản ghi gần nhất. Tài khoản khách không được gọi API quản trị dù truy cập trực tiếp URL.

Tài khoản Clerk ở deployment frontend cũ không được tự động liên kết với tài khoản mật khẩu mới. Hai deployment vẫn tách biệt; dữ liệu frontend cũ không bị xóa. Schema backend cũ được thay bằng schema giày, giữ kiểm tra schema của Convex; nếu deployment khác có dữ liệu cũ không tương thích, cần sao lưu và migration rõ ràng trước khi đồng bộ. Không tắt schema validation hoặc xóa bảng để vượt lỗi.

## Chức năng

- Danh mục giày, biến thể, ảnh, giá VND, size, tồn kho và số đã bán.
- Tìm kiếm/lọc/sắp xếp; yêu thích lưu trên trình duyệt.
- Email/mật khẩu, giỏ hàng theo tài khoản, checkout COD, lịch sử đơn và hủy đơn chờ xác nhận.
- Quản trị sản phẩm/biến thể/danh mục/kho và quy trình xác nhận → giao hàng → hoàn tất.
- Checkout lấy giá từ database, trừ kho và xóa giỏ trong cùng transaction. Hủy đơn chỉ hoàn kho một lần.
- Danh sách được tải qua REST và làm mới sau thay đổi; không còn subscription Convex trực tiếp ở frontend.

## Kiểm tra

```powershell
# Trong backend/
npm.cmd test
npm.cmd run test:e2e
npm.cmd run lint
npm.cmd run build

# Trong frontend/
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

Các bài kiểm thử tự động dùng mock hoặc Convex test độc lập, không kết nối database cloud.
