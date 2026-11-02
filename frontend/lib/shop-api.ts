import type {
  CartItem,
  Order,
  OrderStatus,
  Shoe,
  VariantInput,
  User,
} from "./types";

export type Endpoint<A, R> = {
  method: string;
  path: (args: A) => string;
  body: (args: A) => unknown;
  result?: R;
};
const endpoint = <A, R>(
  method: string,
  path: string | ((args: A) => string),
  body: (args: A) => unknown = (args) => args,
): Endpoint<A, R> => ({
  method,
  path: typeof path === "string" ? () => path : path,
  body,
});
type Empty = Record<string, never>;
type Id = { id: string };
const id = (value: string) => encodeURIComponent(value);
export const api = {
  users: {
    list: endpoint<Empty, User[]>("GET", "/users"),
    updateRole: endpoint<Id & { role: User["role"] }, null>(
      "PATCH",
      (a) => `/users/${id(a.id)}/role`,
      (a) => ({ role: a.role }),
    ),
  },
  products: {
    adminList: endpoint<Empty, Shoe[]>("GET", "/admin/products"),
    restore: endpoint<Id, null>(
      "PATCH",
      (a) => `/products/${id(a.id)}/restore`,
      () => ({}),
    ),
    list: endpoint<Empty, Shoe[]>("GET", "/products"),
    categories: endpoint<Empty, { _id: string; name: string }[]>(
      "GET",
      "/categories",
    ),
    createCategory: endpoint<{ name: string }, string>("POST", "/categories"),
    create: endpoint<
      {
        name: string;
        brand: string;
        description: string;
        categoryId: string;
        variantName: string;
        price: number;
        imageUrl: string;
        sizes: VariantInput["sizes"];
      },
      string
    >("POST", "/products"),
    hide: endpoint<Id, null>(
      "DELETE",
      (a) => `/products/${id(a.id)}`,
      () => undefined,
    ),
    updateMetadata: endpoint<
      Id & { name: string; brand: string; description: string },
      null
    >(
      "PATCH",
      (a) => `/products/${id(a.id)}`,
      (a) => ({ name: a.name, brand: a.brand, description: a.description }),
    ),
    addVariant: endpoint<VariantInput & { productId: string }, string>(
      "POST",
      (a) => `/products/${id(a.productId)}/variants`,
      (a) => ({
        name: a.name,
        price: a.price,
        imageUrl: a.imageUrl,
        sizes: a.sizes,
      }),
    ),
    updateVariant: endpoint<Id & VariantInput, null>(
      "PATCH",
      (a) => `/variants/${id(a.id)}`,
      (a) => ({
        name: a.name,
        price: a.price,
        imageUrl: a.imageUrl,
        sizes: a.sizes,
      }),
    ),
  },
  cart: {
    list: endpoint<Empty, CartItem[]>("GET", "/cart"),
    add: endpoint<{ variantId: string; size: number; quantity: number }, null>(
      "POST",
      "/cart",
    ),
    remove: endpoint<Id, null>(
      "DELETE",
      (a) => `/cart/${id(a.id)}`,
      () => undefined,
    ),
    setQuantity: endpoint<Id & { quantity: number }, null>(
      "PATCH",
      (a) => `/cart/${id(a.id)}`,
      ({ quantity }) => ({ quantity }),
    ),
  },
  orders: {
    list: endpoint<Empty, Order[]>("GET", "/orders"),
    place: endpoint<
      { shippingName: string; shippingPhone: string; shippingAddress: string },
      string
    >("POST", "/orders"),
    cancel: endpoint<Id, null>(
      "PATCH",
      (a) => `/orders/${id(a.id)}/cancel`,
      () => ({}),
    ),
    updateStatus: endpoint<Id & { status: OrderStatus }, null>(
      "PATCH",
      (a) => `/orders/${id(a.id)}/status`,
      ({ status }) => ({ status }),
    ),
  },
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function request<R>(
  path: string,
  method = "GET",
  body?: unknown,
  signal?: AbortSignal,
): Promise<R> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: "same-origin",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new ApiError(
      "Không thể kết nối cửa hàng. Vui lòng thử lại sau.",
      503,
    );
  }
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new ApiError(
      typeof data?.message === "string"
        ? data.message
        : "Không thể thực hiện yêu cầu.",
      response.status,
    );
  return data as R;
}
