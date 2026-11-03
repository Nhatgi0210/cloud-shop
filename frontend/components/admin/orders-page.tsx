"use client";
import { Fragment, useState } from "react";
import { api, useQuery, useMutation } from "../../lib/shop-client";
import { money, errorMessage } from "../../lib/format";
import type { OrderStatus } from "../../lib/types";
import { AdminHeading, AdminStats, AdminSearch, AdminEmpty } from "./admin-ui";
const labels: Record<OrderStatus, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
};
const next: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "confirmed",
  confirmed: "shipping",
  shipping: "delivered",
};
export function AdminOrdersPage() {
  const orders = useQuery(api.orders.list, {});
  const update = useMutation(api.orders.updateStatus),
    cancel = useMutation(api.orders.cancel);
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState(""),
    [expanded, setExpanded] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const visible = orders?.filter(
    (order) =>
      (!status || order.status === status) &&
      `${order._id} ${order.shippingName} ${order.shippingPhone}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  async function perform(action: () => Promise<unknown>) {
    setBusy(true);
    setMessage("");
    try {
      await action();
      setMessage("Đã cập nhật đơn hàng.");
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <AdminHeading
        title="Quản lý đơn hàng"
        description="Theo dõi đơn hàng và xử lý từng bước giao hàng."
      />
      <AdminStats
        items={[
          {
            label: "Đơn trong danh sách",
            value: orders?.length ?? "—",
            icon: "orders",
          },
          {
            label: "Chờ xác nhận",
            value: orders?.filter((o) => o.status === "pending").length ?? "—",
            icon: "orders",
          },
          {
            label: "Đang giao hàng",
            value: orders?.filter((o) => o.status === "shipping").length ?? "—",
            icon: "products",
          },
          {
            label: "Doanh thu đã thu",
            value: orders
              ? money(
                  orders
                    .filter((o) => o.paymentStatus === "paid")
                    .reduce((s, o) => s + o.totalAmount, 0),
                )
              : "—",
            icon: "orders",
          },
        ]}
      />
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <h2>Danh sách đơn hàng</h2>
          <span>{orders?.length ?? 0} đơn · Tối đa 100 đơn gần nhất</span>
        </div>
        <div className="admin-toolbar">
          <AdminSearch
            value={search}
            onChange={setSearch}
            placeholder="Tìm mã đơn, khách hàng, số điện thoại…"
          />
          <select
            aria-label="Lọc trạng thái đơn"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(labels).map(([key, text]) => (
              <option key={key} value={key}>
                {text}
              </option>
            ))}
          </select>
        </div>
        {!visible?.length ? (
          <AdminEmpty loading={!orders} text="Chưa có đơn hàng phù hợp" />
        ) : (
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Ngày đặt</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((order) => (
                  <Fragment key={order._id}>
                    <tr>
                      <td>
                        <strong>#{order._id.slice(-8).toUpperCase()}</strong>
                      </td>
                      <td>
                        <strong>{order.shippingName}</strong>
                        <small>{order.shippingPhone}</small>
                      </td>
                      <td>
                        {new Date(order._creationTime).toLocaleDateString(
                          "vi-VN",
                          { timeZone: "Asia/Ho_Chi_Minh" },
                        )}
                      </td>
                      <td>
                        <strong>{money(order.totalAmount)}</strong>
                        <small>
                          COD ·{" "}
                          {order.paymentStatus === "paid"
                            ? "Đã thanh toán"
                            : "Chưa thanh toán"}
                        </small>
                      </td>
                      <td>
                        <span className={`admin-badge ${order.status}`}>
                          {labels[order.status]}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() =>
                            setExpanded(
                              expanded === order._id ? null : order._id,
                            )
                          }
                          aria-expanded={expanded === order._id}
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                    {expanded === order._id && (
                      <tr className="admin-detail-row">
                        <td colSpan={6}>
                          <div className="admin-order-detail">
                            <div>
                              <h3>Chi tiết sản phẩm</h3>
                              {order.items.map((item) => (
                                <p key={item._id}>
                                  {item.productName} · {item.variantName} · EU{" "}
                                  {item.size} × {item.quantity}
                                  <strong>
                                    {money(item.unitPrice * item.quantity)}
                                  </strong>
                                </p>
                              ))}
                            </div>
                            <div>
                              <h3>Thông tin giao hàng</h3>
                              <p>
                                {order.shippingName} · {order.shippingPhone}
                              </p>
                              <p>{order.shippingAddress}</p>
                              <div className="admin-row-actions">
                                {order.status === "pending" && (
                                  <button
                                    disabled={busy}
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          "Hủy đơn và hoàn lại tồn kho?",
                                        )
                                      )
                                        void perform(() =>
                                          cancel({ id: order._id }),
                                        );
                                    }}
                                  >
                                    Hủy đơn
                                  </button>
                                )}
                                {next[order.status] && (
                                  <button
                                    className="admin-primary"
                                    disabled={busy}
                                    onClick={() =>
                                      void perform(() =>
                                        update({
                                          id: order._id,
                                          status: next[order.status]!,
                                        }),
                                      )
                                    }
                                  >
                                    {labels[next[order.status]!]}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="admin-feedback" role="status">
        {message}
      </p>
    </>
  );
}
