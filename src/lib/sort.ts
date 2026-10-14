export function sortProducts<T extends { createdAt: string; variants: { price: number; salePrice?: number }[] }>(list: T[], sort?: string) {
  const price = (p: T) => Math.min(...p.variants.map((v) => v.salePrice ?? v.price));
  if (sort === "price-asc") return [...list].sort((a, b) => price(a) - price(b));
  if (sort === "price-desc") return [...list].sort((a, b) => price(b) - price(a));
  return list;
}
