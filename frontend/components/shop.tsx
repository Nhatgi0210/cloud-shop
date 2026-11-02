"use client";

/* Product photography is illustrative; demo names do not identify the pictured brands. */
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthControls } from "./auth-dialog";
import { useMutation, useQuery, api } from "../lib/shop-client";
import { useSession } from "./providers";
import type { Shoe } from "../lib/types";
export type { Shoe } from "../lib/types";
import { AccountPanel } from "./account-panel";
import { Brand, Icon } from "./store-icons";
import { StoreInfo, type InfoPage } from "./store-info";
import { productImage } from "./product-image";

export { money, errorMessage } from "../lib/format";
import { money, errorMessage } from "../lib/format";
type View = "shop" | "cart" | "orders";
type Selection = { productId: string; variantId: string };
type ShopPageProps = {
  page?: "home" | "products";
  initialCategory?: string;
  initialFavorites?: boolean;
  focusSearch?: boolean;
};

export function Shop(props: ShopPageProps) {
  return <LiveShop {...props} />;
}

function LiveShop(props: ShopPageProps) {
  const { user, isLoading, openAuth } = useSession();
  const products = useQuery(api.products.list, {});
  const cart = useQuery(api.cart.list, user ? {} : "skip");
  const add = useMutation(api.cart.add);
  const [view, setView] = useState<View>("shop");
  const account = <AuthControls />;
  return (
    <Storefront
      {...props}
      products={products}
      account={account}
      cartCount={cart?.reduce((n, row) => n + row.quantity, 0) ?? 0}
      view={view}
      setView={setView}
      admin={user?.role === "admin"}
      onAdd={async (variantId, size, quantity) => {
        if (!user) {
          openAuth();
          throw new Error("Vui lòng đăng nhập trước khi thêm vào giỏ hàng.");
        }
        await add({
          variantId,
          size,
          quantity,
        });
      }}
      panel={
        view !== "shop" ? (
          user ? (
            <AccountPanel
              view={view}
              user={user}
              goShopping={() => setView("shop")}
            />
          ) : (
            <div className="empty">
              <h2>
                {isLoading
                  ? "Đang kiểm tra tài khoản…"
                  : "Đăng nhập để tiếp tục"}
              </h2>
              <p>Giỏ hàng và đơn hàng được lưu theo tài khoản của bạn.</p>
              {account}
            </div>
          )
        ) : null
      }
    />
  );
}

function Storefront({
  page = "home",
  initialCategory = "Tất cả",
  initialFavorites = false,
  focusSearch = false,
  products,
  account,
  cartCount = 0,
  view = "shop",
  setView,
  admin,
  onAdd,
  panel,
}: ShopPageProps & {
  products: Shoe[] | undefined;
  account: ReactNode;
  cartCount?: number;
  view?: View;
  setView?: (view: View) => void;
  admin?: boolean;
  onAdd: (variantId: string, size: number, quantity: number) => Promise<void>;
  panel?: ReactNode;
}) {
  const router = useRouter();
  const isCatalog = page === "products";
  const [category, setCategory] = useState(initialCategory);
  const [brand, setBrand] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");
  const [price, setPrice] = useState("");
  const [selected, setSelected] = useState<Selection | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [onlyFavorites, setOnlyFavorites] = useState(initialFavorites);
  const [menuOpen, setMenuOpen] = useState(false);
  const [info, setInfo] = useState<InfoPage | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCatalog && focusSearch)
      searchRef.current?.focus({ preventScroll: true });
  }, [isCatalog, focusSearch]);

  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(
        localStorage.getItem("cloud-kicks-favorites") ?? "[]",
      );
      if (Array.isArray(saved) && saved.every((id) => typeof id === "string")) {
        // Hydrate browser-local preferences after the server-rendered storefront.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFavorites(saved);
      }
    } catch {
      /* Storage can be unavailable in private browser sessions. */
    }
  }, []);

  const go = (next: View) => {
    setView?.(next);
    setMenuOpen(false);
    if (next !== "shop") window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const browse = (
    nextCategory = "Tất cả",
    focusSearch = false,
    saved = false,
  ) => {
    if (!isCatalog) {
      const params = new URLSearchParams();
      if (nextCategory !== "Tất cả") params.set("category", nextCategory);
      if (focusSearch) params.set("search", "1");
      if (saved) params.set("favorites", "1");
      router.push(`/products${params.size ? `?${params}` : ""}`);
      setMenuOpen(false);
      return;
    }
    go("shop");
    setCategory(nextCategory);
    setBrand("");
    setPrice("");
    setOnlyFavorites(saved);
    if (!focusSearch) setSearch("");
    window.setTimeout(() => {
      document
        .getElementById("collection")
        ?.scrollIntoView({ behavior: "smooth" });
      if (focusSearch) searchRef.current?.focus({ preventScroll: true });
    }, 80);
  };
  const toggleFavorite = (id: string) => {
    const next = favorites.includes(id)
      ? favorites.filter((item) => item !== id)
      : [...favorites, id];
    setFavorites(next);
    try {
      localStorage.setItem("cloud-kicks-favorites", JSON.stringify(next));
    } catch {
      /* Keep the in-memory choice. */
    }
  };
  const entries =
    products?.flatMap((product) =>
      product.variants.map((variant) => ({ product, variant })),
    ) ?? [];
  const visible = entries
    .filter(
      ({ product, variant }) =>
        (category === "Tất cả" || product.category === category) &&
        (!brand || product.brand === brand) &&
        `${product.name} ${product.brand} ${variant.name}`
          .toLocaleLowerCase("vi")
          .includes(search.toLocaleLowerCase("vi")) &&
        (!price || variant.price <= Number(price)) &&
        (!onlyFavorites || favorites.includes(variant._id)),
    )
    .sort((a, b) =>
      sort === "asc"
        ? a.variant.price - b.variant.price
        : sort === "desc"
          ? b.variant.price - a.variant.price
          : 0,
    );
  const popular = [...entries]
    .sort((a, b) => b.variant.sold - a.variant.sold)
    .slice(0, 3);
  const currentProduct = selected
    ? products?.find((p) => p._id === selected.productId)
    : null;
  const activeFilter =
    category !== "Tất cả" || brand || price || search || onlyFavorites;

  const renderCard = ({
    product,
    variant,
  }: {
    product: Shoe;
    variant: Shoe["variants"][number];
  }) => (
    <article className="product-card" key={variant._id}>
      <div className="card-heading">
        <button
          className="product-title"
          onClick={() =>
            setSelected({ productId: product._id, variantId: variant._id })
          }
        >
          <h3>{product.name}</h3>
          <span>
            {variant.name} · {product.category}
          </span>
        </button>
        <button
          className={`icon-button favorite ${favorites.includes(variant._id) ? "is-favorite" : ""}`}
          aria-label={`${favorites.includes(variant._id) ? "Bỏ yêu thích" : "Yêu thích"} ${product.name} ${variant.name}`}
          aria-pressed={favorites.includes(variant._id)}
          onClick={() => toggleFavorite(variant._id)}
        >
          <Icon name="heart" />
        </button>
      </div>
      <button
        className="product-photo"
        onClick={() =>
          setSelected({ productId: product._id, variantId: variant._id })
        }
        aria-label={`Xem ${product.name} ${variant.name}`}
      >
        <img
          src={productImage(variant.imageUrl)}
          alt={`${product.name} — ${variant.name}`}
          loading="lazy"
          width={500}
          height={360}
        />
      </button>
      <div className="card-bottom">
        <div>
          <strong>{money(variant.price)}</strong>
          <span className="sold-count">Đã bán {variant.sold}</span>
        </div>
        <button
          className="add-cart"
          onClick={() =>
            setSelected({ productId: product._id, variantId: variant._id })
          }
        >
          <span>Thêm vào giỏ</span>
          <Icon name="bag" size={15} />
        </button>
      </div>
    </article>
  );

  return (
    <>
      <a className="skip-link" href="#main-content">
        Đến nội dung chính
      </a>
      <div
        className={`masthead grid-texture ${view !== "shop" || isCatalog ? "masthead-compact" : ""}`}
        id="home"
      >
        <div className="wrap">
          <header className="header">
            <Link
              href="/"
              className="brand-button"
              onClick={() => {
                go("shop");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              aria-label="CloudKicks trang chủ"
            >
              <Brand />
            </Link>
            <nav
              className={menuOpen ? "nav-open" : ""}
              aria-label="Điều hướng chính"
            >
              <Link
                href="/"
                className={view === "shop" && !isCatalog ? "active" : ""}
                aria-current={
                  view === "shop" && !isCatalog ? "page" : undefined
                }
                onClick={() => {
                  go("shop");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Trang chủ
              </Link>
              <Link
                href="/products"
                className={view === "shop" && isCatalog ? "active" : ""}
                aria-current={view === "shop" && isCatalog ? "page" : undefined}
                onClick={() => {
                  if (isCatalog) browse();
                }}
              >
                Sản phẩm
              </Link>
              <button onClick={() => setInfo("about")}>Về chúng tôi</button>
              <button onClick={() => browse()}>Bộ sưu tập</button>
              <button
                className={view === "orders" ? "active" : ""}
                onClick={() => go("orders")}
              >
                Đơn hàng
              </button>
              <button onClick={() => setInfo("faq")}>FAQs</button>
              {admin && <Link href="/admin/orders">Quản trị</Link>}
            </nav>
            <div className="header-actions">
              <button
                className="icon-button"
                aria-label="Tìm kiếm giày"
                onClick={() => browse("Tất cả", true)}
              >
                <Icon name="search" />
              </button>
              <button
                className={`icon-button header-favorites ${onlyFavorites ? "is-favorite" : ""}`}
                aria-label="Xem giày yêu thích"
                onClick={() => browse("Tất cả", false, true)}
              >
                <Icon name="heart" />
                {favorites.length > 0 && (
                  <span className="count">{favorites.length}</span>
                )}
              </button>
              <button
                className="icon-button bag"
                aria-label={`Giỏ hàng, ${cartCount} sản phẩm`}

                onClick={() => go("cart")}
              >
                <Icon name="bag" />
                {cartCount > 0 && <span className="count">{cartCount}</span>}
              </button>
              <div className="account-control">{account}</div>
              <button
                className="icon-button mobile-menu"
                aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <Icon name={menuOpen ? "close" : "menu"} />
              </button>
            </div>
          </header>
          {view === "shop" && !isCatalog && (
            <section className="hero" aria-labelledby="hero-title">
              <div className="hero-copy">
                <p className="eyebrow">
                  <span className="small-line" /> YOUR STYLE. YOUR MOVE.
                </p>
                <h1 id="hero-title">
                  Bước đi phong cách.
                  <br />
                  Tự tin chất riêng.
                </h1>
                <p>
                  Khám phá sự kết hợp hoàn hảo giữa phong cách và thoải mái.
                  Những đôi giày sẵn sàng cùng bạn trên mọi hành trình.
                </p>
                <div className="hero-actions">
                  <button className="primary" onClick={() => browse()}>
                    Mua sắm ngay <Icon name="arrow" size={18} />
                  </button>
                  <button className="outline-light" onClick={() => browse()}>
                    Khám phá giày
                  </button>
                </div>
              </div>
              <div className="hero-visual">
                <span className="hero-orbit" aria-hidden="true" />
                <img
                  className="hero-shoe"
                  src="/images/shoe-5809.png"
                  alt="Giày thể thao xanh neon với đế trắng và điểm nhấn hồng"
                  width={1489}
                  height={861}
                  fetchPriority="high"
                />
                <span className="hero-visual-caption">
                  MADE TO MOVE WITH YOU <span>↗</span>
                </span>
              </div>
            </section>
          )}
        </div>
      </div>
      <main className="wrap" id="main-content">
        {view === "shop" ? (
          <>
            {isCatalog && (
              <section
                className="catalog-intro"
                aria-labelledby="products-title"
              >
                <nav className="breadcrumbs" aria-label="Đường dẫn">
                  <Link href="/">Trang chủ</Link>
                  <span aria-hidden="true">/</span>
                  <span aria-current="page">Sản phẩm</span>
                </nav>
                <p className="eyebrow">FIND YOUR NEXT PAIR</p>
                <h1 id="products-title">Đôi giày mới. Phong cách của bạn.</h1>
                <p>
                  Khám phá bộ sưu tập giày và tìm lựa chọn phù hợp cho từng bước
                  chân.
                </p>
              </section>
            )}
            {!isCatalog && (
              <>
                <section
                  className="store-section popular-section"
                  aria-labelledby="popular-title"
                >
                  <div className="section-heading">
                    <h2 id="popular-title">Sản phẩm được yêu thích</h2>
                    <button className="explore-button" onClick={() => browse()}>
                      Xem tất cả <Icon name="arrow" size={18} />
                    </button>
                  </div>
                  {!products ? (
                    <div
                      className="product-grid"
                      aria-label="Đang tải sản phẩm"
                      role="status"
                    >
                      {[1, 2, 3].map((id) => (
                        <div className="skeleton-card" key={id} />
                      ))}
                      <span className="sr-only">Đang tải sản phẩm…</span>
                    </div>
                  ) : popular.length ? (
                    <div className="product-grid">
                      {popular.map(renderCard)}
                    </div>
                  ) : (
                    <p className="empty">Bộ sưu tập đang được cập nhật.</p>
                  )}
                </section>
                <section
                  className="store-section"
                  aria-labelledby="collections-title"
                >
                  <div className="section-heading">
                    <h2 id="collections-title">Chọn phong cách của bạn</h2>
                    <button className="explore-button" onClick={() => browse()}>
                      Khám phá thêm <Icon name="arrow" size={18} />
                    </button>
                  </div>
                  <div className="collection-mosaic">
                    <button
                      className="collection-tile collection-lifestyle"
                      onClick={() => browse("Lifestyle")}
                    >
                      <img
                        src="/images/lifestyle.jpg"
                        alt="Phong cách sneaker năng động cho mỗi ngày"
                        loading="lazy"
                        width={650}
                        height={850}
                      />
                      <span className="tile-caption">
                        <small>EVERYDAY ESSENTIALS</small>
                        <strong>Lifestyle</strong>
                        <span className="tile-arrow">
                          <Icon name="arrow" />
                        </span>
                      </span>
                    </button>
                    <div className="collection-middle">
                      <button
                        className="collection-tile collection-statement"
                        onClick={() => browse()}
                      >
                        <img
                          src="/images/collection.jpg"
                          alt="Bộ sưu tập giày thể thao"
                          loading="lazy"
                          width={650}
                          height={400}
                        />
                        <span>
                          ĐÔI GIÀY MỚI.
                          <br />
                          <strong>CẢM HỨNG MỚI.</strong>
                          <span className="statement-link">
                            Khám phá bộ sưu tập <Icon name="arrow" size={16} />
                          </span>
                        </span>
                      </button>
                      <button
                        className="collection-tile collection-running"
                        onClick={() => browse("Running")}
                      >
                        <img
                          src="/images/shoe-5824.png"
                          alt="Giày chạy bộ xanh ngọc"
                          loading="lazy"
                          width={1276}
                          height={877}
                        />
                        <span className="tile-caption">
                          <strong>Running</strong>
                          <Icon name="arrow" />
                        </span>
                      </button>
                    </div>
                    <button
                      className="collection-tile collection-sneaker"
                      onClick={() => browse("Sneaker")}
                    >
                      <img
                        src="/images/sneaker.jpg"
                        alt="Sneaker với những đường nét nổi bật"
                        loading="lazy"
                        width={650}
                        height={850}
                      />
                      <span className="tile-caption">
                        <small>FIND YOUR OWN WAY</small>
                        <strong>Sneaker</strong>
                        <span className="tile-arrow">
                          <Icon name="arrow" />
                        </span>
                      </span>
                    </button>
                  </div>
                </section>
              </>
            )}
            {isCatalog && (
              <>
                <section
                  id="collection"
                  className="store-section catalog-section"
                  aria-labelledby="catalog-title"
                >
                  <div className="section-heading">
                    <div>
                      <h2 id="catalog-title">
                        {onlyFavorites
                          ? "Những đôi giày bạn thích"
                          : "Khám phá sản phẩm mới"}
                      </h2>
                      <p className="section-description">
                        Một đôi giày mới. Thêm một lý do để bước ra ngoài.
                      </p>
                    </div>
                    <span className="results-count" role="status">
                      {products ? `${visible.length} lựa chọn` : "Đang tải…"}
                    </span>
                  </div>
                  <div className="catalog-toolbar">
                    <div className="filters">
                      <div className="tabs" aria-label="Lọc theo danh mục">
                        {[
                          "Tất cả",
                          ...new Set(products?.map((p) => p.category) ?? []),
                        ].map((name) => (
                          <button
                            key={name}
                            aria-pressed={category === name}
                            className={category === name ? "chosen" : ""}
                            onClick={() => setCategory(name)}
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                      <label className="search">
                        <Icon name="search" size={18} />
                        <span className="sr-only">
                          Tìm tên giày, thương hiệu, màu sắc
                        </span>
                        <input
                          ref={searchRef}
                          placeholder="Tìm đôi giày của bạn…"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                      </label>
                    </div>
                    <div className="sort-row">
                      <div className="filter-summary">
                        {onlyFavorites && (
                          <button
                            className="filter-chip"
                            onClick={() => setOnlyFavorites(false)}
                          >
                            Yêu thích <Icon name="close" size={13} />
                          </button>
                        )}
                        <span className="subtle">
                          Phong cách cho từng bước chân.
                        </span>
                      </div>
                      <div>
                        <select
                          aria-label="Thương hiệu"
                          value={brand}
                          onChange={(e) => setBrand(e.target.value)}
                        >
                          <option value="">Mọi thương hiệu</option>
                          {[
                            ...new Set(products?.map((p) => p.brand) ?? []),
                          ].map((b) => (
                            <option key={b}>{b}</option>
                          ))}
                        </select>
                        <select
                          aria-label="Khoảng giá"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                        >
                          <option value="">Mọi mức giá</option>
                          <option value="1200000">Đến 1.200.000đ</option>
                          <option value="1500000">Đến 1.500.000đ</option>
                        </select>
                        <select
                          aria-label="Sắp xếp giá"
                          value={sort}
                          onChange={(e) => setSort(e.target.value)}
                        >
                          <option value="">Đề xuất cho bạn</option>
                          <option value="asc">Giá tăng dần</option>
                          <option value="desc">Giá giảm dần</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  {!products ? (
                    <p className="empty" role="status">
                      Đang tải bộ sưu tập…
                    </p>
                  ) : visible.length ? (
                    <div className="product-grid">
                      {visible.map(renderCard)}
                    </div>
                  ) : (
                    <div className="empty">
                      <span className="empty-icon">
                        <Icon
                          name={onlyFavorites ? "heart" : "search"}
                          size={32}
                        />
                      </span>
                      <h3>
                        {onlyFavorites
                          ? "Lưu lại đôi giày bạn thích"
                          : "Chưa tìm thấy đôi giày phù hợp"}
                      </h3>
                      <p>
                        {onlyFavorites
                          ? "Nhấn vào trái tim trên sản phẩm để thêm vào danh sách này."
                          : "Thử một từ khóa khác hoặc khám phá toàn bộ bộ sưu tập."}
                      </p>
                      {activeFilter && (
                        <button className="primary" onClick={() => browse()}>
                          Xem tất cả sản phẩm <Icon name="arrow" size={17} />
                        </button>
                      )}
                    </div>
                  )}
                </section>
              </>
            )}
            {!isCatalog && (
              <>
                <section
                  className="promo-banner grid-texture"
                  aria-labelledby="promo-title"
                >
                  <div className="promo-visual">
                    <img
                      src="/images/shoe-5812.png"
                      alt="Giày thể thao xanh dương với dây xanh neon"
                      loading="lazy"
                      width={1771}
                      height={1022}
                    />
                  </div>
                  <div className="promo-copy">
                    <p className="eyebrow">A LITTLE STYLE. A LOT OF YOU.</p>
                    <h2 id="promo-title">
                      Nâng tầm phong cách.
                      <br />
                      Bắt đầu từ <span>đôi giày.</span>
                    </h2>
                    <button className="primary orange" onClick={() => browse()}>
                      Khám phá ngay <Icon name="arrow" size={18} />
                    </button>
                  </div>
                  <span className="promo-stamp">
                    MOVE
                    <br />
                    <strong>YOUR WAY.</strong>
                  </span>
                </section>
              </>
            )}
          </>
        ) : (
          panel
        )}
      </main>
      <footer className="footer" id="contact">
        <div className="wrap">
          <div className="footer-top">
            <h2>
              Phong cách mới.
              <br />
              Hành trình mới.
            </h2>
            <div>
              <p>Đôi giày tiếp theo đang chờ bạn.</p>
              <button className="primary orange" onClick={() => browse()}>
                Tìm phong cách của bạn <Icon name="arrow" size={18} />
              </button>
            </div>
          </div>
          <div className="footer-main">
            <div className="footer-brand">
              <Brand />
              <p>
                Thoải mái từng bước chân.
                <br />
                Tự tin trên mọi hành trình.
              </p>
              <span className="footer-label">YOUR STYLE. YOUR MOVE.</span>
            </div>
            <div className="footer-column">
              <h3>Về CloudKicks</h3>
              <button onClick={() => setInfo("about")}>
                Câu chuyện của chúng tôi
              </button>
              <button onClick={() => setInfo("contact")}>Liên hệ</button>
              <button onClick={() => setInfo("privacy")}>Quyền riêng tư</button>
            </div>
            <div className="footer-column">
              <h3>Hỗ trợ</h3>
              <button onClick={() => setInfo("faq")}>Câu hỏi thường gặp</button>
              <button onClick={() => setInfo("faq")}>
                Hướng dẫn chọn size
              </button>
              <button onClick={() => go("orders")}>Theo dõi đơn hàng</button>
            </div>
            <div className="footer-column">
              <h3>Bộ sưu tập</h3>
              <button onClick={() => browse("Sneaker")}>Sneaker</button>
              <button onClick={() => browse("Running")}>Running</button>
              <button onClick={() => browse("Lifestyle")}>Lifestyle</button>
            </div>
            <div className="footer-column">
              <h3>Dành cho bạn</h3>
              <button onClick={() => browse()}>Tất cả sản phẩm</button>
              <button onClick={() => browse("Tất cả", false, true)}>
                Giày yêu thích
              </button>
              <button onClick={() => go("cart")}>Giỏ hàng</button>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="wrap">
            <span>© 2026 CloudKicks · Cloud Shop. Ảnh minh họa.</span>
            <button onClick={() => setInfo("privacy")}>
              Chính sách quyền riêng tư <Icon name="arrow" size={14} />
            </button>
          </div>
        </div>
      </footer>
      {currentProduct && selected && (
        <ProductDetail
          key={`${currentProduct._id}-${selected.variantId}`}
          product={currentProduct}
          initialVariantId={selected.variantId}
          onClose={() => setSelected(null)}
          onAdd={onAdd}
        />
      )}
      {info && <StoreInfo page={info} onClose={() => setInfo(null)} />}
    </>
  );
}

function ProductDetail({
  product,
  initialVariantId,
  onClose,
  onAdd,
}: {
  product: Shoe;
  initialVariantId?: string;
  onClose: () => void;
  onAdd: (id: string, size: number, quantity: number) => Promise<void>;
}) {
  const [variantId, setVariantId] = useState(
    initialVariantId ??
      product.variants.find((v) => v.sizes.some((s) => s.stock > 0))?._id ??
      product.variants[0]._id,
  );
  const variant =
    product.variants.find((v) => v._id === variantId) ?? product.variants[0];
  const [size, setSize] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current?.showModal();
    return () => {
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  const stock = variant.sizes.find((s) => s.size === size)?.stock ?? 0;
  return (
    <dialog
      ref={dialog}
      className="overlay"
      aria-labelledby="product-title"
      onCancel={onClose}
    >
      <section className="detail">
        <button className="close" onClick={onClose} aria-label="Đóng chi tiết">
          ×
        </button>
        <img
          className="detail-image"
          src={productImage(variant.imageUrl)}
          alt={`${product.name} ${variant.name}`}
        />
        <div className="detail-copy">
          <p className="eyebrow">
            {product.brand} / {product.category}
          </p>
          <h2 id="product-title">{product.name}</h2>
          <strong className="price">{money(variant.price)}</strong>
          <p>{product.description}</p>
          <h4>Màu / kiểu — {variant.name}</h4>
          <div className="variants">
            {product.variants.map((v) => (
              <button
                key={v._id}
                className={v._id === variantId ? "chosen" : ""}
                onClick={() => {
                  setVariantId(v._id);
                  setSize(null);
                  setQuantity(1);
                  setMessage("");
                }}
              >
                <img src={productImage(v.imageUrl)} alt="" />
                {v.name}
              </button>
            ))}
          </div>
          <p className="subtle">
            Còn {variant.sizes.reduce((n, s) => n + s.stock, 0)} đôi · Đã bán{" "}
            {variant.sold}
          </p>
          <h4>Chọn size EU</h4>
          <div className="sizes">
            {variant.sizes.map((s) => (
              <button
                key={s.size}
                disabled={s.stock === 0}
                aria-pressed={size === s.size}
                className={size === s.size ? "chosen" : ""}
                onClick={() => {
                  setSize(s.size);
                  setQuantity(1);
                }}
              >
                {s.size}
              </button>
            ))}
          </div>
          <label className="quantity">
            Số lượng{" "}
            <input
              type="number"
              min={1}
              max={stock || 1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </label>
          <button
            className="primary full"
            disabled={
              !size ||
              pending ||
              quantity < 1 ||
              !Number.isInteger(quantity) ||
              quantity > stock
            }
            onClick={async () => {
              if (!size) return;
              setPending(true);
              setMessage("");
              try {
                await onAdd(variant._id, size, quantity);
                setMessage("Đã thêm vào giỏ hàng.");
              } catch (error) {
                setMessage(errorMessage(error));
              } finally {
                setPending(false);
              }
            }}
          >
            {pending
              ? "Đang thêm…"
              : size
                ? "Thêm vào giỏ hàng ↗"
                : "Chọn size để tiếp tục"}
          </button>
          <p role="status" className="feedback">
            {message}
          </p>
        </div>
      </section>
    </dialog>
  );
}
