import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Plus, Paperclip, X, Trash2, MessageSquare,
  Sparkles, Image as ImageIcon, ChevronRight, Shield,
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
  imagePreview?: string;
}
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
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} className="rounded-md bg-slate-100 dark:bg-slate-700/80 px-1.5 py-0.5 text-xs font-mono text-blue-600 dark:text-blue-400">{part.slice(1, -1)}</code>;
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
};

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
    <div className="flex-shrink-0 h-9 w-9 rounded-2xl bg-gradient-to-br from-[#2563eb] to-[#06b6d4] flex items-center justify-center shadow-md mt-0.5">
      <HeimdallAILogo size={20} />
    </div>
    <div className="rounded-3xl rounded-tl-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 px-5 py-4 shadow-sm">
      <div className="flex items-center gap-1.5">
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
  </div>
);

// ── Message bubble ────────────────────────────────────────────────────────────
const MessageBubble: React.FC<{ message: Message; userInitial: string }> = ({ message, userInitial }) => {
  const isUser = message.role === 'user';
  const text = getMessageText(message.content);
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
        <div className="flex-shrink-0 h-9 w-9 rounded-2xl bg-gradient-to-br from-[#2563eb] to-[#06b6d4] flex items-center justify-center shadow-md mt-0.5">
          <HeimdallAILogo size={20} />
        </div>
      )}
      {isUser && (
        <div className="flex-shrink-0 h-9 w-9 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-700 dark:from-slate-600 dark:to-slate-800 flex items-center justify-center text-white text-sm font-bold shadow-md mt-0.5 select-none">
          {userInitial}
        </div>
      )}

      <div className={`flex flex-col gap-1.5 min-w-0 ${isUser ? 'items-end' : 'items-start'} max-w-[calc(100%-3.5rem)]`}>
        {/* Image preview */}
        {message.imagePreview && (
          <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
            <img src={message.imagePreview} alt="Uploaded" className="max-h-56 max-w-xs w-auto object-contain" />
          </div>
        )}

        {/* Bubble */}
        {text && (
          <div className={`px-5 py-3.5 shadow-sm ${
            isUser
              ? 'rounded-3xl rounded-tr-md bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white'
              : 'rounded-3xl rounded-tl-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-100'
          }`}>
            {isUser
              ? <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
              : <div className="space-y-0.5">{renderMarkdown(text)}</div>
            }
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-slate-400 dark:text-slate-500 px-1">{time}</span>
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
        <div className="relative mx-auto mb-5 flex h-18 w-18 items-center justify-center rounded-2xl bg-white/15 border border-white/25 shadow-lg" style={{ width: 72, height: 72 }}>
          <HeimdallAILogo size={40} />
        </div>
        <h2 className="relative text-2xl font-bold text-white tracking-tight">Meet Heimdall AI</h2>
        <p className="relative mt-1.5 text-sm text-blue-100 font-medium">Your intelligent security companion</p>
      </div>
      <div className="px-8 py-7 space-y-3">
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Your expert security assistant, built right into the platform.</p>
        {[
          { icon: '🛡️', text: 'WAF rules, OWASP threats, and attack patterns' },
          { icon: '📊', text: 'Analysing your threat logs and security events' },
          { icon: '🗺️', text: 'Navigating the Heimdall platform' },
          { icon: '🖼️', text: 'Reading screenshots of dashboards or logs' },
        ].map(({ icon, text }) => (
          <div key={text} className="flex items-center gap-3">
            <span className="text-xl flex-shrink-0">{icon}</span>
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

  const incrementImageCount = useCallback(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem(IMAGE_DATE_KEY, today);
      localStorage.setItem(IMAGE_COUNT_KEY, String(getImageUsage() + 1));
    } catch {}
  }, [IMAGE_DATE_KEY, IMAGE_COUNT_KEY, getImageUsage]);

  // ── State ──────────────────────────────────────────────────────────────────
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [pendingImage, setPendingImage] = useState<{ data: string; mimeType: string; preview: string } | null>(null);
  const [remainingImages, setRemainingImages] = useState(DAILY_IMAGE_LIMIT);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentConv = conversations.find(c => c.id === currentId) || null;
  const messages = currentConv?.messages || [];

  const userInitial = useMemo(() => {
    const name = user?.username || user?.email || 'U';
    return name.charAt(0).toUpperCase();
  }, [user]);

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
  const handleFileSelect = (file: File) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast({ title: 'Unsupported file type', description: 'Please upload PNG, JPG, WEBP, or GIF.', variant: 'destructive' }); return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      toast({ title: 'File too large', description: `Max file size is ${MAX_IMAGE_MB}MB.`, variant: 'destructive' }); return;
    }
    if (getImageUsage() >= DAILY_IMAGE_LIMIT) {
      toast({ title: 'Daily limit reached', description: 'You can upload 50 images per day.', variant: 'destructive' }); return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target?.result as string;
      setPendingImage({ data: dataUrl.split(',')[1], mimeType: file.type, preview: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  // ── Send ───────────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text && !pendingImage) return;
    if (isLoading) return;

    let convId = currentId;
    let currentMessages = messages;
    if (!convId) {
      const conv = createNewConversation();
      convId = conv.id;
      currentMessages = [];
    }

    let content: string | ContentBlock[];
    let imagePreview: string | undefined;

    if (pendingImage) {
      content = [
        { type: 'image', source: { type: 'base64', media_type: pendingImage.mimeType, data: pendingImage.data } },
        ...(text ? [{ type: 'text' as const, text }] : [{ type: 'text' as const, text: 'Please analyse this image from a security perspective.' }]),
      ];
      imagePreview = pendingImage.preview;
      incrementImageCount();
      setRemainingImages(DAILY_IMAGE_LIMIT - getImageUsage());
      setPendingImage(null);
    } else {
      content = text;
    }

    const userMsg: Message = { id: uid(), role: 'user', content, timestamp: new Date().toISOString(), imagePreview };
    const isFirstMessage = currentMessages.length === 0;
    const newMessages = [...currentMessages, userMsg];
    updateConversation(convId, newMessages, isFirstMessage ? text || 'Image analysis' : undefined);
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
      updateConversation(convId, [...newMessages, { id: uid(), role: 'assistant', content: data.response, timestamp: new Date().toISOString() }]);
    } catch (err: any) {
      toast({ title: 'Failed to get response', description: err?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [input, pendingImage, currentId, messages, isLoading, createNewConversation, updateConversation, incrementImageCount, getImageUsage, toast]);

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

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#080e1a]">

        {/* Logo + title */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563eb] to-[#06b6d4] shadow-md flex-shrink-0">
            <HeimdallAILogo size={22} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Heimdall AI</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Security Assistant</p>
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
              <div className="flex-shrink-0 h-7 w-7 rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 dark:from-slate-600 dark:to-slate-800 flex items-center justify-center text-white text-xs font-bold">
                {userInitial}
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
      </div>

      {/* ── Main chat area ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0d1829]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563eb] to-[#06b6d4] shadow-md">
              <HeimdallAILogo size={22} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Heimdall AI</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[11px] text-slate-400 dark:text-slate-500">Powered by Claude · Security Expert</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-full px-3 py-1.5 border border-slate-200 dark:border-slate-700">
              <ImageIcon className="h-3 w-3" />
              {remainingImages} images today
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Empty state */}
          {messages.length === 0 && !isLoading && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#2563eb]/10 to-[#06b6d4]/10 border border-blue-100 dark:border-blue-900/40 shadow-sm">
                <HeimdallAILogo size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Ask Heimdall AI anything</h3>
              <p className="text-sm text-slate-400 dark:text-slate-500 max-w-sm mb-10 leading-relaxed">
                Security expert. Platform guide. Threat analyst.<br />Just start typing below.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
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
          )}

          {/* Message list */}
          <div className="space-y-1">
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} userInitial={userInitial} />
            ))}
          </div>

          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Image pending preview */}
        <AnimatePresence>
          {pendingImage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-6 py-3 border-t border-slate-100 dark:border-slate-800/60"
            >
              <div className="relative inline-block">
                <img src={pendingImage.preview} alt="Preview" className="h-20 w-auto rounded-2xl border border-slate-200 dark:border-slate-700 object-cover shadow-sm" />
                <button
                  onClick={() => setPendingImage(null)}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input area */}
        <div className="flex-shrink-0 px-6 pb-5 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3.5 focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all shadow-sm">
              {/* Attach */}
              <button
                onClick={() => fileInputRef.current?.click()}
                title={`Upload image (${remainingImages} remaining)`}
                className="flex-shrink-0 h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
              >
                <Paperclip className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(',')}
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = ''; }}
              />

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Heimdall AI about your security posture…"
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none leading-relaxed min-h-[36px] max-h-[140px] py-1.5"
                style={{ height: 'auto' }}
              />

              {/* Send */}
              <button
                onClick={sendMessage}
                disabled={isLoading || (!input.trim() && !pendingImage)}
                className="flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#2563eb] to-[#06b6d4] text-white shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="text-center text-[10px] text-slate-400 dark:text-slate-600 mt-2.5">
              Enter to send · Shift+Enter for new line · {remainingImages} image uploads remaining today
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeimdallAI;
