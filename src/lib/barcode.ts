// EAN-13 helpers. Generated codes use the GS1 "restricted circulation"
// prefix 2xx, which is reserved for in-store/internal use — safe to print on
// your own labels without a GS1 company prefix.

export function ean13CheckDigit(first12: string): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(first12[i]) * (i % 2 === 0 ? 1 : 3);
  }
  return (10 - (sum % 10)) % 10;
}

export function isValidEan13(code: string): boolean {
  return /^\d{13}$/.test(code) && ean13CheckDigit(code.slice(0, 12)) === Number(code[12]);
}

export function generateEan13(): string {
  let body = "2" + String(Math.floor(Math.random() * 10)); // 20–29
  for (let i = 0; i < 10; i++) body += String(Math.floor(Math.random() * 10));
  return body + ean13CheckDigit(body);
}

export const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"] as const;

/** e.g. ("Heavy Oversized Tee", "Black", "XL") -> "ASUR-HOT-BLK-XL" */
export function buildSku(productName: string, colorName: string, size: string): string {
  const words = productName
    .replace(/^asur\s+/i, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  const code = words.map((w) => w[0]).join("").slice(0, 4) || "PRD";
  return `ASUR-${code}-${colorCode(colorName)}-${size}`;
}

const COLOR_CODES: Record<string, string> = {
  black: "BLK", white: "WHT", grey: "GRY", gray: "GRY", graphite: "GPH", charcoal: "CHR",
  bone: "BNE", cream: "CRM", olive: "OLV", navy: "NVY", sand: "SND", brown: "BRN", red: "RED",
};

function colorCode(colorName: string): string {
  const key = colorName.trim().toLowerCase();
  if (COLOR_CODES[key]) return COLOR_CODES[key];
  const letters = key.toUpperCase().replace(/[^A-Z]/g, "");
  if (!letters) return "CLR";
  // First letter + following consonants, e.g. "Maroon" -> "MRN"
  return (letters[0] + letters.slice(1).replace(/[AEIOU]/g, "")).slice(0, 3).padEnd(3, "X");
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function stockStatus(stock: number, threshold: number) {
  if (stock <= 0) return "out_of_stock" as const;
  if (stock <= threshold) return "low_stock" as const;
  return "in_stock" as const;
}
