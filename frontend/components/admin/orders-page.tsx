"use client";
import { Fragment, useId, useRef, useState } from "react";
import { api, useQuery, useMutation } from "../../lib/shop-client";
import { ApiError } from "../../lib/shop-api";
import { money, errorMessage } from "../../lib/format";
import type { Order, OrderStatus } from "../../lib/types";
import { useSession } from "../providers";
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
const progress: Record<OrderStatus, number> = {
  pending: 0,
  confirmed: 1,
  shipping: 2,
  delivered: 3,
  cancelled: 4,
};
function currentStatus(status: OrderStatus, completed?: OrderStatus) {
  return completed && progress[completed] > progress[status]
    ? completed
    : status;
}
export function AdminOrdersPage() {
  const { user } = useSession();
  if (!user || user.role !== "admin") return null;
  return <AdminOrders key={user._id} />;
}
function AdminOrders() {
  const orders = useQuery(api.orders.list, {});
  const { refresh } = useSession();
  const update = useMutation(api.orders.updateStatus),
    cancel = useMutation(api.orders.cancel);
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState(""),
    [expanded, setExpanded] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const actionInFlight = useRef(false);
  const detailsId = useId();
  const completedActions = useRef(new Map<string, OrderStatus>());
  const [completed, setCompleted] = useState<Record<string, OrderStatus>>({});
  // A successful mutation remains authoritative until GET catches up. A later
  // server status wins too, since order transitions cannot move backwards.
  const displayedOrders = orders?.map((order) => {
    const status = currentStatus(order.status, completed[order._id]);
    return {
      ...order,
      status,
      paymentStatus:
        completed[order._id] === "delivered"
          ? ("paid" as const)
          : order.paymentStatus,
      awaitingRefresh: status !== order.status,
    };
  });
  const visible = displayedOrders?.filter(
    (order) =>
      (!status || order.status === status) &&
      `${order._id} ${order.shippingName} ${order.shippingPhone}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  async function perform(
    order: Order & { awaitingRefresh: boolean },
    target: OrderStatus,
  ) {
    if (
      actionInFlight.current ||
      order.awaitingRefresh ||
      currentStatus(order.status, completedActions.current.get(order._id)) !==
        order.status
    )
      return;
    const code = `#${order._id.slice(-8).toUpperCase()}`;
    if (
      target === "cancelled" &&
      !window.confirm(`Hủy đơn ${code} và hoàn lại tồn kho?`)
    )
      return;
    actionInFlight.current = true;
    setBusy(true);
    setMessage(
      target === "cancelled" ? "Đang hủy đơn…" : "Đang cập nhật đơn hàng…",
    );
    try {
      if (target === "cancelled") await cancel({ id: order._id });
      else await update({ id: order._id, status: target });
      completedActions.current.set(order._id, target);
      setCompleted((previous) => ({ ...previous, [order._id]: target }));
      setMessage(`Đơn ${code}: ${labels[target]}.`);
    } catch (error) {
      let hint = "";
      if (
        error instanceof ApiError &&
        (error.status === 400 || error.status === 409)
      ) {
        hint =
          " Đơn có thể đã đổi trạng thái. Hãy làm mới danh sách để kiểm tra.";
      } else if (!(error instanceof ApiError) || error.status >= 500) {
        hint =
          " Chưa xác định thao tác đã thành công hay chưa. Hãy làm mới danh sách để kiểm tra trước khi thử lại.";
      }
      setMessage(`${errorMessage(error)}${hint}`);
    } finally {
      actionInFlight.current = false;
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
            value: displayedOrders?.length ?? "—",
            icon: "orders",
          },
          {
            label: "Chờ xác nhận",
            value:
              displayedOrders?.filter((o) => o.status === "pending").length ??
              "—",
            icon: "orders",
          },
          {
            label: "Đang giao hàng",
            value:
              displayedOrders?.filter((o) => o.status === "shipping").length ??
              "—",
            icon: "products",
          },
          {
            label: "Doanh thu đã thu",
            value: displayedOrders
              ? money(
                  displayedOrders
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
          <button type="button" disabled={busy} onClick={refresh}>
            Làm mới danh sách
          </button>
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
          <div
            className="admin-table-scroll"
            role="region"
            aria-label="Danh sách đơn hàng, có thể cuộn ngang"
            tabIndex={0}
          >
            <table className="admin-table" aria-label="Danh sách đơn hàng">
              <thead>
                <tr>
                  <th scope="col">Mã đơn</th>
                  <th scope="col">Khách hàng</th>
                  <th scope="col">Ngày đặt</th>
                  <th scope="col">Tổng tiền</th>
                  <th scope="col">Trạng thái</th>
                  <th scope="col">Thao tác</th>
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
                          aria-label={`Chi tiết đơn #${order._id.slice(-8).toUpperCase()}`}
                          aria-controls={
                            expanded === order._id
                              ? `${detailsId}-${order._id}`
                              : undefined
                          }
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
                          <div
                            className="admin-order-detail"
                            id={`${detailsId}-${order._id}`}
                          >
                            <div>
                              <h3>Chi tiết sản phẩm</h3>
                              {order.items.map((item) => (
                                <p key={item._id}>
                                  {item.productName} · {item.variantName} · EU{" "}
                                  {item.size} × {item.quantity}
                                  <strong>
                                    {money(item.unitPrice * item.quantity)}
                                  </strong>
                                  <br />
                                  <span className="subtle">
                                    Đơn giá lúc mua: {money(item.unitPrice)}
                                  </span>
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
                                    aria-label={`Hủy đơn #${order._id.slice(-8).toUpperCase()}`}
                                    disabled={busy || order.awaitingRefresh}
                                    onClick={() =>
                                      void perform(order, "cancelled")
                                    }
                                  >
                                    Hủy đơn
                                  </button>
                                )}
                                {next[order.status] && (
                                  <button
                                    aria-label={`${labels[next[order.status]!]} đơn #${order._id.slice(-8).toUpperCase()}`}
                                    className="admin-primary"
                                    disabled={busy || order.awaitingRefresh}
                                    onClick={() =>
                                      void perform(order, next[order.status]!)
                                    }
                                  >
                                    {labels[next[order.status]!]}
                                  </button>
                                )}
                              </div>
                              {order.awaitingRefresh && (
                                <p role="status">
                                  Đã ghi nhận trạng thái mới. Hãy làm mới danh
                                  sách để đồng bộ trước khi thao tác tiếp.
                                </p>
                              )}
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
