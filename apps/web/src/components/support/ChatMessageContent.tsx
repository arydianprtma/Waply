"use client";

import React, { useState } from "react";
import { FileText, Download, ExternalLink, FileArchive } from "lucide-react";
import type { TicketAttachment } from "@/lib/support-tickets";

interface ChatMessageContentProps {
  content: string;
  attachments?: TicketAttachment[];
  isUser?: boolean;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function ChatMessageContent({ content, attachments, isUser }: ChatMessageContentProps) {
  const textLines = content ? content.split("\n") : [];

  return (
    <div className="space-y-2.5 text-xs leading-relaxed break-words font-normal">
      {/* Text Message Content */}
      {textLines.length > 0 && (
        <div className="space-y-1.5">
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
      )}

      {/* Attachments Section */}
      {attachments && attachments.length > 0 && (
        <div className="pt-1 space-y-2">
          {attachments.map((att, attIdx) => {
            const isImg =
              att.isImage ||
              att.type?.startsWith("image/") ||
              /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(att.name || att.url);

            if (isImg) {
              return (
                <div key={att.id || attIdx} className="group relative rounded-xl overflow-hidden border border-slate-200/80 max-w-sm bg-slate-900/5">
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative overflow-hidden"
                  >
                    <img
                      src={att.url}
                      alt={att.name}
                      className="max-h-60 w-auto rounded-xl object-contain hover:scale-[1.02] transition-transform duration-200"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-semibold backdrop-blur-[2px]">
                      <ExternalLink className="w-4 h-4" />
                      <span>Buka Gambar Penuh</span>
                    </div>
                  </a>
                  <div className="px-2.5 py-1.5 bg-slate-900/80 text-white text-[10px] flex items-center justify-between gap-2 backdrop-blur-xs">
                    <span className="truncate max-w-[200px] font-medium">{att.name}</span>
                    <span className="text-slate-300 shrink-0 font-mono">{formatBytes(att.size)}</span>
                  </div>
                </div>
              );
            }

            // Document / Generic File Attachment Card
            const isArchive = /\.(zip|rar|7z|tar|gz)$/i.test(att.name || "");

            return (
              <a
                key={att.id || attIdx}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                download={att.name}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                  isUser
                    ? "bg-white/10 hover:bg-white/20 border-white/20 text-white"
                    : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isUser
                      ? "bg-white/20 text-white"
                      : isArchive
                      ? "bg-amber-100 text-amber-700"
                      : "bg-purple-100 text-purple-700"
                  }`}
                >
                  {isArchive ? <FileArchive className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate text-[11px] leading-tight">{att.name}</div>
                  <div className={`text-[10px] font-mono mt-0.5 ${isUser ? "text-white/80" : "text-slate-500"}`}>
                    {formatBytes(att.size)}
                  </div>
                </div>
                <div
                  className={`p-1.5 rounded-lg shrink-0 ${
                    isUser ? "bg-white/20 text-white" : "bg-white text-slate-700 border border-slate-200 shadow-2xs"
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                </div>
              </a>
            );
          })}
        </div>
      )}
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