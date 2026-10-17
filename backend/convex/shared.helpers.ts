export const CLOTHING_CATEGORIES = [
  { value: 'ao', label: 'Áo' },
  { value: 'quan', label: 'Quần' },
  { value: 'vay', label: 'Váy' },
  { value: 'ao-khoac', label: 'Áo khoác' },
  { value: 'giay', label: 'Giày' },
  { value: 'phu-kien', label: 'Phụ kiện' },
] as const;

const categoryValues = new Set<string>(
  CLOTHING_CATEGORIES.map((category) => category.value),
);

export function optionalCategory(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  if (!categoryValues.has(trimmed)) {
    throw new Error(
      `Category must be one of: ${CLOTHING_CATEGORIES.map((category) => category.value).join(', ')}`,
    );
  }
  return trimmed;
}

export function requireText(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${label} is required`);
  }
  return trimmed;
}

export function optionalText(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function requirePrice(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error('Price must be a non-negative number');
  }
  return value;
}

export function requireQuantity(value: number): number {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error('Quantity must be a positive integer');
  }
  return value;
}

export function definedFields<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as T;
}
