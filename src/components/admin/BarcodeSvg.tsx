"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

export function BarcodeSvg({
  value,
  height = 50,
  width = 1.6,
  fontSize = 13,
  className,
}: {
  value: string;
  height?: number;
  width?: number;
  fontSize?: number;
  className?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    try {
      JsBarcode(ref.current, value, {
        format: /^\d{13}$/.test(value) ? "EAN13" : "CODE128",
        height,
        width,
        fontSize,
        margin: 0,
        background: "#FFFFFF",
        lineColor: "#000000",
        flat: true,
      });
    } catch {
      ref.current.innerHTML = "";
    }
  }, [value, height, width, fontSize]);

  return <svg ref={ref} className={className} role="img" aria-label={`Barcode ${value}`} />;
}
