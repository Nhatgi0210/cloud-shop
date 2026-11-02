"use client";
import { useState } from "react";
import { useMutation, useQuery, api } from "../../lib/shop-client";
import { errorMessage } from "../../lib/format";
import type { Shoe } from "../../lib/types";
export function ProductForms({
  products,
  mode,
}: {
  products: Shoe[];
  mode: "create" | "edit";
}) {
  const categories = useQuery(api.products.categories, {});
  const create = useMutation(api.products.create),
    hide = useMutation(api.products.hide),
    update = useMutation(api.products.updateVariant);
  const addVariant = useMutation(api.products.addVariant);
  const updateMetadata = useMutation(api.products.updateMetadata);
  const createCategory = useMutation(api.products.createCategory);
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function perform(action: () => Promise<unknown>) {
    setBusy(true);
    setMessage("");
    try {
      await action();
      setMessage("Đã lưu thay đổi.");
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="admin-products">
      <h2>
        {mode === "create" ? "Thêm sản phẩm và danh mục" : "Thông tin sản phẩm"}
      </h2>
      {mode === "create" && (
        <>
          <form
            className="stock-form"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const name = String(new FormData(form).get("category"));
              void perform(async () => {
                await createCategory({ name });
                form.reset();
              });
            }}
          >
            <label>
              Danh mục mới
              <input name="category" required maxLength={80} />
            </label>
            <button disabled={busy}>Thêm danh mục</button>
          </form>
          <details open>
            <summary>+ Thêm mẫu giày</summary>
            <form
              className="admin-form"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget,
                  data = new FormData(form);
                void perform(async () => {
                  await create({
                    name: String(data.get("name")),
                    brand: String(data.get("brand")),
                    description: String(data.get("description")),
                    categoryId: String(data.get("category")),
                    variantName: String(data.get("variant")),
                    price: Number(data.get("price")),
                    imageUrl: String(data.get("image")),
                    sizes: [38, 39, 40, 41, 42, 43, 44].map((size) => ({
                      size,
                      stock: Number(data.get("stock")),
                    })),
                  });
                  form.reset();
                });
              }}
            >
              <label>
                Tên giày
                <input name="name" required />
              </label>
              <label>
                Thương hiệu
                <input name="brand" required />
              </label>
              <label>
                Danh mục
                <select name="category" required>
                  {categories?.map((c) => (
                    <option value={c._id} key={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Mô tả
                <textarea name="description" required />
              </label>
              <label>
                Tên biến thể đầu tiên
                <input name="variant" required />
              </label>
              <label>
                Giá VND
                <input name="price" type="number" min={0} step={1} required />
              </label>
              <label>
                Ảnh HTTPS
                <input name="image" type="url" pattern="https://.*" required />
              </label>
              <label>
                Tồn ban đầu mỗi size 38–44
                <input
                  name="stock"
                  type="number"
                  min={0}
                  step={1}
                  required
                  defaultValue={5}
                />
              </label>
              <button
                className="primary"
                disabled={busy || !categories?.length}
              >
                Tạo sản phẩm
              </button>
            </form>
          </details>
        </>
      )}
      {mode === "edit" &&
        products.map((product) => (
          <article className="order" key={product._id}>
            <div className="section-heading">
              <h3>{product.name}</h3>
              <button
                disabled={busy}
                onClick={() => {
                  if (window.confirm(`Ẩn ${product.name} khỏi cửa hàng?`))
                    void perform(() => hide({ id: product._id }));
                }}
              >
                Ẩn sản phẩm
              </button>
            </div>
            <details open>
              <summary>Sửa thông tin / thêm biến thể</summary>
              <form
                className="admin-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const data = new FormData(e.currentTarget);
                  void perform(() =>
                    updateMetadata({
                      id: product._id,
                      name: String(data.get("name")),
                      brand: String(data.get("brand")),
                      description: String(data.get("description")),
                    }),
                  );
                }}
              >
                <label>
                  Tên giày
                  <input name="name" defaultValue={product.name} required />
                </label>
                <label>
                  Thương hiệu
                  <input name="brand" defaultValue={product.brand} required />
                </label>
                <label>
                  Mô tả
                  <textarea
                    name="description"
                    defaultValue={product.description}
                    required
                  />
                </label>
                <button disabled={busy}>Lưu thông tin</button>
              </form>
              <form
                className="admin-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const data = new FormData(form);
                  void perform(async () => {
                    await addVariant({
                      productId: product._id,
                      name: String(data.get("name")),
                      price: Number(data.get("price")),
                      imageUrl: String(data.get("image")),
                      sizes: [38, 39, 40, 41, 42, 43, 44].map((size) => ({
                        size,
                        stock: Number(data.get("stock")),
                      })),
                    });
                    form.reset();
                  });
                }}
              >
                <label>
                  Tên biến thể mới
                  <input name="name" required />
                </label>
                <label>
                  Giá VND
                  <input name="price" type="number" min={0} step={1} required />
                </label>
                <label>
                  Ảnh HTTPS
                  <input
                    name="image"
                    type="url"
                    pattern="https://.*"
                    required
                  />
                </label>
                <label>
                  Tồn ban đầu mỗi size
                  <input
                    name="stock"
                    type="number"
                    min={0}
                    step={1}
                    defaultValue={5}
                    required
                  />
                </label>
                <button disabled={busy}>Thêm biến thể</button>
              </form>
            </details>
            {product.variants.map((variant) => (
              <form
                className="stock-form"
                key={`${variant._id}-${variant.price}-${JSON.stringify(variant.sizes)}`}
                onSubmit={(e) => {
                  e.preventDefault();
                  const data = new FormData(e.currentTarget);
                  void perform(() =>
                    update({
                      id: variant._id,
                      name: String(data.get("name")),
                      imageUrl: String(data.get("image")),
                      price: Number(data.get("price")),
                      sizes: variant.sizes.map((s) => ({
                        size: s.size,
                        stock: Number(data.get(`size-${s.size}`)),
                      })),
                    }),
                  );
                }}
              >
                <strong>{variant.name}</strong>
                <label>
                  Tên biến thể
                  <input name="name" defaultValue={variant.name} required />
                </label>
                <label>
                  Ảnh HTTPS
                  <input
                    name="image"
                    type="url"
                    pattern="https://.*"
                    defaultValue={variant.imageUrl}
                    required
                  />
                </label>
                <label>
                  Giá VND
                  <input
                    name="price"
                    type="number"
                    min={0}
                    step={1}
                    defaultValue={variant.price}
                    required
                  />
                </label>
                {variant.sizes.map((s) => (
                  <label key={s.size}>
                    EU {s.size}
                    <input
                      name={`size-${s.size}`}
                      type="number"
                      min={0}
                      step={1}
                      defaultValue={s.stock}
                      required
                    />
                  </label>
                ))}
                <button disabled={busy}>Lưu giá / kho</button>
              </form>
            ))}
          </article>
        ))}
      <p role="status" className="feedback">
        {message}
      </p>
    </section>
  );
}
