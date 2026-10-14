import Image, { type ImageProps } from "next/image";

// Uploaded media and Unsplash go through the Next image optimizer
// (see next.config.ts). Any other pasted URL is rendered as-is.
function isOptimizable(src: string) {
  return src.startsWith("/media/") || src.startsWith("https://images.unsplash.com/");
}

export function SmartImage({ alt, ...props }: ImageProps & { src: string }) {
  return <Image alt={alt} {...props} unoptimized={props.unoptimized ?? !isOptimizable(props.src)} />;
}
