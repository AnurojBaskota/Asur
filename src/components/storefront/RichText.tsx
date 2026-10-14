// Renders the admin's "markdown-lite" page body as React elements (never raw HTML):
//   blank line → new block · "## " heading · "- " bullet list · [text](https://…) link
import Link from "next/link";
import { Fragment } from "react";

function inline(text: string) {
  const parts: React.ReactNode[] = [];
  const re = /\[([^\]]+)\]\(((?:https?:\/\/|mailto:|tel:|\/)[^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const [, label, href] = m;
    parts.push(
      href.startsWith("/") ? (
        <Link key={m.index} href={href} className="text-accent-primary underline underline-offset-4">{label}</Link>
      ) : (
        <a key={m.index} href={href} className="text-accent-primary underline underline-offset-4" rel="noopener noreferrer">{label}</a>
      )
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

type Block = { kind: "h"; text: string } | { kind: "ul"; items: string[] } | { kind: "p"; lines: string[] };

function parse(body: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ kind: "p", lines: para });
    if (list.length) blocks.push({ kind: "ul", items: list });
    para = [];
    list = [];
  };
  for (const raw of body.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) { flush(); continue; }
    if (line.startsWith("## ")) { flush(); blocks.push({ kind: "h", text: line.slice(3) }); continue; }
    if (line.startsWith("- ")) {
      if (para.length) { blocks.push({ kind: "p", lines: para }); para = []; }
      list.push(line.slice(2));
      continue;
    }
    if (list.length) { blocks.push({ kind: "ul", items: list }); list = []; }
    para.push(line);
  }
  flush();
  return blocks;
}

export function RichText({ body }: { body: string }) {
  return (
    <div className="space-y-5 text-[16px] leading-relaxed text-asur-ash">
      {parse(body).map((b, i) =>
        b.kind === "h" ? (
          <h2 key={i} className="pt-4 font-display condensed font-black uppercase text-3xl text-asur-white">{b.text}</h2>
        ) : b.kind === "ul" ? (
          <ul key={i} className="space-y-2 pl-5 list-disc marker:text-accent-primary">
            {b.items.map((item, j) => <li key={j}>{inline(item)}</li>)}
          </ul>
        ) : (
          <p key={i}>
            {b.lines.map((l, j) => <Fragment key={j}>{j > 0 && <br />}{inline(l)}</Fragment>)}
          </p>
        )
      )}
    </div>
  );
}
