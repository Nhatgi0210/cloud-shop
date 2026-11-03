import type { CSSProperties } from "react";

export type IconName =
  | "shoe"
  | "search"
  | "heart"
  | "bag"
  | "arrow"
  | "menu"
  | "close"
  | "check"
  | "chevron";

export function Icon({
  name,
  size = 20,
  style,
}: {
  name: IconName;
  size?: number;
  style?: CSSProperties;
}) {
  const paths: Record<IconName, React.ReactNode> = {
    shoe: (
      <>
        <path d="m4 5 5 6 4-2 2 6 6 3v3H3v-6l3-2-4-6Z" />
        <path d="m11 12 3-1M12 15l3-1M3 18h17" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
    ),
    bag: (
      <>
        <path d="M5 7h14l1 14H4L5 7Z" />
        <path d="M9 9V6a3 3 0 0 1 6 0v3" />
      </>
    ),
    arrow: (
      <>
        <path d="M4 12h16m-6-6 6 6-6 6" />
      </>
    ),
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m8 10 4 4 4-4" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      {paths[name]}
    </svg>
  );
}

export function Brand() {
  return (
    <span className="brand">
      <span className="brand-symbol">
        <Icon name="shoe" size={24} />
      </span>
      <span>
        Cloud<span className="brand-light">Kicks</span>
      </span>
    </span>
  );
}
