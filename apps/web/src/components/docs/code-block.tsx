"use client";

import React, { useState, useMemo } from "react";
import { Check, Copy } from "lucide-react";
import Prism from "prismjs";

// Import Prism language grammars
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-dart";
import "prismjs/components/prism-markup-templating";
import "prismjs/components/prism-php";
import "prismjs/components/prism-python";
import "prismjs/components/prism-go";
import "prismjs/components/prism-kotlin";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";

// Disable Prism's automatic DOM scanner in client to prevent hydration mismatches
if (typeof window !== "undefined") {
  (Prism as any).manual = true;
}

export interface CodeBlockProps {
  code?: string | null;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  className?: string;
}

const languageMap: Record<string, string> = {
  flutter: "dart",
  dart: "dart",
  nodejs: "typescript",
  ts: "typescript",
  typescript: "typescript",
  js: "javascript",
  javascript: "javascript",
  php: "php",
  python: "python",
  py: "python",
  go: "go",
  golang: "go",
  kotlin: "kotlin",
  kt: "kotlin",
  csharp: "csharp",
  cs: "csharp",
  dotnet: "csharp",
  curl: "bash",
  bash: "bash",
  sh: "bash",
  json: "json",
};

export function CodeBlock({
  code,
  language = "typescript",
  filename,
  showLineNumbers = false,
  className = "",
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const normalizedLang = languageMap[language.toLowerCase()] || "typescript";
  const safeCode = typeof code === "string" ? code : "";

  const highlightedHtml = useMemo(() => {
    if (!safeCode) return "";
    const grammar = Prism.languages[normalizedLang] || Prism.languages.javascript;
    try {
      return Prism.highlight(safeCode, grammar, normalizedLang);
    } catch {
      return safeCode
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }
  }, [safeCode, normalizedLang]);

  const handleCopy = () => {
    if (!safeCode) return;
    navigator.clipboard.writeText(safeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const defaultFilename = useMemo(() => {
    if (filename) return filename;
    switch (normalizedLang) {
      case "dart":
        return "waply_client.dart";
      case "typescript":
        return "waply.ts";
      case "php":
        return "WaplyService.php";
      case "python":
        return "waply.py";
      case "go":
        return "waply.go";
      case "kotlin":
        return "WaplyClient.kt";
      case "csharp":
        return "WaplyClient.cs";
      case "bash":
        return "terminal.sh";
      case "json":
        return "payload.json";
      default:
        return "code";
    }
  }, [filename, normalizedLang]);

  return (
    <div
      className={`rounded-2xl overflow-hidden border border-[#2d2d30] bg-[#1e1e1e] shadow-2xl font-mono text-xs ${className}`}
    >
      {/* VS Code Window / Tab Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#252526] border-b border-[#333333] select-none">
        {/* Left: Window Dots & Active Tab */}
        <div className="flex items-center gap-3">
          {/* VS Code / Mac Window Dots */}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] inline-block opacity-80" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] inline-block opacity-80" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] inline-block opacity-80" />
          </div>

          {/* Active File Tab */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#1e1e1e] text-[#cccccc] border border-[#333333] text-[11px] font-medium shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#569cd6]" />
            <span>{defaultFilename}</span>
          </div>
        </div>

        {/* Right: Language Label & Copy Button */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-semibold text-[#858585] tracking-wider hidden sm:inline-block">
            {normalizedLang}
          </span>
          <button
            onClick={handleCopy}
            aria-label="Salin Kode"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#2d2d30] hover:bg-[#3e3e42] active:bg-[#4e4e52] text-[#cccccc] hover:text-white border border-[#3c3c3c] text-[11px] font-medium transition-colors cursor-pointer shadow-xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#4ec9b0]" />
                <span className="text-[#4ec9b0] font-semibold">Disalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#858585]" />
                <span>Salin</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* VS Code Dark+ Code Body */}
      <div className="p-4 sm:p-5 overflow-x-auto text-[#d4d4d4] leading-relaxed text-xs">
        <pre
          suppressHydrationWarning
          className={`vscode-dark-theme font-mono whitespace-pre-wrap break-words m-0 p-0 language-${normalizedLang}`}
        >
          <code
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            className={`language-${normalizedLang}`}
          />
        </pre>
      </div>
    </div>
  );
}
