export const money = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
export const errorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Không thể thực hiện. Vui lòng thử lại.";
