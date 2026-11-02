# Quy ước giao diện Cloud Shop

- Ngôn ngữ: tiếng Việt; giá định dạng VND bằng `Intl.NumberFormat`.
- Nhận diện CloudKicks: nền trắng `#ffffff`, chữ `#222825`, xanh đậm `#194e43`, vàng `#ffbf00` và cam `#ff6b00`; dùng biến trong `frontend/app/globals.css`.
- Chữ Manrope hỗ trợ tiếng Việt, lưu local trong `frontend/public/fonts/` (giấy phép OFL); fallback Arial/Helvetica. Tiêu đề lớn, khoảng trắng rộng; không tải font từ dịch vụ ngoài khi build.
- Bố cục: tối đa 1280px; header trắng bo tròn trên nền lưới xanh đậm; hero ảnh giày tách nền, sản phẩm phổ biến, bộ sưu tập ảnh ghép, danh mục, banner xanh và footer tối nhiều cột. Lưới 3 cột desktop, 2 cột mobile; sản phẩm phổ biến xếp 1 cột mobile. Form checkout xếp một cột trên mobile.
- Thẻ sản phẩm nền xám nhạt, bo góc 20px, hiển thị theo từng biến thể; nút thêm vào giỏ mở đúng màu/kiểu để chọn size. Không tự chọn size hoặc tạo đánh giá giả.
- Nút chính nền vàng, CTA banner/footer nền cam; nút bo tròn. Lựa chọn active dùng xanh đậm; size hết hàng disabled và gạch ngang.
- Yêu thích lưu theo ID biến thể trên trình duyệt; nút trái tim header mở danh mục đã lọc. Tìm kiếm, danh mục, thương hiệu, giá và sắp xếp vẫn dùng dữ liệu hiện có.
- Chọn biến thể thay ảnh, giá, tồn kho, số đã bán và reset size/số lượng. Chọn size không thay ảnh.
- Chi tiết dùng native dialog để giữ focus và hỗ trợ Escape. Trạng thái xử lý/lỗi hiển thị bằng vùng `role="status"`.
- Không hiển thị thao tác quản trị cho customer; mọi quyền vẫn phải được kiểm tra trong Convex.
- Ảnh demo từ Unsplash và PNGimg; nguồn ảnh tĩnh được ghi trong `frontend/public/images/CREDITS.md`. Không khẳng định ảnh là mẫu giày/thương hiệu thực. Ưu tiên ảnh sở hữu hoặc được phép dùng khi triển khai chính thức.

- Tài khoản dùng form email/mật khẩu riêng, cookie HttpOnly qua API NestJS; không dùng Clerk. Frontend gọi API qua `/api`, Convex chỉ nằm trong `backend/`.
- Trang chủ `/` hiển thị hero, sản phẩm nổi bật, bộ sưu tập và banner. Trang `/products` chứa danh mục đầy đủ, tìm kiếm, bộ lọc và sắp xếp. Mục “Sản phẩm” nằm giữa “Trang chủ” và “Về chúng tôi”; CTA mua sắm dẫn đến `/products`. Liên kết bộ sưu tập/yêu thích/tìm kiếm có thể truyền `category`, `favorites=1`, `search=1`.
- Dashboard admin dùng layout riêng có sidebar xanh đậm; `/admin` chuyển đến `/admin/orders`. Ba trang `/admin/orders`, `/admin/products`, `/admin/users` có bảng, tìm kiếm/bộ lọc và số liệu từ danh sách đã tải (tối đa 100 bản ghi). Sidebar thu gọn trên mobile.
- Form quản trị sản phẩm được tách vào `frontend/components/admin/product-forms.tsx`; giỏ và đơn khách hàng vẫn ở `account-panel.tsx`. Admin xem được sản phẩm ẩn và khôi phục hiển thị.
- Quản lý người dùng chỉ trả dữ liệu tài khoản công khai cho admin; cho đổi customer/admin sau xác nhận, không cho tự đổi quyền. Thay đổi quyền thu hồi phiên cũ của tài khoản được cập nhật. Kiểm tra quyền thực hiện lại trong Convex.
