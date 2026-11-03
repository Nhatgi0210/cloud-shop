"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { api, useQuery, useMutation } from "../../lib/shop-client";
import { money, errorMessage } from "../../lib/format";
import { productImage } from "../product-image";
import { ProductForms } from "./product-forms";
import { AdminHeading, AdminStats, AdminSearch, AdminEmpty } from "./admin-ui";
export function AdminProductsPage() {
  const products = useQuery(api.products.adminList, {});
  const hide = useMutation(api.products.hide),
    restore = useMutation(api.products.restore);
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState(""),
    [editor, setEditor] = useState<string | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const visible = products?.filter(
    (p) =>
      `${p.name} ${p.brand} ${p.category}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (!status ||
        (status === "active" ? p.isActive !== false : p.isActive === false)),
  );
  const selected = products?.find((p) => p._id === editor);
  async function toggle(id: string, hidden: boolean) {
    if (
      !window.confirm(
        hidden
          ? "Hiển thị lại sản phẩm này trên cửa hàng?"
          : "Ẩn sản phẩm này khỏi cửa hàng?",
      )
    )
      return;
    setBusy(true);
    setMessage("");
    try {
      await (hidden ? restore({ id }) : hide({ id }));
      setMessage("Đã cập nhật trạng thái sản phẩm.");
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <AdminHeading
        title="Quản lý sản phẩm"
        description="Quản lý mẫu giày, biến thể, giá bán và tồn kho."
        action={
          <button className="admin-primary" onClick={() => setEditor("create")}>
            + Thêm sản phẩm
          </button>
        }
      />
      <AdminStats
        items={[
          {
            label: "Mẫu giày trong danh sách",
            value: products?.length ?? "—",
            icon: "products",
          },
          {
            label: "Đang hiển thị",
            value: products?.filter((p) => p.isActive !== false).length ?? "—",
            icon: "products",
          },
          {
            label: "Biến thể",
            value: products?.reduce((n, p) => n + p.variants.length, 0) ?? "—",
            icon: "products",
          },
          {
            label: "Tồn kho các mẫu giày",
            value:
              products?.reduce(
                (n, p) =>
                  n +
                  p.variants.reduce(
                    (v, a) => v + a.sizes.reduce((s, b) => s + b.stock, 0),
                    0,
                  ),
                0,
              ) ?? "—",
            icon: "orders",
          },
        ]}
      />
      {editor !== null && (
        <section className="admin-panel admin-editor">
          <div className="admin-panel-heading">
            <h2>
              {editor === "create"
                ? "Tạo mẫu giày mới"
                : `Chỉnh sửa: ${selected?.name ?? "Sản phẩm"}`}
            </h2>
            <button onClick={() => setEditor(null)}>Đóng chỉnh sửa</button>
          </div>
          <ProductForms
            key={editor}
            mode={editor === "create" ? "create" : "edit"}
            products={selected ? [selected] : []}
          />
        </section>
      )}
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <h2>Danh sách sản phẩm</h2>
          <span>{products?.length ?? 0} mẫu · Tối đa 100 mẫu gần nhất</span>
        </div>
        <div className="admin-toolbar">
          <AdminSearch
            value={search}
            onChange={setSearch}
            placeholder="Tìm tên giày, thương hiệu, danh mục…"
          />
          <select
            aria-label="Lọc trạng thái sản phẩm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang hiển thị</option>
            <option value="hidden">Đã ẩn</option>
          </select>
        </div>
        {!visible?.length ? (
          <AdminEmpty loading={!products} text="Chưa có sản phẩm phù hợp" />
        ) : (
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Danh mục</th>
                  <th>Giá từ</th>
                  <th>Tồn kho</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <div className="admin-product-name">
                        {product.variants[0] && (
                          <img
                            src={productImage(product.variants[0].imageUrl)}
                            alt=""
                            width={58}
                            height={48}
                          />
                        )}
                        <div>
                          <strong>{product.name}</strong>
                          <small>
                            {product.brand} · {product.variants.length} biến thể
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>{product.category}</td>
                    <td>
                      {product.variants.length
                        ? money(
                            Math.min(...product.variants.map((v) => v.price)),
                          )
                        : "—"}
                    </td>
                    <td>
                      {product.variants.reduce(
                        (n, v) => n + v.sizes.reduce((s, a) => s + a.stock, 0),
                        0,
                      )}{" "}
                      đôi
                    </td>
                    <td>
                      <span
                        className={`admin-badge ${product.isActive === false ? "cancelled" : "delivered"}`}
                      >
                        {product.isActive === false ? "Đã ẩn" : "Đang bán"}
                      </span>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <button
                          onClick={() => {
                            setEditor(product._id);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          Chỉnh sửa
                        </button>
                        <button
                          disabled={busy}
                          onClick={() =>
                            void toggle(product._id, product.isActive === false)
                          }
                        >
                          {product.isActive === false ? "Hiển thị" : "Ẩn"}
                        </button>
                      </div>
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
