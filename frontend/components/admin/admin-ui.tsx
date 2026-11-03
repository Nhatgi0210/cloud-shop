import type { ReactNode } from "react";
import { Icon } from "../store-icons";
import { AdminSymbol } from "./admin-shell";
export function AdminHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="admin-heading">
      <div>
        <p className="admin-eyebrow">CLOUDKICKS ADMIN</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
export function AdminStats({
  items,
}: {
  items: { label: string; value: ReactNode; icon: string }[];
}) {
  return (
    <div className="admin-stats">
      {items.map((item) => (
        <div className="admin-stat" key={item.label}>
          <div>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
          <span className="admin-stat-icon">
            <AdminSymbol name={item.icon} />
          </span>
        </div>
      ))}
    </div>
  );
}
export function AdminSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="admin-search">
      <Icon name="search" size={18} />
      <span className="sr-only">{placeholder}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
export function AdminEmpty({
  loading,
  text,
}: {
  loading?: boolean;
  text: string;
}) {
  return (
    <div className="admin-empty" role="status">
      <Icon name="search" size={28} />
      <h3>{loading ? "Đang tải dữ liệu…" : text}</h3>
      <p>
        {loading
          ? "Dữ liệu cửa hàng sẽ xuất hiện trong giây lát."
          : "Thử điều chỉnh bộ lọc hoặc tìm kiếm của bạn."}
      </p>
    </div>
  );
}
