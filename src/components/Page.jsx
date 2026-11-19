import { Fragment } from "react";

// Small, dependency-free markdown renderer for AI answers.
// Handles headings, bold, italic, inline code, lists, tables and rules. Builds React elements only (no raw HTML).

function inline(text, key = "") {
  const parts = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g;
  let last = 0, m, i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("**")) parts.push(<strong key={`${key}b${i}`} style={{ color: "#F5F2EA", fontWeight: 600 }}>{t.slice(2, -2)}</strong>);
    else if (t.startsWith("`")) parts.push(<code key={`${key}c${i}`} className="px-1 rounded" style={{ background: "#1E2433", color: "#E8A855", fontSize: "0.9em" }}>{t.slice(1, -1)}</code>);
    else parts.push(<em key={`${key}i${i}`}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
    i++;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

const isTableRow = (l) => /^\s*\|.*\|\s*$/.test(l);
const isDivider = (l) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l);
const cells = (l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

export default function Markdown({ text = "" }) {
  const lines = String(text).replace(/\r/g, "").split("\n");
  const out = [];
  let i = 0, k = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    if (isTableRow(line) && i + 1 < lines.length && isDivider(lines[i + 1])) {
      const head = cells(line);
      i += 2;
      const rows = [];
      while (i < lines.length && isTableRow(lines[i])) { rows.push(cells(lines[i])); i++; }
      out.push(
        <div key={k++} className="overflow-x-auto my-3 rounded-lg" style={{ border: "1px solid #262C3D" }}>
          <table className="w-full text-left" style={{ borderCollapse: "collapse", fontSize: "0.85em" }}>
            <thead><tr style={{ background: "#1A2030" }}>{head.map((h, j) => <th key={j} className="px-3 py-2 font-semibold" style={{ color: "#E8A855" }}>{inline(h, `h${j}`)}</th>)}</tr></thead>
            <tbody>{rows.map((r, a) => (
              <tr key={a} style={{ borderTop: "1px solid #262C3D" }}>{r.map((c, b) => <td key={b} className="px-3 py-2 align-top">{inline(c, `r${a}${b}`)}</td>)}</tr>
            ))}</tbody>
          </table>
        </div>
      );
      continue;
    }

    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      out.push(<p key={k++} className="font-display text-lg mt-3 mb-1" style={{ color: "#F5F2EA" }}>{inline(h[2])}</p>);
      i++; continue;
    }

    if (/^\s*([-*•])\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*([-*•])\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*([-*•])\s+/, "")); i++; }
      out.push(<ul key={k++} className="list-disc pl-5 my-2 flex flex-col gap-1">{items.map((t, j) => <li key={j}>{inline(t, `u${j}`)}</li>)}</ul>);
      continue;
    }

    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*\d+[.)]\s+/, "")); i++; }
      out.push(<ol key={k++} className="list-decimal pl-5 my-2 flex flex-col gap-1">{items.map((t, j) => <li key={j}>{inline(t, `o${j}`)}</li>)}</ol>);
      continue;
    }

    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) { out.push(<hr key={k++} className="my-3" style={{ borderColor: "#262C3D" }} />); i++; continue; }

    const para = [];
    while (i < lines.length && lines[i].trim() && !isTableRow(lines[i]) && !/^(#{1,4})\s/.test(lines[i]) && !/^\s*([-*•]|\d+[.)])\s+/.test(lines[i])) { para.push(lines[i]); i++; }
    if (!para.length) { para.push(lines[i]); i++; }
    out.push(<p key={k++} className="my-2">{para.map((p, j) => <Fragment key={j}>{j > 0 && <br />}{inline(p, `p${j}`)}</Fragment>)}</p>);
  }
  return <div className="md-body" style={{ lineHeight: 1.65 }}>{out}</div>;
}

// Plain-text version for short previews (no table pipes or asterisks).
export function plain(text = "") {
  return String(text)
    .replace(/^\s*\|?\s*:?-{2,}:?[\s|:-]*$/gm, " ")
    .replace(/\|/g, " ")
    .replace(/[*`#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}