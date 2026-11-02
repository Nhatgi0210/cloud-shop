// Use cutout illustrations for the three original demo photographs only.
// Product photos supplied by the store retain their original URLs.
const demoIllustrations: Record<string, string> = {
  "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1000&q=85":
    "/images/shoe-5827.png",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=85":
    "/images/shoe-5823.png",
  "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?auto=format&fit=crop&w=1000&q=85":
    "/images/shoe-5822.png",
};

export function productImage(url: string) {
  return demoIllustrations[url] ?? url;
}
