import type { Metadata } from "next";
import { Shop } from "../../components/shop";

export const metadata: Metadata = {
  title: "Sản phẩm | CloudKicks",
  description:
    "Khám phá bộ sưu tập giày CloudKicks. Tìm theo phong cách, thương hiệu, giá và chọn size phù hợp.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const category =
    typeof query.category === "string" && query.category.length <= 80
      ? query.category
      : "Tất cả";
  return (
    <Shop
      key={`${category}:${query.favorites === "1"}:${query.search === "1"}`}
      page="products"
      initialCategory={category}
      initialFavorites={query.favorites === "1"}
      focusSearch={query.search === "1"}
    />
  );
}
