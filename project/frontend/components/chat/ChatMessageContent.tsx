"use client";

import { useEffect, useId, useRef } from "react";

/** Render markdown-lite: mermaid blocks + plain text. V3 #11 */
export function ChatMessageContent({ content }: { content: string }) {
  const parts = splitMermaidBlocks(content);

  return (
    <div className="space-y-2">
      {parts.map((part, i) =>
        part.type === "mermaid" ? (
          <MermaidBlock key={i} code={part.text} />
        ) : (
          <span key={i} className="whitespace-pre-wrap">
            {part.text}
          </span>
        ),
      )}
    </div>
  );
}

function splitMermaidBlocks(text: string): Array<{ type: "text" | "mermaid"; text: string }> {
  const regex = /```mermaid\s*([\s\S]*?)```/gi;
  const parts: Array<{ type: "text" | "mermaid"; text: string }> = [];
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push({ type: "text", text: text.slice(last, match.index) });
    }
    parts.push({ type: "mermaid", text: match[1].trim() });
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    parts.push({ type: "text", text: text.slice(last) });
  }

  if (parts.length === 0) {
    parts.push({ type: "text", text });
  }

  return parts;
}

function MermaidBlock({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const uid = useId().replace(/:/g, "");

  useEffect(() => {
    let cancelled = false;

    async function render() {
      if (!containerRef.current || !code) return;

      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "loose" });
        const { svg } = await mermaid.render(`mmd-${uid}`, code);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch {
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = `<pre class="text-[10px] overflow-x-auto p-2 bg-white/50 rounded-lg">${escapeHtml(code)}</pre>`;
        }
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [code, uid]);

  return (
    <div
      ref={containerRef}
      className="overflow-x-auto rounded-lg bg-white/60 p-2 my-1 [&_svg]:max-w-full"
    />
  );
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
