# Hiện trạng và phân công nhóm 4 người — Cloud Shop

## 1. Hướng phát triển đã chọn

Website bán giày dùng **Next.js App Router + TypeScript + NestJS + Convex**. Frontend nằm trong `frontend/`, gọi API NestJS qua proxy `/api`. Nest và toàn bộ Convex nằm trong `backend/`. Tài khoản dùng email/mật khẩu và cookie HttpOnly; đã bỏ Clerk.

Tài liệu kế hoạch do nhóm cung cấp là mục tiêu triển khai. Những chức năng được nêu trong kế hoạch không mặc nhiên đã có trong code. Bảng dưới đối chiếu mã nguồn hiện tại; không xác nhận trạng thái tài khoản hoặc deployment cloud của từng thành viên.

## 2. Dự án đang ở bước nào?

**Đã có nền tảng và bản mẫu chức năng; đang chuyển sang hoàn thiện MVP và tích hợp nhóm.** Chưa coi là bản demo production hoàn chỉnh. Không gán phần trăm hoàn thành vì giao diện, kiểm thử thực tế và triển khai vẫn cần nghiệm thu.

| Hạng mục | Hiện trạng | Phần cần tiếp tục |
| --- | --- | --- |
| Kiến trúc mới | Next.js gọi NestJS; Nest chuyển JWT người dùng đến Convex | Cả nhóm xác nhận đổi kiến trúc và chạy được cùng phiên bản code |
| Database giày | Có 7 bảng: users, categories, products, productVariants, cartItems, orders, orderItems | Review schema/API, thống nhất cách quản lý size, biến thể và dữ liệu mẫu |
| Đăng nhập/phân quyền | Có đăng ký/đăng nhập email-mật khẩu, thu hồi phiên khi đăng xuất, customer/admin và kiểm tra quyền trong Convex | Xác nhận đăng nhập/đăng xuất thật, quyền customer/admin trên deployment mới |
| Storefront | Có catalog, lọc/tìm client-side, sắp xếp và chi tiết dạng dialog | Thiết kế lại theo ý nhóm; tách trang chủ, danh sách và chi tiết có URL riêng |
| Giỏ hàng/đặt đơn | Có giỏ theo user, checkout COD, tạo đơn/trừ kho, hủy pending hoàn kho | Kiểm thử end-to-end; cải thiện form, thông báo, lỗi và giao diện lịch sử đơn |
| Admin | Có thêm/sửa sản phẩm, thêm/sửa biến thể, cập nhật kho, ẩn sản phẩm, thêm danh mục và đổi trạng thái đơn | Tách giao diện quản trị; xem/khôi phục hàng đã ẩn; thống nhất ẩn thay xóa dữ liệu có lịch sử |
| Ảnh/dữ liệu | Seed có 4 mẫu giày, 7 biến thể; nhập ảnh bằng URL HTTPS | 8–10 sản phẩm demo phù hợp, ảnh khớp màu/kiểu; upload qua Convex Storage |
| Kiểm thử | Có tests nghiệp vụ Convex, mật khẩu/JWT, phiên tài khoản frontend và HTTP e2e | Thêm test tính năng mới và kiểm thử bằng trình duyệt trên mobile/desktop |
| Triển khai | Có hướng dẫn Vercel trong README | Chưa xác minh link production hoặc CI đã hoạt động; A phụ trách kiểm chứng |

Chưa có: thanh toán chuyển khoản/QR, cổng online, upload ảnh, phân trang. Truy vấn sản phẩm/đơn hiện giới hạn 100 bản ghi. UI đang điều hướng trong một trang; các thành viên cần tách component/route trước khi cùng sửa giao diện.

## 3. Bảng phân công chính

A/B/C/D là nhãn tạm để nhóm điền tên thật. Đề xuất bạn nhận A vì đang nắm phần tái cấu trúc; có thể đổi theo năng lực và thời gian của nhóm.

| Người | Mảng chịu trách nhiệm | Công việc tiếp theo | Sản phẩm bàn giao và điều kiện nghiệm thu |
| --- | --- | --- | --- |
| **A — Bạn (đề xuất)** | Tích hợp, xác thực, triển khai | Review và bàn giao code nền; quản lý nhánh/PR; hoàn thiện xác thực NestJS, cấp admin an toàn; cấu hình CI; Vercel và Convex production; cập nhật hướng dẫn chạy | Ba thành viên còn lại chạy local thành công; có tài khoản customer/admin; PR chạy tests/lint/build; có link production để cả nhóm kiểm thử |
| **B — Thành viên 2** | Thiết kế và storefront | Chốt mẫu giao diện, theme, component chung; làm header/footer, trang chủ, danh sách và chi tiết giày; responsive; tìm/lọc và trạng thái loading/empty/error | Trang `/`, `/products`, `/products/[id]` dùng dữ liệu qua API NestJS; đổi biến thể cập nhật đúng ảnh/giá/kho; size hết hàng bị khóa; giao diện được nhóm duyệt trên desktop/mobile |
| **C — Thành viên 3** | Backend NestJS, Convex và dữ liệu | Review schema/API hiện có; hoàn thiện quản lý biến thể/danh mục và hàng ẩn; upload ảnh; seed đẹp; kiểm tra transaction, giá, tồn kho, quyền truy cập; bổ sung tests và tài liệu API | API thống nhất cho B/D; seed dùng lại trên deployment rỗng; upload hoạt động; đặt/hủy đơn đúng kho; không đọc/ghi dữ liệu trái quyền; tests cho nghiệp vụ mới pass |
| **D — Thành viên 4** | Giỏ hàng, checkout, đơn và admin UI | Tách giỏ/checkout/lịch sử/chi tiết đơn thành route; admin sản phẩm/biến thể/đơn; nối upload từ C; form validation; trạng thái xử lý/thành công/thất bại | Luồng `/cart` → `/checkout` → `/orders/[id]` hoàn chỉnh; `/orders`, `/admin/products`, `/admin/orders` dùng được; admin xem và khôi phục sản phẩm ẩn; customer không được thao tác admin |

## 4. Ranh giới file để hạn chế xung đột

Các đường dẫn mới dưới đây là cấu trúc đề xuất, chưa phải tất cả đều đã tồn tại.

| Chủ trì | Phạm vi file | Quy tắc phối hợp |
| --- | --- | --- |
| A | `frontend/components/providers.tsx`, `frontend/app/api/[...path]/route.ts`, `backend/src/auth/`, cấu hình CI/deploy, tài liệu gốc | Cùng C review `auth.config.ts`, `auth.ts`, `users.ts`; không tự thay API sản phẩm/đơn |
| B | `frontend/components/shop/`, `frontend/components/ui/`, các route storefront, `docs/ui-guide.md` | Chủ trì theme/global CSS và header/footer; thống nhất props component để D dùng lại |
| C | `backend/src/`, `backend/convex/`, test Convex, tài liệu API | Thông báo trước khi đổi schema/tên hàm/args; không sửa file `_generated/` thủ công |
| D | `frontend/components/cart/`, `checkout/`, `orders/`, `admin/` và các route tương ứng | Dùng theme/component của B; gọi API đã thống nhất với C; không tự thêm kiểm tra quyền chỉ ở UI |

**Việc tách code ban đầu:** B tách `shop.tsx`; D tách `account-panel.tsx`. A chủ trì sửa layout/provider dùng chung. Chốt phần export/import dùng chung, gồm formatter giá và kiểu dữ liệu, trước khi merge để tránh vòng phụ thuộc. Sau bước này hạn chế cùng sửa các file lớn hiện tại.

## 5. Thứ tự làm và các mốc tích hợp

### Mốc 0 — Bàn giao nền tảng

- Cả nhóm dùng chung kiến trúc Next.js → NestJS → Convex; tiếp tục phát triển backend NestJS hiện tại.
- A review thay đổi đang nằm local, loại file môi trường/khóa khỏi commit, tạo PR nền tảng và merge sau review. Hiện có nhiều file mới chưa được Git theo dõi; chưa thể xem là đã bàn giao cho nhóm.
- Mỗi người pull cùng phiên bản, chạy `npm ci` tại cả `frontend/` và `backend/` và tự cấu hình deployment dev. Không chép file `.env.local` của nhau một cách mặc định.
- A hướng dẫn `npm run auth:setup` trong backend để tạo khóa riêng từng môi trường; C hướng dẫn chạy Convex và seed. Không chia sẻ private key hoặc secret qua tài liệu công khai.

### Mốc 1 — Chốt giao diện và hợp đồng dữ liệu

- B đưa mẫu trang chi tiết giày và trang danh sách để cả nhóm duyệt trước khi dựng thêm màn hình.
- C ghi API vào `docs/api.md`: tên hàm, args, kết quả, lỗi và quyền; đánh dấu schema đã thống nhất.
- B/D tách component và route; D dùng chung component của B. A kiểm chứng auth thật và chuẩn bị CI/deploy.

### Mốc 2 — Hoàn thiện luồng COD

- B hoàn thiện storefront; C hoàn thiện API/seed/upload; D hoàn thiện checkout, đơn và admin.
- Mỗi PR có người review khác tác giả và ghi các lệnh kiểm tra đã chạy. PR đổi UI có ảnh hoặc link preview nếu đã cấu hình.
- Ưu tiên đường đi mua hàng hoàn chỉnh trước các tính năng thanh toán bổ sung.

### Mốc 3 — Nghiệm thu và demo

- A tích hợp, cấu hình production và bàn giao link; seed và tài khoản demo được tạo có kiểm soát ở đúng môi trường.
- Cả nhóm kiểm thử bằng hai tài khoản và hai phiên trình duyệt. Thực hiện test tranh mua đôi cuối cùng trên Convex thật; test hiện có kiểm tra lượt mua sau khi kho đã hết, chưa thay thế kiểm thử đồng thời thực tế.
- B/D sửa UI theo phản hồi; C sửa nghiệp vụ; A tổng hợp README, kịch bản demo và hướng dẫn triển khai.

Không ấn định ngày khi chưa có deadline. Nhóm điền người phụ trách thật và hạn hoàn thành cho từng mốc trước khi chia issue.

## 6. Quy tắc làm việc nhóm

- `main`: bản ổn định; `dev`: tích hợp nếu nhóm chọn dùng; `feature/<ten-viec>`: nhánh công việc. Merge qua PR, tối thiểu một người review.
- Mỗi người dùng deployment dev riêng; cùng schema và seed thông qua Git. Database production là môi trường dùng chung sau tích hợp. Dữ liệu dev không tự gộp khi đổi URL.
- C là đầu mối thay đổi schema; A review tác động triển khai. Nếu có dữ liệu cần giữ, viết migration/backup trước khi đổi trường bắt buộc.
- Không commit `.env.local`, Secret Key hoặc Deploy Key. Dùng `.env.example` để ghi tên biến; quyền dịch vụ được A quản lý.
- Trước PR: chạy `npm test`, `npm run lint`, `npm run build` trong cả `frontend/` và `backend/`. Các bước này không thay thế kiểm thử tương tác thực tế.
- Giữ và tiếp tục phát triển `backend/`; không tạo thêm một bộ Convex độc lập trong frontend.

## 7. Checklist nghiệm thu MVP

- [ ] Cả 4 thành viên chạy được bản mới từ cùng code trong Git.
- [ ] Giao diện mới được duyệt và hoạt động trên điện thoại/máy tính.
- [ ] Đăng nhập/đăng xuất thật; customer bị chặn thao tác admin và truy cập đơn người khác ở server.
- [ ] Danh sách/chi tiết giày hiển thị đúng biến thể, ảnh, giá, size và tồn kho.
- [ ] Giỏ không vượt tồn; checkout dùng giá server, tạo đơn và trừ kho đúng.
- [ ] Hai khách tranh mua đôi cuối cùng: chỉ một đơn thành công.
- [ ] Hủy pending hoàn kho đúng một lần; không hủy đơn đã giao.
- [ ] Admin quản lý sản phẩm/biến thể và tiến trình đơn; lịch sử đơn giữ nguyên giá mua.
- [ ] Có dữ liệu demo nhất quán, link production và hai tài khoản demo.
- [ ] Nhóm diễn tập luồng demo và ghi nhận kết quả.

Upload ảnh và chuyển khoản/QR là phần nên có theo kế hoạch gốc; ưu tiên sau khi checklist COD ổn định. Cổng online, mã giảm giá và đánh giá sản phẩm để sau MVP.
