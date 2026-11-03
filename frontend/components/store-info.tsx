"use client";

import { useEffect, useRef } from "react";
import { Brand, Icon } from "./store-icons";

export type InfoPage = "about" | "faq" | "contact" | "privacy";

const titles: Record<InfoPage, string> = {
  about: "Mỗi bước chân, một phong cách.",
  faq: "Bạn hỏi, CloudKicks trả lời.",
  contact: "Luôn sẵn sàng đồng hành.",
  privacy: "Thông tin của bạn.",
};

export function StoreInfo({
  page,
  onClose,
}: {
  page: InfoPage;
  onClose: () => void;
}) {
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
      className="info-dialog"
      ref={dialog}
      onCancel={onClose}
      aria-labelledby="info-title"
    >
      <button className="close" onClick={onClose} aria-label="Đóng">
        <Icon name="close" />
      </button>
      <Brand />
      <h2 id="info-title">{titles[page]}</h2>
      {page === "about" && (
        <>
          <p>
            CloudKicks là không gian dành cho những đôi giày và những hành trình
            mới. Từ sneaker hằng ngày đến giày chạy bộ, hãy tìm phong cách phù
            hợp với nhịp sống của bạn.
          </p>
          <p>
            Khám phá màu sắc, chọn size và xem số lượng còn lại ngay trên từng
            sản phẩm.
          </p>
          <span className="info-note">
            Cloud Shop · Dự án demo thương mại điện tử. Ảnh sản phẩm mang tính
            minh họa.
          </span>
        </>
      )}
      {page === "faq" && (
        <div className="faq-list">
          <details open>
            <summary>Làm thế nào để chọn size?</summary>
            <p>
              Mở sản phẩm, chọn màu/kiểu rồi chọn size EU. Size hết hàng sẽ được
              làm mờ. Bạn có thể kiểm tra số lượng trước khi thêm vào giỏ.
            </p>
          </details>
          <details>
            <summary>Tôi có cần đăng nhập để đặt hàng?</summary>
            <p>
              Có. Đăng nhập để lưu giỏ hàng, đặt hàng và theo dõi lịch sử đơn
              hàng theo tài khoản.
            </p>
          </details>
          <details>
            <summary>Tôi có thể thanh toán bằng cách nào?</summary>
            <p>
              Cửa hàng hiện hỗ trợ thanh toán khi nhận hàng (COD). Kiểm tra
              thông tin giao hàng và tổng tiền trước khi xác nhận.
            </p>
          </details>
          <details>
            <summary>Tôi có thể hủy đơn hàng không?</summary>
            <p>
              Bạn có thể hủy đơn đang chờ xác nhận trong mục Đơn hàng. Số lượng
              sản phẩm sẽ được hoàn lại vào kho.
            </p>
          </details>
        </div>
      )}
      {page === "contact" && (
        <>
          <p>
            Bạn cần tìm size, chọn màu hay kiểm tra đơn hàng? Mục Câu hỏi thường
            gặp hướng dẫn các bước mua sắm tại CloudKicks.
          </p>
          <div className="info-note">
            <strong>Về đơn hàng của bạn</strong>
            <p>
              Đăng nhập và mở mục Đơn hàng trên thanh điều hướng để xem trạng
              thái và thông tin giao hàng.
            </p>
          </div>
          <p>
            Cửa hàng đang ở giai đoạn demo, chưa có kênh chăm sóc khách hàng
            trực tiếp.
          </p>
        </>
      )}
      {page === "privacy" && (
        <>
          <p>
            Tài khoản đăng nhập bằng email và mật khẩu. Mật khẩu được lưu dưới
            dạng băm; phiên đăng nhập được quản lý qua cookie HttpOnly. Giỏ hàng
            và đơn hàng được lưu theo tài khoản của bạn.
          </p>
          <p>
            Tên người nhận, số điện thoại và địa chỉ được dùng để tạo thông tin
            giao hàng. Chỉ bạn và người có quyền quản trị cửa hàng được truy cập
            đơn hàng theo phân quyền.
          </p>
          <p>
            Danh sách yêu thích được lưu trên trình duyệt bạn đang sử dụng. Bạn
            có thể bỏ yêu thích bằng nút hình trái tim hoặc xóa dữ liệu trình
            duyệt.
          </p>
        </>
      )}
    </dialog>
  );
}
