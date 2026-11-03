export type User = {
  _id: string;
  _creationTime: number;
  name: string;
  email: string;
  role: "admin" | "customer";
};
export type Shoe = {
  isActive?: boolean;
  _id: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  variants: {
    _id: string;
    name: string;
    price: number;
    imageUrl: string;
    sold: number;
    sizes: { size: number; stock: number }[];
  }[];
};
export type OrderStatus =
  "pending" | "confirmed" | "shipping" | "delivered" | "cancelled";
export type Order = {
  _id: string;
  _creationTime: number;
  status: OrderStatus;
  paymentStatus: "unpaid" | "paid";
  totalAmount: number;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  items: {
    _id: string;
    productName: string;
    variantName: string;
    size: number;
    quantity: number;
    unitPrice: number;
  }[];
};
export type CartItem = {
  _id: string;
  quantity: number;
  size: number;
  variant: Shoe["variants"][number] | null;
  product: { name: string } | null;
};
export type VariantInput = {
  name: string;
  price: number;
  imageUrl: string;
  sizes: { size: number; stock: number }[];
};
