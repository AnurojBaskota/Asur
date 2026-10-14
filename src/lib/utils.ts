import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge our custom type scale so `text-caption` isn't mistaken
// for a colour (which would drop classes like `text-asur-black`).
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display-xl", "display-lg", "display-md", "display-sm",
            "heading-lg", "heading-md", "heading-sm",
            "body-lg", "body-md", "body-sm", "caption", "overline",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
