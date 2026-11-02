"use client";
import { useState } from "react";
import { useMutation, useQuery, api } from "../lib/shop-client";
import type { User } from "../lib/types";
import { money, errorMessage } from "../lib/format";

const labels = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
};
const nextStatus = {
  pending: "confirmed",
  confirmed: "shipping",
  shipping: "delivered",
} as const;

export function AccountPanel({
  view,
  user,
  goShopping,
}: {
  view: "cart" | "orders";
  user: User;
  goShopping: () => void;
}) {
  return (
    <section className="account">
      <p className="eyebrow">CLOUDKICKS / {user.name}</p>
      <h1>{view === "cart" ? "Giỏ hàng của bạn" : "Đơn hàng của bạn"}</h1>
      {view === "cart" ? (
        <Cart goShopping={goShopping} />
      ) : (
        <>
          <Orders admin={user.role === "admin"} />
        </>
      )}
    </section>
  );
}

function Cart({ goShopping }: { goShopping: () => void }) {
  const cart = useQuery(api.cart.list, {});
  const remove = useMutation(api.cart.remove),
    setQuantity = useMutation(api.cart.setQuantity),
    place = useMutation(api.orders.place);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const total =
    cart?.reduce(
      (sum, row) => sum + (row.variant?.price ?? 0) * row.quantity,
      0,
    ) ?? 0;
  async function perform(action: () => Promise<unknown>) {
    setBusy(true);
    setMessage("");
    try {
      await action();
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  if (!cart) return <p role="status">Đang tải giỏ hàng…</p>;
  if (!cart.length)
    return (
      <div className="empty">
        <h2>{ordered ? "Đặt hàng thành công!" : "Giỏ hàng đang trống"}</h2>
        <p>
          {ordered
            ? "Bạn có thể theo dõi đơn tại mục Đơn hàng. Thanh toán khi nhận hàng."
            : "Tìm một đôi giày cho hành trình tiếp theo."}
        </p>
        <button className="primary" onClick={goShopping}>
          Khám phá giày ↗
        </button>
      </div>
    );
  return (
    <>
      <div className="checkout-grid">
        <div>
          {cart.map((row) => (
            <article className="cart-row" key={row._id}>
              <div>
                <h3>{row.product?.name ?? "Sản phẩm ngừng bán"}</h3>
                <p>
                  {row.variant?.name} · Size {row.size}
                </p>
                <strong>{money(row.variant?.price ?? 0)}</strong>
              </div>
              <label>
                Số lượng{" "}
                <input
                  aria-label={`Số lượng ${row.product?.name}`}
                  type="number"
                  min={1}
                  max={
                    row.variant?.sizes.find((s) => s.size === row.size)
                      ?.stock ?? 1
                  }
                  value={row.quantity}
                  disabled={busy}
                  onChange={(e) =>
                    void perform(() =>
                      setQuantity({
                        id: row._id,
                        quantity: Number(e.target.value),
                      }),
                    )
                  }
                />
              </label>
              <button
                disabled={busy}
                className="text-button"
                onClick={() => void perform(() => remove({ id: row._id }))}
              >
                Xóa
              </button>
            </article>
          ))}
        </div>
        <form
          className="checkout-form"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            void perform(async () => {
              await place({
                shippingName: String(data.get("name")),
                shippingPhone: String(data.get("phone")),
                shippingAddress: String(data.get("address")),
              });
              setOrdered(true);
            });
          }}
        >
          <h2>Thông tin giao hàng</h2>
          <label>
            Họ và tên
            <input
              name="name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={100}
            />
          </label>
          <label>
            Số điện thoại
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              pattern="(\+84|0)[0-9]{9,10}"
            />
          </label>
          <label>
            Địa chỉ giao hàng
            <textarea
              name="address"
              autoComplete="street-address"
              required
              minLength={10}
              maxLength={500}
            />
          </label>
          <p>Thanh toán khi nhận hàng (COD).</p>
          <div className="total">
            <span>Tổng tiền hàng</span>
            <strong>{money(total)}</strong>
          </div>
          <p className="subtle">
            Demo không tính phí giao hàng. Giá được kiểm tra lại lúc đặt đơn.
          </p>
          <button disabled={busy} className="primary full">
            {busy ? "Đang xử lý…" : "Đặt hàng COD ↗"}
          </button>
        </form>
      </div>
      <p role="status" className="feedback">
        {message}
      </p>
    </>
  );
}

function Orders({ admin }: { admin: boolean }) {
  const orders = useQuery(api.orders.list, {});
  const cancel = useMutation(api.orders.cancel),
    update = useMutation(api.orders.updateStatus);
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function perform(action: () => Promise<unknown>) {
    setBusy(true);
    setMessage("");
    try {
      await action();
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <h2>{admin ? "Đơn hàng cửa hàng" : "Lịch sử đơn hàng"}</h2>
      {!orders ? (
        <p role="status">Đang tải đơn hàng…</p>
      ) : !orders.length ? (
        <p className="empty">Chưa có đơn hàng.</p>
      ) : (
        orders.map((order) => (
          <article className="order" key={order._id}>
            <div className="section-heading">
              <div>
                <strong>#{order._id.slice(-8).toUpperCase()}</strong>
                <p className="subtle">
                  {new Date(order._creationTime).toLocaleString("vi-VN", {
                    timeZone: "Asia/Ho_Chi_Minh",
                  })}
                </p>
              </div>
              <span className="status">{labels[order.status]}</span>
            </div>
            {order.items.map((item) => (
              <p key={item._id}>
                {item.productName} / {item.variantName} / EU {item.size} ×{" "}
                {item.quantity}
                <strong className="float-right">
                  {money(item.unitPrice * item.quantity)}
                </strong>
              </p>
            ))}
            <p>
              {order.shippingName} · {order.shippingPhone}
              <br />
              {order.shippingAddress}
            </p>
            <div className="section-heading">
              <strong>
                {money(order.totalAmount)} · COD ·{" "}
                {order.paymentStatus === "paid"
                  ? "Đã thanh toán"
                  : "Chưa thanh toán"}
              </strong>
              <div>
                {order.status === "pending" && (
                  <button
                    disabled={busy}
                    onClick={() =>
                      void perform(() => cancel({ id: order._id }))
                    }
                  >
                    Hủy đơn
                  </button>
                )}
                {admin && order.status in nextStatus && (
                  <button
                    disabled={busy}
                    className="primary"
                    onClick={() =>
                      void perform(() =>
                        update({
                          id: order._id,
                          status:
                            nextStatus[order.status as keyof typeof nextStatus],
                        }),
                      )
                    }
                  >
                    {
                      labels[
                        nextStatus[order.status as keyof typeof nextStatus]
                      ]
                    }{" "}
                    →
                  </button>
                )}
              </div>
            </div>
          </article>
        ))
      )}
      <p role="status" className="feedback">
        {message}
      </p>
    </div>
  );
}
