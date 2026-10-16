import { FileCode2 } from "lucide-react";
import { Highlight, themes } from "prism-react-renderer";
import { useEffect, useState } from "react";
import { getSource, type Source } from "../api";

/** Line numbers (0-based) inside every @inngest_client.create_function(...) block. */
function decoratorLines(code: string): Set<number> {
  const lines = code.split("\n");
  const marked = new Set<number>();
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith("@inngest_client.create_function(")) continue;
    let j = i;
    while (j < lines.length && lines[j] !== ")") marked.add(j++);
    marked.add(j);
  }
  return marked;
}

export function CodePanel({ module }: { module: string }) {
  const [source, setSource] = useState<Source | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSource(module)
      .then(setSource)
      .catch((err) => setError(err.message));
  }, [module]);

  const highlighted = source ? decoratorLines(source.code) : new Set<number>();

  return (
    <section className="flex max-h-[32rem] min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-[#011627] lg:max-h-none">
      <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-sm">
        <FileCode2 className="size-4 text-zinc-400" />
        <code className="truncate font-mono text-zinc-300">
          {source?.path ?? `app/functions/${module}.py`}
        </code>
        <span className="ml-auto hidden items-center gap-1.5 text-xs text-zinc-500 sm:flex">
          <span className="size-2 rounded-sm bg-indigo-400/60" /> function config
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        {error && <p className="p-4 text-sm text-rose-400">{error}</p>}
        {source && (
          <Highlight code={source.code.trimEnd()} language="python" theme={themes.nightOwl}>
            {({ tokens, getLineProps, getTokenProps }) => (
              <pre className="min-w-max py-3 font-mono text-[0.8rem] leading-relaxed">
                {tokens.map((line, i) => {
                  const { className, ...rest } = getLineProps({ line });
                  const isConfig = highlighted.has(i);
                  return (
                    <div
                      key={i}
                      {...rest}
                      className={`${className} flex border-l-2 pr-4 ${
                        isConfig ? "border-indigo-400 bg-indigo-400/10" : "border-transparent"
                      }`}
                    >
                      <span className="w-10 shrink-0 select-none pr-3 text-right text-zinc-600">
                        {i + 1}
                      </span>
                      <span>
                        {line.map((token, k) => (
                          <span key={k} {...getTokenProps({ token })} />
                        ))}
                      </span>
                    </div>
                  );
                })}
              </pre>
            )}
          </Highlight>
        )}
      </div>
    </section>
  );
}
