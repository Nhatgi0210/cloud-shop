"use client";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, api } from "../lib/shop-client";
import { ApiError } from "../lib/shop-api";
import type { User } from "../lib/types";
import { money, errorMessage } from "../lib/format";
import { useSession } from "./providers";

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
        <Cart key={user._id} goShopping={goShopping} />
      ) : (
        <>
          <Orders key={user._id} admin={user.role === "admin"} />
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
  const [placedOrder, setPlacedOrder] = useState<{ id: string | null } | null>(
    null,
  );
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<"name" | "phone" | "address", string>>
  >({});
  // A ref also guards two submit events dispatched before React rerenders.
  const actionInFlight = useRef(false);
  const orderPlaced = useRef(false);
  const successHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (placedOrder) successHeading.current?.focus();
  }, [placedOrder]);
  const total =
    cart?.reduce(
      (sum, row) => sum + (row.variant?.price ?? 0) * row.quantity,
      0,
    ) ?? 0;
  const unavailable = cart?.some(
    (row) =>
      !row.product ||
      !row.variant ||
      !Number.isSafeInteger(row.quantity) ||
      row.quantity < 1 ||
      row.quantity >
        (row.variant.sizes.find((size) => size.size === row.size)?.stock ?? 0),
  );
  const hasMissingPrice = cart?.some((row) => !row.variant);
  async function perform(action: () => Promise<unknown>, checkout = false) {
    if (actionInFlight.current || orderPlaced.current) return;
    actionInFlight.current = true;
    setBusy(true);
    setMessage(checkout ? "Đang đặt đơn COD…" : "Đang cập nhật giỏ hàng…");
    try {
      await action();
      if (!checkout) setMessage("Đã cập nhật giỏ hàng.");
    } catch (error) {
      setMessage(
        checkout && (!(error instanceof ApiError) || error.status >= 500)
          ? `${errorMessage(error)} Chưa xác định đơn đã được tạo hay chưa. Hãy kiểm tra mục Đơn hàng trước khi gửi lại.`
          : errorMessage(error),
      );
    } finally {
      actionInFlight.current = false;
      setBusy(false);
    }
  }
  // The POST result is authoritative even if the following cart GET is slow
  // or fails. Never show the old cart's checkout form after a successful POST.
  if (placedOrder)
    return (
      <div className="empty" role="status">
        <h2 ref={successHeading} tabIndex={-1}>
          Đặt hàng thành công!
        </h2>
        {placedOrder.id && (
          <p>Mã đơn #{placedOrder.id.slice(-8).toUpperCase()}.</p>
        )}
        <p>Xem mục Đơn hàng để theo dõi đơn. Thanh toán khi nhận hàng.</p>
        <button className="primary" onClick={goShopping}>
          Tiếp tục mua sắm ↗
        </button>
      </div>
    );
  if (!cart) return <p role="status">Đang tải giỏ hàng…</p>;
  if (!cart.length)
    return (
      <div className="empty">
        <h2>Giỏ hàng đang trống</h2>
        <p>Tìm một đôi giày cho hành trình tiếp theo.</p>
        <button className="primary" onClick={goShopping}>
          Khám phá giày ↗
        </button>
      </div>
    );
  return (
    <>
      <div className="checkout-grid">
        <div>
          {cart.map((row) => {
            const stock =
              row.variant?.sizes.find((size) => size.size === row.size)
                ?.stock ?? 0;
            const missing = !row.product || !row.variant;
            return (
              <article className="cart-row" key={row._id}>
                <div>
                  <h3>{row.product?.name ?? "Sản phẩm ngừng bán"}</h3>
                  <p>
                    {row.variant?.name} · Size {row.size}
                  </p>
                  {row.variant ? (
                    <>
                      <p>Đơn giá: {money(row.variant.price)}</p>
                      <strong>
                        Thành tiền: {money(row.variant.price * row.quantity)}
                      </strong>
                    </>
                  ) : (
                    <p>Không còn thông tin giá.</p>
                  )}
                  {missing ? (
                    <p>
                      Sản phẩm hoặc biến thể không còn khả dụng. Vui lòng xóa
                      khỏi giỏ.
                    </p>
                  ) : stock < row.quantity ? (
                    <p>
                      Chỉ còn {stock} đôi ở size này. Giảm số lượng hoặc xóa
                      khỏi giỏ.
                    </p>
                  ) : null}
                </div>
                <label>
                  Số lượng{" "}
                  <input
                    aria-label={`Số lượng ${row.product?.name ?? "sản phẩm"} / ${row.variant?.name ?? "biến thể"} / Size ${row.size}`}
                    type="number"
                    min={1}
                    max={stock}
                    step={1}
                    value={row.quantity}
                    disabled={busy || missing || stock < 1}
                    onChange={(e) => {
                      const quantity = e.currentTarget.valueAsNumber;
                      if (!Number.isSafeInteger(quantity) || quantity < 1) {
                        setMessage("Số lượng phải là số nguyên từ 1 trở lên.");
                        return;
                      }
                      if (quantity > stock) {
                        setMessage(
                          `Chỉ còn ${stock} đôi ở size này. Vui lòng giảm số lượng.`,
                        );
                        return;
                      }
                      if (quantity === row.quantity) return;
                      void perform(() =>
                        setQuantity({
                          id: row._id,
                          quantity,
                        }),
                      );
                    }}
                  />
                </label>
                <button
                  aria-label={`Xóa ${row.product?.name ?? "sản phẩm"} / ${row.variant?.name ?? "biến thể"} / Size ${row.size} khỏi giỏ`}
                  disabled={busy}
                  className="text-button"
                  onClick={() => void perform(() => remove({ id: row._id }))}
                >
                  Xóa
                </button>
              </article>
            );
          })}
          {unavailable && (
            <p role="status" className="feedback">
              Vui lòng sửa hoặc xóa các dòng không còn đủ hàng trước khi đặt
              đơn.
            </p>
          )}
        </div>
        <form
          className="checkout-form"
          noValidate
          aria-busy={busy}
          onSubmit={(e) => {
            e.preventDefault();
            if (actionInFlight.current || orderPlaced.current) return;
            if (unavailable) {
              setMessage("Vui lòng sửa giỏ hàng trước khi đặt đơn.");
              return;
            }
            const data = new FormData(e.currentTarget);
            const shippingName = String(data.get("name") ?? "").trim();
            const shippingPhone = String(data.get("phone") ?? "").trim();
            const shippingAddress = String(data.get("address") ?? "").trim();
            const errors: typeof fieldErrors = {};
            if (shippingName.length < 2 || shippingName.length > 100)
              errors.name =
                "Họ và tên phải có từ 2 đến 100 ký tự sau khi bỏ khoảng trắng đầu và cuối.";
            if (!/^(\+84|0)[0-9]{9,10}$/.test(shippingPhone))
              errors.phone =
                "Nhập số điện thoại bắt đầu bằng 0 hoặc +84, theo sau là 9–10 chữ số.";
            if (shippingAddress.length < 10 || shippingAddress.length > 500)
              errors.address =
                "Địa chỉ phải có từ 10 đến 500 ký tự sau khi bỏ khoảng trắng đầu và cuối.";
            setFieldErrors(errors);
            const invalid = (["name", "phone", "address"] as const).find(
              (name) => errors[name],
            );
            if (invalid) {
              setMessage("Vui lòng kiểm tra thông tin giao hàng.");
              const input = e.currentTarget.elements.namedItem(invalid);
              if (input instanceof HTMLElement) input.focus();
              return;
            }
            void perform(async () => {
              const id = await place({
                shippingName,
                shippingPhone,
                shippingAddress,
              });
              orderPlaced.current = true;
              setPlacedOrder({ id: typeof id === "string" && id ? id : null });
            }, true);
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
              disabled={busy}
              aria-invalid={!!fieldErrors.name}
              aria-describedby={
                fieldErrors.name ? "shipping-name-error" : undefined
              }
            />
            {fieldErrors.name && (
              <span id="shipping-name-error">{fieldErrors.name}</span>
            )}
          </label>
          <label>
            Số điện thoại
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              pattern="(\+84|0)[0-9]{9,10}"
              disabled={busy}
              aria-invalid={!!fieldErrors.phone}
              aria-describedby={
                fieldErrors.phone ? "shipping-phone-error" : undefined
              }
            />
            {fieldErrors.phone && (
              <span id="shipping-phone-error">{fieldErrors.phone}</span>
            )}
          </label>
          <label>
            Địa chỉ giao hàng
            <textarea
              name="address"
              autoComplete="street-address"
              required
              minLength={10}
              maxLength={500}
              disabled={busy}
              aria-invalid={!!fieldErrors.address}
              aria-describedby={
                fieldErrors.address ? "shipping-address-error" : undefined
              }
            />
            {fieldErrors.address && (
              <span id="shipping-address-error">{fieldErrors.address}</span>
            )}
          </label>
          <p>Thanh toán khi nhận hàng (COD).</p>
          <div className="total">
            <span>Tổng tiền hàng</span>
            <strong>{hasMissingPrice ? "Chưa xác định" : money(total)}</strong>
          </div>
          <p className="subtle">
            Demo không tính phí giao hàng. Giá được kiểm tra lại lúc đặt đơn.
          </p>
          <button
            type="submit"
            disabled={busy || unavailable}
            className="primary full"
          >
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
  const { refresh } = useSession();
  const cancel = useMutation(api.orders.cancel),
    update = useMutation(api.orders.updateStatus);
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const [cancelledOrders, setCancelledOrders] = useState<string[]>([]);
  const actionInFlight = useRef(false);
  // Keep successful cancellations authoritative while the following GET is stale.
  const completedCancellations = useRef(new Set<string>());
  async function perform(
    id: string,
    action: () => Promise<unknown>,
    cancelling = false,
  ) {
    if (actionInFlight.current || completedCancellations.current.has(id))
      return;
    if (
      cancelling &&
      !window.confirm(`Hủy đơn #${id.slice(-8).toUpperCase()}?`)
    )
      return;
    actionInFlight.current = true;
    setBusy(true);
    setMessage(cancelling ? "Đang hủy đơn…" : "Đang cập nhật đơn hàng…");
    try {
      await action();
      if (cancelling) {
        completedCancellations.current.add(id);
        setCancelledOrders((current) => [...current, id]);
        setMessage(`Đã hủy đơn #${id.slice(-8).toUpperCase()}.`);
      } else {
        setMessage("Đã cập nhật đơn hàng.");
      }
    } catch (error) {
      let hint = "";
      if (cancelling) {
        if (
          error instanceof ApiError &&
          (error.status === 400 || error.status === 409)
        ) {
          hint =
            " Đơn có thể đã đổi trạng thái. Hãy làm mới danh sách để kiểm tra.";
        } else if (!(error instanceof ApiError) || error.status >= 500) {
          hint =
            " Chưa xác định đơn đã được hủy hay chưa. Hãy làm mới danh sách để kiểm tra trước khi thử lại.";
        }
      }
      setMessage(`${errorMessage(error)}${hint}`);
    } finally {
      actionInFlight.current = false;
      setBusy(false);
    }
  }
  return (
    <div>
      <h2>{admin ? "Đơn hàng cửa hàng" : "Lịch sử đơn hàng"}</h2>
      <p className="subtle">Tối đa 100 đơn gần nhất.</p>
      <button type="button" disabled={busy} onClick={refresh}>
        Làm mới danh sách
      </button>
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
              <span className="status">
                {
                  labels[
                    cancelledOrders.includes(order._id)
                      ? "cancelled"
                      : order.status
                  ]
                }
              </span>
            </div>
            {order.items.map((item) => (
              <p key={item._id}>
                {item.productName} / {item.variantName} / EU {item.size} ×{" "}
                {item.quantity}
                <strong className="float-right">
                  {money(item.unitPrice * item.quantity)}
                </strong>
                <br />
                <span className="subtle">
                  Đơn giá lúc mua: {money(item.unitPrice)}
                </span>
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
                {order.status === "pending" &&
                  !cancelledOrders.includes(order._id) && (
                    <button
                      aria-label={`Hủy đơn #${order._id.slice(-8).toUpperCase()}`}
                      disabled={busy}
                      onClick={() =>
                        void perform(
                          order._id,
                          () => cancel({ id: order._id }),
                          true,
                        )
                      }
                    >
                      Hủy đơn
                    </button>
                  )}
                {admin &&
                  order.status in nextStatus &&
                  !cancelledOrders.includes(order._id) && (
                    <button
                      aria-label={`${labels[nextStatus[order.status as keyof typeof nextStatus]]} đơn #${order._id.slice(-8).toUpperCase()}`}
                      disabled={busy}
                      className="primary"
                      onClick={() =>
                        void perform(order._id, () =>
                          update({
                            id: order._id,
                            status:
                              nextStatus[
                                order.status as keyof typeof nextStatus
                              ],
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
