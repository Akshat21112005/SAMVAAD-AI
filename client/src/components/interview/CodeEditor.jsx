import { useMemo } from "react";
import Editor from "@monaco-editor/react";

const MONACO_OPTS = {
  minimap: { enabled: true, scale: 0.85 },
  fontSize: 14,
  fontLigatures: true,
  scrollBeyondLastLine: false,
  smoothScrolling: true,
  padding: { top: 12, bottom: 12 },
  bracketPairColorization: { enabled: true },
  guides: { bracketPairs: true, indentation: true },
  renderLineHighlight: "line",
  cursorBlinking: "smooth",
  automaticLayout: true,
  tabSize: 2,
};

function mapLanguage(lang) {
  if (lang === "python") return "python";
  if (lang === "cpp") return "cpp";
  if (lang === "java") return "java";
  return "javascript";
}

function CodeEditor({ language, onChange, value, readOnly = false }) {
  const editorLang = useMemo(() => mapLanguage(language), [language]);

  return (
    <div className="flex h-full min-h-[min(70vh,720px)] flex-col overflow-hidden rounded-[1.15rem] border border-blue-500/20 bg-zinc-950 shadow-[inset_0_1px_0_rgba(59,130,246,0.08)]">
      <div className="flex items-center justify-between border-b border-blue-500/15 bg-zinc-900/90 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.55)]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-300/70">
            Workspace
          </span>
        </div>
        <span className="rounded-full border border-blue-500/25 bg-zinc-950 px-3 py-1 font-mono text-[11px] text-blue-200/90">
          {editorLang}
        </span>
      </div>
      <div className="relative min-h-0 flex-1 bg-zinc-950">
        <Editor
          language={editorLang}
          loading={
            <div className="flex h-full min-h-[320px] items-center justify-center text-sm text-blue-300/70">
              Loading editor…
            </div>
          }
          onChange={(v) => onChange(v ?? "")}
          options={{ ...MONACO_OPTS, readOnly }}
          path={`samvaad-solution.${editorLang === "python" ? "py" : editorLang === "cpp" ? "cpp" : editorLang === "java" ? "java" : "js"}`}
          theme="vs-dark"
          value={value}
        />
      </div>
    </div>
  );
}

export default CodeEditor;
