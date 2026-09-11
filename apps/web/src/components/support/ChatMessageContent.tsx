"use client";

import React from "react";

interface ChatMessageContentProps {
  content: string;
  isUser?: boolean;
}

export function ChatMessageContent({ content, isUser }: ChatMessageContentProps) {
  if (!content) return null;

  const textLines = content.split("\n");

  return (
    <div className="space-y-1.5 text-xs leading-relaxed break-words font-normal">
      {textLines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={lineIdx} className="h-1.5" />;
        }

        const isBullet = /^[•\-\*]\s+/.test(trimmed);
        const isNumbered = /^\d+[\.\)]\s+/.test(trimmed);

        if (isBullet) {
          const bulletText = trimmed.replace(/^[•\-\*]\s+/, "");
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-1 py-0.5">
              <span
                className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                  isUser ? "bg-white/80" : "bg-purple-600"
                }`}
              />
              <span className="flex-1">{renderFormattedTokens(bulletText, isUser)}</span>
            </div>
          );
        }

        if (isNumbered) {
          const numMatch = trimmed.match(/^(\d+[\.\)])\s+(.*)/);
          if (numMatch) {
            const numLabel = numMatch[1];
            const numText = numMatch[2];
            return (
              <div key={lineIdx} className="flex items-start gap-2 pl-1 py-0.5">
                <span
                  className={`shrink-0 font-bold ${
                    isUser ? "text-white/90" : "text-purple-700"
                  }`}
                >
                  {numLabel}
                </span>
                <span className="flex-1">{renderFormattedTokens(numText, isUser)}</span>
              </div>
            );
          }
        }

        return (
          <p key={lineIdx} className="m-0">
            {renderFormattedTokens(line, isUser)}
          </p>
        );
      })}
    </div>
  );
}

function renderFormattedTokens(text: string, isUser?: boolean) {
  const parts: React.ReactNode[] = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];

    if (token.startsWith("`") && token.endsWith("`") && token.length > 2) {
      parts.push(
        <code
          key={match.index}
          className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-medium ${
            isUser
              ? "bg-white/20 text-white"
              : "bg-slate-100 text-purple-700 border border-slate-200"
          }`}
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("**") && token.endsWith("**") && token.length > 4) {
      parts.push(
        <strong
          key={match.index}
          className={`font-black ${isUser ? "text-white font-bold" : "text-slate-900 font-bold"}`}
        >
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("*") && token.endsWith("*") && token.length > 2) {
      parts.push(
        <strong
          key={match.index}
          className={`font-black ${isUser ? "text-white font-bold" : "text-slate-900 font-bold"}`}
        >
          {token.slice(1, -1)}
        </strong>
      );
    } else if (token.startsWith("_") && token.endsWith("_") && token.length > 2) {
      parts.push(
        <em key={match.index} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    } else {
      parts.push(token);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}