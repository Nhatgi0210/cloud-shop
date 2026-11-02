"use client";
import { useState } from "react";
import { api, useQuery, useMutation } from "../../lib/shop-client";
import { useSession } from "../providers";
import { errorMessage } from "../../lib/format";
import type { User } from "../../lib/types";
import { AdminHeading, AdminStats, AdminSearch, AdminEmpty } from "./admin-ui";
export function AdminUsersPage() {
  const users = useQuery(api.users.list, {}),
    { user: current } = useSession();
  const update = useMutation(api.users.updateRole);
  const [search, setSearch] = useState(""),
    [role, setRole] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const visible = users?.filter(
    (user) =>
      (!role || user.role === role) &&
      `${user.name} ${user.email}`.toLowerCase().includes(search.toLowerCase()),
  );
  async function change(user: User, value: User["role"]) {
    if (
      value === user.role ||
      !window.confirm(
        `Đổi quyền ${user.email} thành ${value === "admin" ? "quản trị viên" : "khách hàng"}? Người dùng sẽ cần đăng nhập lại.`,
      )
    )
      return;
    setBusy(true);
    setMessage("");
    try {
      await update({ id: user._id, role: value });
      setMessage("Đã cập nhật quyền người dùng và thu hồi phiên đăng nhập cũ.");
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <AdminHeading
        title="Quản lý người dùng"
        description="Theo dõi tài khoản và quản lý quyền truy cập cửa hàng."
      />
      <AdminStats
        items={[
          {
            label: "Tài khoản trong danh sách",
            value: users?.length ?? "—",
            icon: "users",
          },
          {
            label: "Khách hàng",
            value: users?.filter((u) => u.role === "customer").length ?? "—",
            icon: "users",
          },
          {
            label: "Quản trị viên",
            value: users?.filter((u) => u.role === "admin").length ?? "—",
            icon: "users",
          },
        ]}
      />
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <h2>Danh sách tài khoản</h2>
          <span>
            {users?.length ?? 0} tài khoản · Tối đa 100 tài khoản gần nhất
          </span>
        </div>
        <div className="admin-toolbar">
          <AdminSearch
            value={search}
            onChange={setSearch}
            placeholder="Tìm họ tên hoặc email…"
          />
          <select
            aria-label="Lọc vai trò"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="">Tất cả vai trò</option>
            <option value="customer">Khách hàng</option>
            <option value="admin">Quản trị viên</option>
          </select>
        </div>
        {!visible?.length ? (
          <AdminEmpty loading={!users} text="Chưa có người dùng phù hợp" />
        ) : (
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Người dùng</th>
                  <th>Email</th>
                  <th>Ngày tham gia</th>
                  <th>Vai trò</th>
                  <th>Thay đổi quyền</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className="admin-product-name">
                        <span className="admin-user-avatar">
                          {user.name.slice(0, 1).toUpperCase()}
                        </span>
                        <strong>
                          {user.name}
                          {user._id === current?._id && (
                            <small>Tài khoản của bạn</small>
                          )}
                        </strong>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      {new Date(user._creationTime).toLocaleDateString(
                        "vi-VN",
                        { timeZone: "Asia/Ho_Chi_Minh" },
                      )}
                    </td>
                    <td>
                      <span
                        className={`admin-badge ${user.role === "admin" ? "confirmed" : "delivered"}`}
                      >
                        {user.role === "admin" ? "Quản trị viên" : "Khách hàng"}
                      </span>
                    </td>
                    <td>
                      <select
                        aria-label={`Vai trò ${user.email}`}
                        value={user.role}
                        disabled={busy || user._id === current?._id}
                        onChange={(e) =>
                          void change(user, e.target.value as User["role"])
                        }
                      >
                        <option value="customer">Khách hàng</option>
                        <option value="admin">Quản trị viên</option>
                      </select>
                    </td>
                  </tr>
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
