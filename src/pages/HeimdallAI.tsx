import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Plus, Paperclip, X, Trash2, MessageSquare,
  Sparkles, Image as ImageIcon, ChevronRight, Shield,
  ShieldCheck, BarChart2, Compass, ScanEye,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import HeimdallAILogo from '@/components/HeimdallAILogo';
import { useAuth } from '@/contexts/AuthContext';

// ── Constants ─────────────────────────────────────────────────────────────────
const DAILY_IMAGE_LIMIT = 50;
const MAX_IMAGE_MB = 5;
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const API_BASE = import.meta.env.VITE_API_URL || 'https://staging.breachnet.io/api/v1';

// ── Types ─────────────────────────────────────────────────────────────────────
interface ContentBlock {
  type: 'text' | 'image';
  text?: string;
  source?: { type: 'base64'; media_type: string; data: string };
}
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string | ContentBlock[];
  timestamp: string;
  imagePreviews?: string[];   // array — supports multiple pasted/uploaded images
}
type PendingImage = { data: string; mimeType: string; preview: string };
interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const getMessageText = (content: string | ContentBlock[]): string => {
  if (typeof content === 'string') return content;
  return content.filter(b => b.type === 'text').map(b => b.text || '').join(' ');
};

// ── Markdown renderer ─────────────────────────────────────────────────────────
const inlineMarkdown = (text: string): React.ReactNode => {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|\[([^\]]+)\]\((https?:\/\/[^)]+)\))/g);
  const result: React.ReactNode[] = [];
  let k = 0;
  while (k < parts.length) {
    const part = parts[k];
    if (!part) { k++; continue; }
    if (part.startsWith('**') && part.endsWith('**'))
      result.push(<strong key={k} className="font-semibold">{part.slice(2, -2)}</strong>);
    else if (part.startsWith('`') && part.endsWith('`'))
      result.push(<code key={k} className="rounded-md bg-slate-100 dark:bg-slate-700/80 px-1.5 py-0.5 text-xs font-mono text-blue-600 dark:text-blue-400">{part.slice(1, -1)}</code>);
    else if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**'))
      result.push(<em key={k}>{part.slice(1, -1)}</em>);
    else if (/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/.test(part)) {
      const m = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
      if (m) result.push(
        <a key={k} href={m[2]} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
          {m[1]}
          <svg className="h-3 w-3 flex-shrink-0" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 10L10 2M10 2H5M10 2v5"/></svg>
        </a>
      );
    } else {
      // also auto-link bare URLs
      const urlParts = part.split(/(https?:\/\/[^\s]+)/g);
      urlParts.forEach((up, ui) => {
        if (/^https?:\/\//.test(up))
          result.push(
            <a key={`${k}-${ui}`} href={up} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:text-blue-700 dark:hover:text-blue-300 transition-colors break-all">
              {up}
              <svg className="h-3 w-3 flex-shrink-0" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 10L10 2M10 2H5M10 2v5"/></svg>
            </a>
          );
        else result.push(up);
      });
    }
    k++;
  }
  return result;
};

const isTableLine = (line: string) => line.trim().startsWith('|') && line.trim().endsWith('|');
const isSeparatorLine = (line: string) => /^\|[\s\-:|]+\|$/.test(line.trim());

const renderMarkdown = (text: string): React.ReactNode[] => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) { codeLines.push(lines[i]); i++; }
      elements.push(
        <pre key={`code-${i}`} className="my-3 rounded-xl bg-slate-900 dark:bg-slate-950 p-4 overflow-x-auto text-xs font-mono text-slate-100 border border-slate-700">
          {lang && <span className="block text-[10px] text-slate-400 mb-2 font-sans uppercase tracking-wider">{lang}</span>}
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      i++; continue;
    }
    // ── Table detection ──────────────────────────────────────────────────────
    if (isTableLine(line)) {
      const tableLines: string[] = [line];
      let j = i + 1;
      while (j < lines.length && isTableLine(lines[j])) { tableLines.push(lines[j]); j++; }
      const parseRow = (r: string) => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const headerRow = parseRow(tableLines[0]);
      const dataRows = tableLines.slice(2).filter(r => !isSeparatorLine(r)).map(parseRow);
      elements.push(
        <div key={`table-${i}`} className="my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60">
                {headerRow.map((h, hi) => (
                  <th key={hi} className="px-4 py-2.5 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
                    {inlineMarkdown(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-slate-50/60 dark:bg-slate-800/20'}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-4 py-2.5 text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800/60 text-sm leading-relaxed">
                      {inlineMarkdown(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      i = j; continue;
    }
    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-sm font-bold text-slate-900 dark:text-white mt-4 mb-1.5">{inlineMarkdown(line.slice(4))}</h3>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-base font-bold text-slate-900 dark:text-white mt-4 mb-2">{inlineMarkdown(line.slice(3))}</h2>);
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2">{inlineMarkdown(line.slice(2))}</h1>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const items: string[] = [line.slice(2)];
      let j = i + 1;
      while (j < lines.length && (lines[j].startsWith('- ') || lines[j].startsWith('* '))) { items.push(lines[j].slice(2)); j++; }
      elements.push(
        <ul key={i} className="my-2 space-y-1.5 list-none">
          {items.map((item, k) => (
            <li key={k} className="flex items-start gap-2.5 text-sm leading-relaxed">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-blue-400 flex-shrink-0" />
              <span>{inlineMarkdown(item)}</span>
            </li>
          ))}
        </ul>
      );
      i = j; continue;
    } else if (/^\d+\. /.test(line)) {
      const items: string[] = [line.replace(/^\d+\. /, '')];
      let j = i + 1;
      while (j < lines.length && /^\d+\. /.test(lines[j])) { items.push(lines[j].replace(/^\d+\. /, '')); j++; }
      elements.push(
        <ol key={i} className="my-2 space-y-1.5 list-none">
          {items.map((item, k) => (
            <li key={k} className="flex items-start gap-2.5 text-sm leading-relaxed">
              <span className="flex-shrink-0 text-xs font-bold text-blue-500 dark:text-blue-400 mt-0.5 min-w-[1.25rem]">{k + 1}.</span>
              <span>{inlineMarkdown(item)}</span>
            </li>
          ))}
        </ol>
      );
      i = j; continue;
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(<p key={i} className="text-sm leading-relaxed">{inlineMarkdown(line)}</p>);
    }
    i++;
  }
  return elements;
};

// ── Typing indicator ──────────────────────────────────────────────────────────
const TypingIndicator: React.FC = () => (
  <div className="flex items-start gap-4 py-2 max-w-3xl mx-auto w-full">
    <div className="flex-shrink-0 h-9 w-9 flex items-center justify-center mt-0.5">
      <HeimdallAILogo size={36} />
    </div>
    <div className="flex items-center gap-1.5 py-4">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="h-2 w-2 rounded-full bg-blue-400 dark:bg-blue-500"
          animate={{ y: ['0%', '-55%', '0%'], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 0.75, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
        />
      ))}
    </div>
  </div>
);

// ── Blinking cursor ───────────────────────────────────────────────────────────
const BlinkCursor: React.FC = () => (
  <motion.span
    className="inline-block w-[2px] h-[1em] bg-blue-500 dark:bg-blue-400 ml-0.5 align-text-bottom rounded-full"
    animate={{ opacity: [1, 0, 1] }}
    transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
  />
);

// ── Message bubble ────────────────────────────────────────────────────────────
const MessageBubble: React.FC<{
  message: Message;
  avatarToken: typeof AVATAR_TOKENS[0];
  displayText?: string;
  isTyping?: boolean;
  onRetry?: () => void;
}> = ({ message, avatarToken, displayText, isTyping, onRetry }) => {
  const isUser = message.role === 'user';
  const fullText = getMessageText(message.content);
  const shownText = displayText !== undefined ? displayText : fullText;
  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={`flex items-start gap-4 py-2 max-w-3xl mx-auto w-full ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 h-9 w-9 flex items-center justify-center mt-0.5">
          <HeimdallAILogo size={36} />
        </div>
      )}
      {isUser && (
        <div
          className="flex-shrink-0 h-9 w-9 rounded-2xl flex items-center justify-center shadow-md mt-0.5 select-none"
          style={{ background: `linear-gradient(135deg, ${avatarToken.from}, ${avatarToken.to})`, boxShadow: `0 0 0 1.5px ${avatarToken.to}30, 0 2px 6px ${avatarToken.from}55` }}
        >
          {avatarToken.svg}
        </div>
      )}

      <div className={`flex flex-col gap-1.5 min-w-0 ${isUser ? 'items-end' : 'items-start'} max-w-[calc(100%-3.5rem)]`}>
        {/* Image previews */}
        {message.imagePreviews && message.imagePreviews.length > 0 && (
          <div className={`flex flex-wrap gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {message.imagePreviews.map((src, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                <img src={src} alt={`Image ${i + 1}`} className="max-h-52 max-w-[240px] w-auto object-contain" />
              </div>
            ))}
          </div>
        )}

        {/* Message content */}
        {shownText && (
          isUser ? (
            /* User: keep the gradient bubble */
            <div className="px-5 py-3.5 shadow-sm rounded-3xl rounded-tr-md bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{shownText}</p>
            </div>
          ) : (
            /* AI: no box — render text directly with optional typing cursor */
            <div className="text-slate-800 dark:text-slate-100 leading-relaxed">
              <div className="space-y-0.5">
                {renderMarkdown(shownText)}
                {isTyping && <BlinkCursor />}
              </div>
            </div>
          )
        )}

        {/* Timestamp — hide while typing so it doesn't flash prematurely */}
        {!isTyping && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 px-1">{time}</span>
        )}

        {/* Retry button — only for user messages */}
        {isUser && onRetry && !isTyping && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors px-1"
          >
            <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1.5 8A6.5 6.5 0 1 0 4 3.5" />
              <path d="M1.5 3.5v4h4" />
            </svg>
            Retry
          </button>
        )}
      </div>
    </motion.div>
  );
};

// ── Welcome Modal ─────────────────────────────────────────────────────────────
const WelcomeModal: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <motion.div
      initial={{ opacity: 0, scale: 0.93, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.93, y: 16 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#0d1829] border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden"
    >
      <div className="bg-gradient-to-br from-[#1e3a8a] via-[#2563eb] to-[#06b6d4] px-8 pt-10 pb-8 text-center relative">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, white 0%, transparent 60%)' }} />
        <div className="relative mx-auto mb-5 flex items-center justify-center">
          <HeimdallAILogo size={60} inverted />
        </div>
        <h2 className="relative text-2xl font-bold text-white tracking-tight">Meet Heimdall AI</h2>
        <p className="relative mt-1.5 text-sm text-blue-100 font-medium">Your intelligent security companion</p>
      </div>
      <div className="px-8 py-7 space-y-3">
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Your expert security assistant, built right into the platform.</p>
        {[
          { icon: <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" strokeWidth={2} />, text: 'WAF rules, OWASP threats, and attack patterns', bg: 'bg-blue-50 dark:bg-blue-500/10' },
          { icon: <BarChart2 className="h-4 w-4 text-cyan-600 dark:text-cyan-400" strokeWidth={2} />, text: 'Analysing your threat logs and security events', bg: 'bg-cyan-50 dark:bg-cyan-500/10' },
          { icon: <Compass className="h-4 w-4 text-violet-600 dark:text-violet-400" strokeWidth={2} />, text: 'Navigating the Heimdall platform', bg: 'bg-violet-50 dark:bg-violet-500/10' },
          { icon: <ScanEye className="h-4 w-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />, text: 'Reading screenshots of dashboards or logs', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
        ].map(({ icon, text, bg }) => (
          <div key={text} className="flex items-center gap-3">
            <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px] ${bg}`}>{icon}</span>
            <span className="text-sm text-slate-600 dark:text-slate-300">{text}</span>
          </div>
        ))}
        <Button
          onClick={onDismiss}
          className="w-full mt-2 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#06b6d4] text-white font-semibold shadow-md hover:shadow-lg transition-all h-11"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Start chatting
        </Button>
      </div>
    </motion.div>
  </div>
);

// ── Suggestion chip icons ─────────────────────────────────────────────────────
const IconOWASP = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <path d="M10 2L3 5.5V10.5C3 14.5 6.2 18.1 10 19C13.8 18.1 17 14.5 17 10.5V5.5L10 2Z"
      stroke="#2563eb" strokeWidth="1.4" strokeLinejoin="round" fill="rgba(37,99,235,0.08)" />
    <path d="M7 10l2 2 4-4" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconRateLimit = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="7.5" stroke="#06b6d4" strokeWidth="1.4" fill="rgba(6,182,212,0.08)" />
    <path d="M10 5.5v4.5l3 2" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 10h1M15 10h1M10 4V3" stroke="#06b6d4" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);
const IconWAF = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <rect x="3" y="4" width="14" height="12" rx="2" stroke="#7c3aed" strokeWidth="1.4" fill="rgba(124,58,237,0.08)" />
    <line x1="3" y1="8" x2="17" y2="8" stroke="#7c3aed" strokeWidth="1.2" />
    <line x1="7" y1="8" x2="7" y2="16" stroke="#7c3aed" strokeWidth="1.2" />
    <circle cx="5" cy="6" r="0.8" fill="#7c3aed" />
    <circle cx="8" cy="6" r="0.8" fill="#7c3aed" />
  </svg>
);
const IconLogs = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="7.5" stroke="#0891b2" strokeWidth="1.4" fill="rgba(8,145,178,0.08)" />
    <circle cx="10" cy="10" r="3" stroke="#0891b2" strokeWidth="1.3" />
    <line x1="10" y1="2.5" x2="10" y2="5" stroke="#0891b2" strokeWidth="1.3" strokeLinecap="round" />
    <line x1="10" y1="15" x2="10" y2="17.5" stroke="#0891b2" strokeWidth="1.3" strokeLinecap="round" />
    <line x1="2.5" y1="10" x2="5" y2="10" stroke="#0891b2" strokeWidth="1.3" strokeLinecap="round" />
    <line x1="15" y1="10" x2="17.5" y2="10" stroke="#0891b2" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

// ── User avatar — identical token system as PlatformIndicator ────────────────
const djb2 = (s: string) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return Math.abs(h >>> 0);
};

const AVATAR_TOKENS: Array<{ from: string; to: string; svg: React.ReactNode }> = [
  { from: "#1e3a8a", to: "#06b6d4", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><circle cx="10" cy="10" r="2.5" fill="white" fillOpacity="0.95" /><circle cx="3" cy="3" r="1.5" fill="white" fillOpacity="0.6" /><circle cx="17" cy="3" r="1.5" fill="white" fillOpacity="0.6" /><circle cx="3" cy="17" r="1.5" fill="white" fillOpacity="0.6" /><circle cx="17" cy="17" r="1.5" fill="white" fillOpacity="0.6" /><line x1="3" y1="3" x2="10" y2="10" stroke="white" strokeOpacity="0.55" strokeWidth="1.2" /><line x1="17" y1="3" x2="10" y2="10" stroke="white" strokeOpacity="0.55" strokeWidth="1.2" /><line x1="3" y1="17" x2="10" y2="10" stroke="white" strokeOpacity="0.55" strokeWidth="1.2" /><line x1="17" y1="17" x2="10" y2="10" stroke="white" strokeOpacity="0.55" strokeWidth="1.2" /></svg>) },
  { from: "#312e81", to: "#6366f1", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><path d="M3 14 Q6 8 13 5" stroke="white" strokeOpacity="0.9" strokeWidth="1.6" strokeLinecap="round" /><path d="M5 16 Q9 11 15 8" stroke="white" strokeOpacity="0.55" strokeWidth="1.2" strokeLinecap="round" /><path d="M7 18 Q12 14 17 11" stroke="white" strokeOpacity="0.3" strokeWidth="0.9" strokeLinecap="round" /><circle cx="13.5" cy="4.5" r="2.5" fill="white" fillOpacity="0.9" /><circle cx="13.5" cy="4.5" r="1" fill="white" /></svg>) },
  { from: "#be123c", to: "#f97316", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><path d="M10 3 C6.5 3 4 5.8 4 9 C4 11.5 5 13.5 6.5 15" stroke="white" strokeOpacity="0.95" strokeWidth="1.4" strokeLinecap="round" /><path d="M10 5.5 C7.5 5.5 6 7.2 6 9 C6 10.5 6.8 11.8 8 13" stroke="white" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round" /><path d="M10 8 C9 8 8.5 8.6 8.5 9.2 C8.5 9.8 9 10.8 9.5 11.5" stroke="white" strokeOpacity="0.9" strokeWidth="1.2" strokeLinecap="round" /><path d="M10 5.5 C12.5 5.5 14 7.2 14 9 C14 11 12.5 13 11 14.5 C13 13.5 16 11 16 9 C16 5.8 13.5 3 10 3" stroke="white" strokeOpacity="0.5" strokeWidth="1.1" strokeLinecap="round" /></svg>) },
  { from: "#065f46", to: "#14b8a6", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><circle cx="4" cy="5" r="1.8" fill="white" fillOpacity="0.9" /><circle cx="4" cy="10" r="1.8" fill="white" fillOpacity="0.9" /><circle cx="4" cy="15" r="1.8" fill="white" fillOpacity="0.9" /><circle cx="10" cy="7.5" r="1.8" fill="white" fillOpacity="0.75" /><circle cx="10" cy="12.5" r="1.8" fill="white" fillOpacity="0.75" /><circle cx="16" cy="10" r="1.8" fill="white" fillOpacity="0.9" /><line x1="5.8" y1="5.2" x2="8.2" y2="7.3" stroke="white" strokeOpacity="0.5" strokeWidth="1" /><line x1="5.8" y1="10" x2="8.2" y2="7.5" stroke="white" strokeOpacity="0.5" strokeWidth="1" /><line x1="5.8" y1="10" x2="8.2" y2="12.5" stroke="white" strokeOpacity="0.5" strokeWidth="1" /><line x1="5.8" y1="14.8" x2="8.2" y2="12.7" stroke="white" strokeOpacity="0.5" strokeWidth="1" /><line x1="11.8" y1="7.5" x2="14.2" y2="9.8" stroke="white" strokeOpacity="0.5" strokeWidth="1" /><line x1="11.8" y1="12.5" x2="14.2" y2="10.2" stroke="white" strokeOpacity="0.5" strokeWidth="1" /></svg>) },
  { from: "#1e1b4b", to: "#7c3aed", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><path d="M10 2 L16 5 L16 10 C16 13.5 13 16.5 10 18 C7 16.5 4 13.5 4 10 L4 5 Z" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.9" strokeWidth="1.3" /><rect x="7.5" y="9" width="5" height="4" rx="1" fill="white" fillOpacity="0.9" /><path d="M8.5 9 L8.5 7.5 C8.5 6.4 11.5 6.4 11.5 7.5 L11.5 9" stroke="white" strokeOpacity="0.9" strokeWidth="1.2" strokeLinecap="round" fill="none" /><circle cx="10" cy="11" r="0.8" fill="white" fillOpacity="0.5" /></svg>) },
  { from: "#92400e", to: "#fbbf24", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><ellipse cx="10" cy="5.5" rx="6" ry="2" fill="white" fillOpacity="0.9" /><path d="M4 5.5 L4 10 C4 11.1 6.7 12 10 12 C13.3 12 16 11.1 16 10 L16 5.5" stroke="white" strokeOpacity="0.6" strokeWidth="1.2" fill="none" /><path d="M4 10 L4 14.5 C4 15.6 6.7 16.5 10 16.5 C13.3 16.5 16 15.6 16 14.5 L16 10" stroke="white" strokeOpacity="0.4" strokeWidth="1.2" fill="none" /></svg>) },
  { from: "#0f172a", to: "#22c55e", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><rect x="2.5" y="4" width="15" height="12" rx="2.5" fill="white" fillOpacity="0.1" stroke="white" strokeOpacity="0.8" strokeWidth="1.2" /><path d="M5.5 8 L8 10 L5.5 12" stroke="white" strokeOpacity="0.9" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /><line x1="9.5" y1="12" x2="14" y2="12" stroke="white" strokeOpacity="0.7" strokeWidth="1.3" strokeLinecap="round" /></svg>) },
  { from: "#0c4a6e", to: "#38bdf8", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><polyline points="2,10 4,10 5,6 6,14 7.5,8 9,13 10.5,7 12,13 13.5,9 15,11 16,10 18,10" stroke="white" strokeOpacity="0.95" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>) },
  { from: "#4338ca", to: "#ec4899", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><polygon points="10,2 13.5,4 13.5,8 10,10 6.5,8 6.5,4" fill="white" fillOpacity="0.2" stroke="white" strokeOpacity="0.9" strokeWidth="1.2" /><polygon points="10,10 13.5,12 13.5,16 10,18 6.5,16 6.5,12" fill="white" fillOpacity="0.1" stroke="white" strokeOpacity="0.55" strokeWidth="1" /><circle cx="10" cy="6" r="1.5" fill="white" fillOpacity="0.9" /></svg>) },
  { from: "#075985", to: "#7dd3fc", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><path d="M5.5 14 C3.5 14 2 12.5 2 10.5 C2 8.8 3.2 7.4 4.9 7.1 C4.7 6.7 4.5 6.2 4.5 5.5 C4.5 3.6 6.1 2 8 2 C9.4 2 10.6 2.8 11.2 4 C11.5 3.9 11.8 3.8 12.2 3.8 C14.1 3.8 15.6 5.3 15.6 7.2 C15.6 7.3 15.6 7.4 15.6 7.5 C16.9 7.9 18 9 18 10.5 C18 12.5 16.4 14 14.5 14" stroke="white" strokeOpacity="0.9" strokeWidth="1.3" strokeLinecap="round" fill="none" /><path d="M10 17 L10 10" stroke="white" strokeOpacity="0.9" strokeWidth="1.4" strokeLinecap="round" /><path d="M7.5 12 L10 9.5 L12.5 12" stroke="white" strokeOpacity="0.9" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>) },
  { from: "#5b21b6", to: "#d946ef", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><path d="M7 2 C7 5 13 6 13 10 C13 14 7 15 7 18" stroke="white" strokeOpacity="0.9" strokeWidth="1.5" strokeLinecap="round" fill="none" /><path d="M13 2 C13 5 7 6 7 10 C7 14 13 15 13 18" stroke="white" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" fill="none" /><line x1="7.5" y1="5.5" x2="12.5" y2="5.5" stroke="white" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round" /><line x1="8.5" y1="10" x2="11.5" y2="10" stroke="white" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round" /><line x1="7.5" y1="14.5" x2="12.5" y2="14.5" stroke="white" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round" /></svg>) },
  { from: "#064e3b", to: "#10b981", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><text x="2" y="8" fontSize="5" fill="white" fillOpacity="0.95" fontFamily="monospace" fontWeight="bold">10</text><text x="10" y="8" fontSize="5" fill="white" fillOpacity="0.5" fontFamily="monospace" fontWeight="bold">01</text><text x="2" y="13" fontSize="5" fill="white" fillOpacity="0.5" fontFamily="monospace" fontWeight="bold">01</text><text x="10" y="13" fontSize="5" fill="white" fillOpacity="0.95" fontFamily="monospace" fontWeight="bold">10</text><text x="2" y="18" fontSize="5" fill="white" fillOpacity="0.3" fontFamily="monospace" fontWeight="bold">11</text><text x="10" y="18" fontSize="5" fill="white" fillOpacity="0.6" fontFamily="monospace" fontWeight="bold">00</text></svg>) },
  { from: "#1e293b", to: "#f97316", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><circle cx="10" cy="10" r="3" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.9" strokeWidth="1.3" /><circle cx="10" cy="10" r="1.2" fill="white" fillOpacity="0.9" /><path d="M10 2.5 L10 4.5 M10 15.5 L10 17.5 M2.5 10 L4.5 10 M15.5 10 L17.5 10 M4.4 4.4 L5.8 5.8 M14.2 14.2 L15.6 15.6 M15.6 4.4 L14.2 5.8 M5.8 14.2 L4.4 15.6" stroke="white" strokeOpacity="0.7" strokeWidth="1.4" strokeLinecap="round" /></svg>) },
  { from: "#1d4ed8", to: "#f472b6", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><rect x="2" y="14" width="3" height="4" rx="1" fill="white" fillOpacity="0.5" /><rect x="6.5" y="11" width="3" height="7" rx="1" fill="white" fillOpacity="0.7" /><rect x="11" y="7.5" width="3" height="10.5" rx="1" fill="white" fillOpacity="0.85" /><rect x="15.5" y="4" width="3" height="14" rx="1" fill="white" fillOpacity="0.95" /></svg>) },
  { from: "#0f766e", to: "#a7f3d0", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><ellipse cx="10" cy="10" rx="8" ry="3.2" stroke="white" strokeOpacity="0.9" strokeWidth="1.2" fill="none" /><ellipse cx="10" cy="10" rx="8" ry="3.2" stroke="white" strokeOpacity="0.6" strokeWidth="1.2" fill="none" transform="rotate(60 10 10)" /><ellipse cx="10" cy="10" rx="8" ry="3.2" stroke="white" strokeOpacity="0.4" strokeWidth="1.2" fill="none" transform="rotate(120 10 10)" /><circle cx="10" cy="10" r="1.8" fill="white" fillOpacity="0.95" /></svg>) },
  { from: "#1a2e05", to: "#84cc16", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><circle cx="10" cy="10" r="7.5" stroke="white" strokeOpacity="0.3" strokeWidth="1" fill="none" /><circle cx="10" cy="10" r="5" stroke="white" strokeOpacity="0.4" strokeWidth="1" fill="none" /><circle cx="10" cy="10" r="2.5" stroke="white" strokeOpacity="0.55" strokeWidth="1" fill="none" /><line x1="10" y1="10" x2="10" y2="2.5" stroke="white" strokeOpacity="0.9" strokeWidth="1.3" strokeLinecap="round" /><line x1="10" y1="10" x2="16.5" y2="6.5" stroke="white" strokeOpacity="0.35" strokeWidth="1.2" strokeLinecap="round" /><circle cx="14.5" cy="5.5" r="1.2" fill="white" fillOpacity="0.9" /></svg>) },
  { from: "#713f12", to: "#facc15", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><path d="M11.5 2 L5.5 11.5 L9.5 11.5 L8.5 18 L14.5 8.5 L10.5 8.5 Z" fill="white" fillOpacity="0.95" /></svg>) },
  { from: "#0f2744", to: "#22d3ee", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><circle cx="10" cy="10" r="7.5" stroke="white" strokeOpacity="0.9" strokeWidth="1.2" fill="none" /><ellipse cx="10" cy="10" rx="4" ry="7.5" stroke="white" strokeOpacity="0.55" strokeWidth="1" fill="none" /><line x1="2.5" y1="10" x2="17.5" y2="10" stroke="white" strokeOpacity="0.55" strokeWidth="1" /><path d="M3.5 6.5 Q10 5 16.5 6.5" stroke="white" strokeOpacity="0.4" strokeWidth="0.9" fill="none" /><path d="M3.5 13.5 Q10 15 16.5 13.5" stroke="white" strokeOpacity="0.4" strokeWidth="0.9" fill="none" /></svg>) },
  { from: "#18181b", to: "#818cf8", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><rect x="2" y="2" width="5" height="5" rx="1" fill="white" fillOpacity="0.9" /><rect x="3" y="3" width="3" height="3" rx="0.5" fill="white" fillOpacity="0.2" /><rect x="13" y="2" width="5" height="5" rx="1" fill="white" fillOpacity="0.9" /><rect x="14" y="3" width="3" height="3" rx="0.5" fill="white" fillOpacity="0.2" /><rect x="2" y="13" width="5" height="5" rx="1" fill="white" fillOpacity="0.9" /><rect x="3" y="14" width="3" height="3" rx="0.5" fill="white" fillOpacity="0.2" /><rect x="9" y="2" width="2" height="2" rx="0.5" fill="white" fillOpacity="0.7" /><rect x="9" y="5.5" width="2" height="2" rx="0.5" fill="white" fillOpacity="0.5" /><rect x="13" y="9" width="2" height="2" rx="0.5" fill="white" fillOpacity="0.7" /><rect x="9" y="9" width="2" height="2" rx="0.5" fill="white" fillOpacity="0.9" /><rect x="16" y="9" width="2" height="2" rx="0.5" fill="white" fillOpacity="0.5" /><rect x="9" y="13" width="2" height="2" rx="0.5" fill="white" fillOpacity="0.6" /><rect x="13" y="13" width="5" height="2" rx="0.5" fill="white" fillOpacity="0.4" /><rect x="13" y="16" width="2" height="2" rx="0.5" fill="white" fillOpacity="0.7" /><rect x="16" y="16" width="2" height="2" rx="0.5" fill="white" fillOpacity="0.4" /></svg>) },
  { from: "#7f1d1d", to: "#fb923c", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><path d="M10 2 C10 2 14 5 14 10 L12.5 13 L7.5 13 L6 10 C6 5 10 2 10 2 Z" fill="white" fillOpacity="0.9" /><path d="M7.5 13 L6 16 L8 15 Z" fill="white" fillOpacity="0.6" /><path d="M12.5 13 L14 16 L12 15 Z" fill="white" fillOpacity="0.6" /><circle cx="10" cy="8.5" r="1.8" fill="white" fillOpacity="0.2" stroke="white" strokeOpacity="0.6" strokeWidth="1" /></svg>) },
  { from: "#1d4ed8", to: "#a855f7", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><path d="M3.5 10 C3.5 7.5 5.2 5.5 7.5 5.5 C9 5.5 10 6.5 10 6.5 C10 6.5 11 5.5 12.5 5.5 C14.8 5.5 16.5 7.5 16.5 10 C16.5 12.5 14.8 14.5 12.5 14.5 C11 14.5 10 13.5 10 13.5 C10 13.5 9 14.5 7.5 14.5 C5.2 14.5 3.5 12.5 3.5 10 Z" stroke="white" strokeOpacity="0.95" strokeWidth="1.5" fill="none" /><circle cx="7.5" cy="10" r="1.3" fill="white" fillOpacity="0.9" /><circle cx="12.5" cy="10" r="1.3" fill="white" fillOpacity="0.5" /></svg>) },
  { from: "#134e4a", to: "#86efac", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><rect x="2.5" y="3" width="15" height="4" rx="1.5" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.9" strokeWidth="1.2" /><rect x="2.5" y="8" width="15" height="4" rx="1.5" fill="white" fillOpacity="0.1" stroke="white" strokeOpacity="0.65" strokeWidth="1.2" /><rect x="2.5" y="13" width="15" height="4" rx="1.5" fill="white" fillOpacity="0.05" stroke="white" strokeOpacity="0.4" strokeWidth="1.2" /><circle cx="14.5" cy="5" r="1" fill="white" fillOpacity="0.9" /><circle cx="14.5" cy="10" r="1" fill="white" fillOpacity="0.6" /><circle cx="14.5" cy="15" r="1" fill="white" fillOpacity="0.35" /></svg>) },
  { from: "#0f172a", to: "#60a5fa", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><path d="M7 7 L7 5 C7 3.9 7.9 3 9 3 C10.1 3 11 3.9 11 5 L11 7 L13 7 L13 5 C13 3.9 13.9 3 15 3 C16.1 3 17 3.9 17 5 C17 6.1 16.1 7 15 7 L13 7 L13 9 L15 9 C16.1 9 17 9.9 17 11 C17 12.1 16.1 13 15 13 L13 13 L13 15 C13 16.1 12.1 17 11 17 C9.9 17 9 16.1 9 15 L9 13 L7 13 L7 15 C7 16.1 6.1 17 5 17 C3.9 17 3 16.1 3 15 C3 13.9 3.9 13 5 13 L7 13 L7 11 L5 11 C3.9 11 3 10.1 3 9 C3 7.9 3.9 7 5 7 L7 7 Z M9 7 L9 9 L11 9 L11 7 Z M9 11 L9 13 L11 13 L11 11 Z" fill="white" fillOpacity="0.9" /></svg>) },
  { from: "#831843", to: "#fb7185", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><circle cx="10" cy="10" r="7.5" stroke="white" strokeOpacity="0.25" strokeWidth="1" fill="none" /><circle cx="10" cy="10" r="5" stroke="white" strokeOpacity="0.4" strokeWidth="1.2" fill="none" /><circle cx="10" cy="10" r="2.5" fill="white" fillOpacity="0.9" /><line x1="10" y1="2.5" x2="10" y2="5" stroke="white" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round" /><line x1="10" y1="15" x2="10" y2="17.5" stroke="white" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round" /><line x1="2.5" y1="10" x2="5" y2="10" stroke="white" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round" /><line x1="15" y1="10" x2="17.5" y2="10" stroke="white" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round" /></svg>) },
];

// ── Suggestion chips ──────────────────────────────────────────────────────────
const SUGGESTIONS = [
  { icon: <IconOWASP />, text: 'What are the OWASP Top 10 risks I should monitor?' },
  { icon: <IconRateLimit />, text: 'How do I configure rate limiting for my APIs?' },
  { icon: <IconWAF />, text: 'Explain the WAF rules on the platform' },
  { icon: <IconLogs />, text: 'How do I read the Security Hub threat logs?' },
];

// ── Main Component ────────────────────────────────────────────────────────────
const HeimdallAI: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  // ── Per-user localStorage keys ─────────────────────────────────────────────
  const userId = user?.id ?? user?.email ?? 'default';
  const HISTORY_KEY  = `heimdall_ai_history_${userId}`;
  const WELCOMED_KEY = `heimdall_ai_welcomed_${userId}`;
  const IMAGE_COUNT_KEY = `heimdall_ai_images_today_${userId}`;
  const IMAGE_DATE_KEY  = `heimdall_ai_images_date_${userId}`;

  const getImageUsage = useCallback((): number => {
    try {
      const date = localStorage.getItem(IMAGE_DATE_KEY) || '';
      const today = new Date().toISOString().slice(0, 10);
      if (date !== today) return 0;
      return parseInt(localStorage.getItem(IMAGE_COUNT_KEY) || '0', 10);
    } catch { return 0; }
  }, [IMAGE_DATE_KEY, IMAGE_COUNT_KEY]);

  const incrementImageCount = useCallback((count = 1) => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem(IMAGE_DATE_KEY, today);
      localStorage.setItem(IMAGE_COUNT_KEY, String(getImageUsage() + count));
    } catch {}
  }, [IMAGE_DATE_KEY, IMAGE_COUNT_KEY, getImageUsage]);

  // ── Router state (prefill from navigation) ────────────────────────────────
  const location = useLocation();

  // ── State ──────────────────────────────────────────────────────────────────
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [chatSidebarOpen, setChatSidebarOpen] = useState(false);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [remainingImages, setRemainingImages] = useState(DAILY_IMAGE_LIMIT);

  // ── Typing animation ──────────────────────────────────────────────────────
  const [typingMsgId, setTypingMsgId] = useState<string | null>(null);
  const [typingDisplayed, setTypingDisplayed] = useState('');
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Prefill input from navigation state (e.g. "Ask Heimdall AI about X") ──
  useEffect(() => {
    const prefill = (location.state as any)?.prefillMessage;
    if (prefill) {
      setInput(prefill);
      setTimeout(() => textareaRef.current?.focus(), 100);
      // Clear state so back-navigation doesn't re-trigger
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  const stopTyping = useCallback(() => {
    if (typingIntervalRef.current) { clearInterval(typingIntervalRef.current); typingIntervalRef.current = null; }
    setTypingMsgId(null);
    setTypingDisplayed('');
  }, []);

  const startTypingAnimation = useCallback((msgId: string, fullText: string) => {
    stopTyping();
    setTypingMsgId(msgId);
    setTypingDisplayed('');
    let charIdx = 0;
    // Reveal speed: aim for ~2.5s max; faster for short texts
    const TICK_MS = 16;
    const charsPerTick = Math.max(1, Math.ceil(fullText.length / (2500 / TICK_MS)));
    typingIntervalRef.current = setInterval(() => {
      charIdx += charsPerTick;
      if (charIdx >= fullText.length) {
        setTypingDisplayed(fullText);
        setTypingMsgId(null);
        if (typingIntervalRef.current) { clearInterval(typingIntervalRef.current); typingIntervalRef.current = null; }
      } else {
        setTypingDisplayed(fullText.slice(0, charIdx));
      }
    }, TICK_MS);
  }, [stopTyping]);

  // Stop typing when switching conversations
  useEffect(() => { stopTyping(); }, [currentId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => () => { if (typingIntervalRef.current) clearInterval(typingIntervalRef.current); }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentConv = conversations.find(c => c.id === currentId) || null;
  const messages = currentConv?.messages || [];

  // Unique avatar token — same djb2 + AVATAR_TOKENS as PlatformIndicator, seeded by email
  const avatarToken = useMemo(
    () => AVATAR_TOKENS[djb2(user?.email || '') % AVATAR_TOKENS.length],
    [user?.email]
  );

  // ── Service health check ───────────────────────────────────────────────────
  const [serviceStatus, setServiceStatus] = useState<'active' | 'down' | 'checking'>('checking');
  const [statusDotHovered, setStatusDotHovered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(`${API_BASE.replace('/api/v1', '')}/api/v1/platforms/`, {
          method: 'HEAD',
          headers: { Authorization: `Token ${localStorage.getItem('auth_token')}` },
          signal: AbortSignal.timeout(5000),
        });
        // 200/401/403/404 all mean the server is reachable — it's active
        if (!cancelled) setServiceStatus(res.status < 500 ? 'active' : 'down');
      } catch {
        if (!cancelled) setServiceStatus('down');
      }
    };
    check();
    const interval = setInterval(check, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load on mount (once userId is known) ──────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    try {
      const stored: Conversation[] = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      setConversations(stored);
      if (stored.length > 0) setCurrentId(stored[0].id);
    } catch {}
    setShowWelcome(!localStorage.getItem(WELCOMED_KEY));
    setRemainingImages(DAILY_IMAGE_LIMIT - getImageUsage());
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isLoading]);

  // ── Auto-resize textarea ───────────────────────────────────────────────────
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
  }, [input]);

  // ── Persistence ────────────────────────────────────────────────────────────
  const saveConversations = useCallback((convs: Conversation[]) => {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(convs.slice(0, 50))); } catch {}
  }, [HISTORY_KEY]);

  // ── Conversation management ────────────────────────────────────────────────
  const createNewConversation = useCallback((): Conversation => {
    const conv: Conversation = {
      id: uid(), title: 'New conversation', messages: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    setConversations(prev => { const updated = [conv, ...prev]; saveConversations(updated); return updated; });
    setCurrentId(conv.id);
    setInput('');
    return conv;
  }, [saveConversations]);

  const updateConversation = useCallback((id: string, updatedMessages: Message[], firstUserText?: string) => {
    setConversations(prev => {
      const updated = prev.map(c => {
        if (c.id !== id) return c;
        const title = firstUserText ? firstUserText.slice(0, 48) + (firstUserText.length > 48 ? '…' : '') : c.title;
        return { ...c, title, messages: updatedMessages, updatedAt: new Date().toISOString() };
      });
      saveConversations(updated);
      return updated;
    });
  }, [saveConversations]);

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => {
      const updated = prev.filter(c => c.id !== id);
      saveConversations(updated);
      if (currentId === id) setCurrentId(updated[0]?.id || null);
      return updated;
    });
  }, [currentId, saveConversations]);

  // ── Image handling ─────────────────────────────────────────────────────────
  const addImageToQueue = useCallback((file: File, currentQueue: PendingImage[]) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast({ title: 'Unsupported file type', description: 'Please use PNG, JPG, WEBP, or GIF.', variant: 'destructive' }); return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      toast({ title: 'File too large', description: `Max size is ${MAX_IMAGE_MB} MB per image.`, variant: 'destructive' }); return;
    }
    if (getImageUsage() + currentQueue.length >= DAILY_IMAGE_LIMIT) {
      toast({ title: 'Daily limit reached', description: `You can upload up to ${DAILY_IMAGE_LIMIT} images per day.`, variant: 'destructive' }); return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target?.result as string;
      setPendingImages(prev => [...prev, { data: dataUrl.split(',')[1], mimeType: file.type, preview: dataUrl }]);
    };
    reader.readAsDataURL(file);
  }, [getImageUsage, toast]);

  const handleFilesSelect = useCallback((files: File[]) => {
    // snapshot queue length before any async reads so limit checks are consistent
    setPendingImages(current => {
      files.forEach(f => addImageToQueue(f, current));
      return current; // actual updates happen via setPendingImages inside addImageToQueue
    });
  }, [addImageToQueue]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const imageItems = Array.from(e.clipboardData.items).filter(item => item.type.startsWith('image/'));
    if (imageItems.length === 0) return;
    // Don't preventDefault — let normal text paste still work
    setPendingImages(current => {
      const available = DAILY_IMAGE_LIMIT - getImageUsage() - current.length;
      if (available <= 0) {
        toast({ title: 'Daily limit reached', description: `Up to ${DAILY_IMAGE_LIMIT} images per day.`, variant: 'destructive' });
        return current;
      }
      imageItems.slice(0, available).forEach(item => {
        const file = item.getAsFile();
        if (file) addImageToQueue(file, current);
      });
      return current;
    });
  }, [getImageUsage, addImageToQueue, toast]);

  // ── AI conversation title generation ─────────────────────────────────────
  const generateTitle = useCallback(async (convId: string, userText: string, aiText: string) => {
    try {
      const prompt = `Generate a concise, professional 3–6 word title for this API security conversation. No quotes, no punctuation at the end, just the title.\n\nUser: "${userText.slice(0, 250)}"\nAssistant: "${aiText.slice(0, 250)}"`;
      const res = await fetch(`${API_BASE}/heimdall-ai/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Token ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      });
      if (!res.ok) return;
      const data = await res.json();
      const title = (data.response || '').trim().replace(/^["'`]+|["'`]+$/g, '').split('\n')[0].slice(0, 60);
      if (title.length > 2) {
        setConversations(prev => {
          const updated = prev.map(c => c.id === convId ? { ...c, title } : c);
          saveConversations(updated);
          return updated;
        });
      }
    } catch {}
  }, [saveConversations]);

  // ── Send ───────────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text && pendingImages.length === 0) return;
    if (isLoading) return;

    let convId = currentId;
    let currentMessages = messages;
    if (!convId) {
      const conv = createNewConversation();
      convId = conv.id;
      currentMessages = [];
    }

    let content: string | ContentBlock[];
    let imagePreviews: string[] | undefined;

    if (pendingImages.length > 0) {
      content = [
        ...pendingImages.map(img => ({
          type: 'image' as const,
          source: { type: 'base64' as const, media_type: img.mimeType, data: img.data },
        })),
        ...(text
          ? [{ type: 'text' as const, text }]
          : [{ type: 'text' as const, text: `Please analyse ${pendingImages.length > 1 ? 'these images' : 'this image'} from a security perspective.` }]
        ),
      ];
      imagePreviews = pendingImages.map(img => img.preview);
      incrementImageCount(pendingImages.length);
      setRemainingImages(DAILY_IMAGE_LIMIT - getImageUsage());
      setPendingImages([]);
    } else {
      content = text;
    }

    const userMsg: Message = { id: uid(), role: 'user', content, timestamp: new Date().toISOString(), imagePreviews };
    const isFirstMessage = currentMessages.length === 0;
    const newMessages = [...currentMessages, userMsg];
    // Use a placeholder title until AI renames it
    updateConversation(convId, newMessages, isFirstMessage ? '…' : undefined);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/heimdall-ai/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Token ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify({ messages: newMessages.slice(-20).map(m => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      const aiText: string = data.response || '';
      const aiMsgId = uid();
      updateConversation(convId, [...newMessages, { id: aiMsgId, role: 'assistant', content: aiText, timestamp: new Date().toISOString() }]);
      // Start typing animation for the AI response
      startTypingAnimation(aiMsgId, aiText);
      // Fire title generation after first exchange — non-blocking
      if (isFirstMessage) generateTitle(convId, text || 'image analysis request', aiText);
    } catch (err: any) {
      toast({ title: 'Failed to get response', description: err?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [input, pendingImages, currentId, messages, isLoading, createNewConversation, updateConversation, generateTitle, startTypingAnimation, incrementImageCount, getImageUsage, toast]);

  // ── Retry a specific user message ─────────────────────────────────────────
  const retryMessage = useCallback(async (msgIndex: number) => {
    if (isLoading || !currentId) return;
    const msg = messages[msgIndex];
    if (!msg || msg.role !== 'user') return;
    // Trim everything from this message onward, then resend it
    const priorMessages = messages.slice(0, msgIndex);
    const text = typeof msg.content === 'string' ? msg.content : getMessageText(msg.content);
    const newMessages = [...priorMessages, { ...msg, id: uid(), timestamp: new Date().toISOString() }];
    updateConversation(currentId, newMessages);
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/heimdall-ai/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Token ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify({ messages: newMessages.slice(-20).map(m => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      const aiText: string = data.response || '';
      const aiMsgId = uid();
      updateConversation(currentId, [...newMessages, { id: aiMsgId, role: 'assistant', content: aiText, timestamp: new Date().toISOString() }]);
      startTypingAnimation(aiMsgId, aiText);
    } catch (err: any) {
      toast({ title: 'Failed to get response', description: err?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [isLoading, currentId, messages, updateConversation, startTypingAnimation, toast]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-7.5rem)] rounded-[22px] overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1829] shadow-sm">

      {/* Welcome modal */}
      <AnimatePresence>
        {showWelcome && <WelcomeModal onDismiss={() => { localStorage.setItem(WELCOMED_KEY, 'true'); setShowWelcome(false); }} />}
      </AnimatePresence>

      {/* ── Conversation Sidebar ────────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
      {chatSidebarOpen && (
      <motion.div
        key="chat-sidebar"
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 288, opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 36, mass: 0.8 }}
        className="flex-shrink-0 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#080e1a] overflow-hidden">

        {/* Logo with version tooltip */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="relative group flex h-10 w-10 items-center justify-center flex-shrink-0 cursor-default">
            <HeimdallAILogo size={36} />
            <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 dark:bg-slate-700 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-lg z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              Heimdall AI v0.1.0
            </div>
          </div>
        </div>

        {/* New conversation */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={createNewConversation}
            className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-blue-100 dark:border-blue-500/20 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New conversation
          </button>
        </div>

        {/* History list */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4 gap-3">
              <div className="h-10 w-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">No conversations yet.<br />Start one above.</p>
            </div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => setCurrentId(conv.id)}
                className={`group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 cursor-pointer transition-all ${
                  currentId === conv.id
                    ? 'bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20'
                    : 'hover:bg-white dark:hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <MessageSquare className={`h-3.5 w-3.5 flex-shrink-0 ${currentId === conv.id ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-medium truncate leading-tight ${currentId === conv.id ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>
                    {conv.title}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                    {new Date(conv.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); deleteConversation(conv.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-300 hover:text-red-500 transition-all flex-shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* User info strip */}
        {user && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="flex-shrink-0 h-7 w-7 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${avatarToken.from}, ${avatarToken.to})`, boxShadow: `0 0 0 1.5px ${avatarToken.to}30` }}>
                {avatarToken.svg}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{user.username || user.email}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Personal assistant</p>
              </div>
              <div className="flex-shrink-0">
                <span className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                  <Shield className="h-3 w-3 text-emerald-500" />
                  Secure
                </span>
              </div>
            </div>
          </div>
        )}
      </motion.div>
      )}
      </AnimatePresence>

      {/* ── Main chat area ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0d1829]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle */}
            <button
              onClick={() => setChatSidebarOpen(v => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 transition-all duration-150 flex-shrink-0"
              title={chatSidebarOpen ? "Close conversation list" : "Open conversation list"}
            >
              {chatSidebarOpen
                ? <PanelLeftClose className="h-4 w-4" />
                : <PanelLeftOpen className="h-4 w-4" />
              }
            </button>
            <p className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Heimdall AI</p>
            {/* Live status dot with tooltip */}
            <div className="relative flex items-center" onMouseEnter={() => setStatusDotHovered(true)} onMouseLeave={() => setStatusDotHovered(false)}>
              <span className={`h-2 w-2 rounded-full cursor-default ${
                serviceStatus === 'active' ? 'bg-emerald-500 animate-pulse' :
                serviceStatus === 'down'   ? 'bg-red-500 animate-pulse' :
                'bg-slate-400 animate-pulse'
              }`} />
              {statusDotHovered && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 whitespace-nowrap rounded-lg bg-slate-900 dark:bg-slate-700 px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg z-50 pointer-events-none">
                  {serviceStatus === 'active' ? '● Active' : serviceStatus === 'down' ? '● Service unavailable' : '● Checking…'}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-full px-3 py-1.5 border border-slate-200 dark:border-slate-700">
              <ImageIcon className="h-3 w-3" />
              {remainingImages} images today
            </span>
          </div>
        </div>

        {/* ── Empty state: centered ChatGPT-style layout ───────────────── */}
        {messages.length === 0 && !isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 pb-4 overflow-y-auto">
            <div className="w-full max-w-2xl flex flex-col items-center gap-7">

              {/* Hero */}
              <div className="flex flex-col items-center gap-3 text-center">
                <HeimdallAILogo size={72} />
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Ask Heimdall AI anything</h3>
                <p className="text-sm text-slate-400 dark:text-slate-500 leading-relaxed">
                  Security expert. Platform guide. Threat analyst.
                </p>
              </div>

              {/* Pending images above input */}
              <AnimatePresence>
                {pendingImages.length > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="w-full">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {pendingImages.map((img, i) => (
                        <div key={i} className="relative flex-shrink-0 group">
                          <img src={img.preview} alt={`Image ${i + 1}`} className="h-20 w-auto rounded-2xl border border-slate-200 dark:border-slate-700 object-cover shadow-sm" />
                          <button onClick={() => setPendingImages(prev => prev.filter((_, j) => j !== i))} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-colors">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <div className="flex-shrink-0 ml-1 text-[11px] text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">
                        {pendingImages.length} image{pendingImages.length > 1 ? 's' : ''} queued
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Centered pill input */}
              <div className="w-full">
                <div className="flex items-end gap-3 rounded-[28px] border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-5 py-3.5 focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all shadow-md">
                  <button onClick={() => fileInputRef.current?.click()} title={`Upload image (${remainingImages} remaining)`} className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
                    <Paperclip style={{ width: 18, height: 18 }} />
                  </button>
                  <input ref={fileInputRef} type="file" accept={ACCEPTED_IMAGE_TYPES.join(',')} multiple className="hidden" onChange={e => { const files = Array.from(e.target.files || []); if (files.length) handleFilesSelect(files); e.target.value = ''; }} />
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    placeholder="Ask anything about your API security…"
                    rows={1}
                    className="flex-1 resize-none bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none leading-relaxed min-h-[36px] max-h-[140px] py-1.5"
                    style={{ height: 'auto' }}
                  />
                  <button onClick={sendMessage} disabled={isLoading || (!input.trim() && pendingImages.length === 0)} className="flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center bg-gradient-to-br from-[#2563eb] to-[#06b6d4] text-white shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-center text-[10px] text-slate-400 dark:text-slate-600 mt-2.5">
                  Enter to send · Shift+Enter for new line · Paste screenshot with Ctrl+V
                </p>
              </div>

              {/* Suggestion chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s.text}
                    onClick={() => { setInput(s.text); setTimeout(() => textareaRef.current?.focus(), 50); }}
                    className="group flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 px-4 py-4 text-left hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all shadow-sm hover:shadow-md"
                  >
                    <span className="flex-shrink-0 mt-0.5">{s.icon}</span>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-300 leading-relaxed transition-colors">{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

        ) : (
          /* ── Active chat: messages + bottom input ────────────────────── */
          <>
            {/* Message list */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-1 max-w-3xl mx-auto w-full">
                {messages.map((msg, idx) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    avatarToken={avatarToken}
                    displayText={typingMsgId === msg.id ? typingDisplayed : undefined}
                    isTyping={typingMsgId === msg.id}
                    onRetry={msg.role === 'user' ? () => retryMessage(idx) : undefined}
                  />
                ))}
              </div>
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* Pending images strip */}
            <AnimatePresence>
              {pendingImages.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="px-6 py-3 border-t border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-3xl mx-auto">
                    {pendingImages.map((img, i) => (
                      <div key={i} className="relative flex-shrink-0 group">
                        <img src={img.preview} alt={`Image ${i + 1}`} className="h-20 w-auto rounded-2xl border border-slate-200 dark:border-slate-700 object-cover shadow-sm" />
                        <button onClick={() => setPendingImages(prev => prev.filter((_, j) => j !== i))} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-colors">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <div className="flex-shrink-0 ml-1 text-[11px] text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">
                      {pendingImages.length} image{pendingImages.length > 1 ? 's' : ''} queued
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom pill input */}
            <div className="flex-shrink-0 px-6 pb-5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="max-w-3xl mx-auto">
                <div className="flex items-end gap-3 rounded-[28px] border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-5 py-3.5 focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all shadow-sm">
                  <button onClick={() => fileInputRef.current?.click()} title={`Upload image (${remainingImages} remaining)`} className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
                    <Paperclip style={{ width: 18, height: 18 }} />
                  </button>
                  <input ref={fileInputRef} type="file" accept={ACCEPTED_IMAGE_TYPES.join(',')} multiple className="hidden" onChange={e => { const files = Array.from(e.target.files || []); if (files.length) handleFilesSelect(files); e.target.value = ''; }} />
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    placeholder="Ask Heimdall AI… or paste a screenshot (Ctrl+V / ⌘+V)"
                    rows={1}
                    className="flex-1 resize-none bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none leading-relaxed min-h-[36px] max-h-[140px] py-1.5"
                    style={{ height: 'auto' }}
                  />
                  <button onClick={sendMessage} disabled={isLoading || (!input.trim() && pendingImages.length === 0)} className="flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center bg-gradient-to-br from-[#2563eb] to-[#06b6d4] text-white shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-center text-[10px] text-slate-400 dark:text-slate-600 mt-2.5">
                  Enter to send · Shift+Enter for new line · Paste screenshot with Ctrl+V · {remainingImages} image{remainingImages !== 1 ? 's' : ''} remaining today
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HeimdallAI;
