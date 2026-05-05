import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users as UsersIcon,
  UserPlus,
  Key,
  Shield,
  Activity,
  Mail,
  X,
  Trash2,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiService, User, Invitation, InviteRequest, OrganisationInvitation } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { usePlatform } from "@/contexts/PlatformContext";
import {
  AlertDialog as AlertDialogComponent,
  AlertDialogAction as AlertDialogActionComponent,
  AlertDialogCancel as AlertDialogCancelComponent,
  AlertDialogContent as AlertDialogContentComponent,
  AlertDialogDescription as AlertDialogDescriptionComponent,
  AlertDialogFooter as AlertDialogFooterComponent,
  AlertDialogHeader as AlertDialogHeaderComponent,
  AlertDialogTitle as AlertDialogTitleComponent,
} from "@/components/ui/alert-dialog";

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic avatar system
// ─────────────────────────────────────────────────────────────────────────────
const djb2 = (s: string) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return Math.abs(h >>> 0);
};

const AVATAR_TOKENS = [
  { from: "#1e3a8a", to: "#06b6d4", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><circle cx="10" cy="10" r="2.5" fill="white" fillOpacity="0.95"/><circle cx="3" cy="3" r="1.5" fill="white" fillOpacity="0.6"/><circle cx="17" cy="3" r="1.5" fill="white" fillOpacity="0.6"/><circle cx="3" cy="17" r="1.5" fill="white" fillOpacity="0.6"/><circle cx="17" cy="17" r="1.5" fill="white" fillOpacity="0.6"/><line x1="3" y1="3" x2="10" y2="10" stroke="white" strokeOpacity="0.55" strokeWidth="1.2"/><line x1="17" y1="3" x2="10" y2="10" stroke="white" strokeOpacity="0.55" strokeWidth="1.2"/><line x1="3" y1="17" x2="10" y2="10" stroke="white" strokeOpacity="0.55" strokeWidth="1.2"/><line x1="17" y1="17" x2="10" y2="10" stroke="white" strokeOpacity="0.55" strokeWidth="1.2"/></svg>) },
  { from: "#312e81", to: "#6366f1", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><path d="M3 14 Q6 8 13 5" stroke="white" strokeOpacity="0.9" strokeWidth="1.6" strokeLinecap="round"/><path d="M5 16 Q9 11 15 8" stroke="white" strokeOpacity="0.55" strokeWidth="1.2" strokeLinecap="round"/><circle cx="13.5" cy="4.5" r="2.5" fill="white" fillOpacity="0.9"/><circle cx="13.5" cy="4.5" r="1" fill="white"/></svg>) },
  { from: "#be123c", to: "#f97316", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><path d="M10 3 C6.5 3 4 5.8 4 9 C4 11.5 5 13.5 6.5 15" stroke="white" strokeOpacity="0.95" strokeWidth="1.4" strokeLinecap="round"/><path d="M10 5.5 C7.5 5.5 6 7.2 6 9 C6 10.5 6.8 11.8 8 13" stroke="white" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round"/><path d="M10 8 C9 8 8.5 8.6 8.5 9.2 C8.5 9.8 9 10.8 9.5 11.5" stroke="white" strokeOpacity="0.9" strokeWidth="1.2" strokeLinecap="round"/></svg>) },
  { from: "#065f46", to: "#14b8a6", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><circle cx="4" cy="5" r="1.8" fill="white" fillOpacity="0.9"/><circle cx="4" cy="10" r="1.8" fill="white" fillOpacity="0.9"/><circle cx="4" cy="15" r="1.8" fill="white" fillOpacity="0.9"/><circle cx="10" cy="7.5" r="1.8" fill="white" fillOpacity="0.75"/><circle cx="10" cy="12.5" r="1.8" fill="white" fillOpacity="0.75"/><circle cx="16" cy="10" r="1.8" fill="white" fillOpacity="0.9"/><line x1="5.8" y1="5.2" x2="8.2" y2="7.3" stroke="white" strokeOpacity="0.5" strokeWidth="1"/><line x1="11.8" y1="7.5" x2="14.2" y2="9.8" stroke="white" strokeOpacity="0.5" strokeWidth="1"/></svg>) },
  { from: "#1e1b4b", to: "#7c3aed", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><path d="M10 2 L16 5 L16 10 C16 13.5 13 16.5 10 18 C7 16.5 4 13.5 4 10 L4 5 Z" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.9" strokeWidth="1.3"/><rect x="7.5" y="9" width="5" height="4" rx="1" fill="white" fillOpacity="0.9"/><path d="M8.5 9 L8.5 7.5 C8.5 6.4 11.5 6.4 11.5 7.5 L11.5 9" stroke="white" strokeOpacity="0.9" strokeWidth="1.2" strokeLinecap="round" fill="none"/></svg>) },
  { from: "#92400e", to: "#fbbf24", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><ellipse cx="10" cy="5.5" rx="6" ry="2" fill="white" fillOpacity="0.9"/><path d="M4 5.5 L4 10 C4 11.1 6.7 12 10 12 C13.3 12 16 11.1 16 10 L16 5.5" stroke="white" strokeOpacity="0.6" strokeWidth="1.2" fill="none"/><path d="M4 10 L4 14.5 C4 15.6 6.7 16.5 10 16.5 C13.3 16.5 16 15.6 16 14.5 L16 10" stroke="white" strokeOpacity="0.4" strokeWidth="1.2" fill="none"/></svg>) },
  { from: "#0f172a", to: "#22c55e", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><rect x="2.5" y="4" width="15" height="12" rx="2.5" fill="white" fillOpacity="0.1" stroke="white" strokeOpacity="0.8" strokeWidth="1.2"/><path d="M5.5 8 L8 10 L5.5 12" stroke="white" strokeOpacity="0.9" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><line x1="9.5" y1="12" x2="14" y2="12" stroke="white" strokeOpacity="0.7" strokeWidth="1.3" strokeLinecap="round"/></svg>) },
  { from: "#0c4a6e", to: "#38bdf8", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><polyline points="2,10 4,10 5,6 6,14 7.5,8 9,13 10.5,7 12,13 13.5,9 15,11 16,10 18,10" stroke="white" strokeOpacity="0.95" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>) },
  { from: "#4338ca", to: "#ec4899", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><polygon points="10,2 13.5,4 13.5,8 10,10 6.5,8 6.5,4" fill="white" fillOpacity="0.2" stroke="white" strokeOpacity="0.9" strokeWidth="1.2"/><circle cx="10" cy="6" r="1.5" fill="white" fillOpacity="0.9"/></svg>) },
  { from: "#075985", to: "#7dd3fc", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><path d="M5.5 14 C3.5 14 2 12.5 2 10.5 C2 8.8 3.2 7.4 4.9 7.1 C4.5 3.6 6.1 2 8 2 C9.4 2 10.6 2.8 11.2 4 C14.1 3.8 15.6 5.3 15.6 7.2 C16.9 7.9 18 9 18 10.5 C18 12.5 16.4 14 14.5 14" stroke="white" strokeOpacity="0.9" strokeWidth="1.3" strokeLinecap="round" fill="none"/><path d="M10 17 L10 10" stroke="white" strokeOpacity="0.9" strokeWidth="1.4" strokeLinecap="round"/><path d="M7.5 12 L10 9.5 L12.5 12" stroke="white" strokeOpacity="0.9" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>) },
  { from: "#5b21b6", to: "#d946ef", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><path d="M7 2 C7 5 13 6 13 10 C13 14 7 15 7 18" stroke="white" strokeOpacity="0.9" strokeWidth="1.5" strokeLinecap="round" fill="none"/><path d="M13 2 C13 5 7 6 7 10 C7 14 13 15 13 18" stroke="white" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" fill="none"/><line x1="7.5" y1="10" x2="12.5" y2="10" stroke="white" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round"/></svg>) },
  { from: "#064e3b", to: "#10b981", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><text x="2" y="8" fontSize="5" fill="white" fillOpacity="0.95" fontFamily="monospace" fontWeight="bold">10</text><text x="10" y="8" fontSize="5" fill="white" fillOpacity="0.5" fontFamily="monospace" fontWeight="bold">01</text><text x="2" y="13" fontSize="5" fill="white" fillOpacity="0.5" fontFamily="monospace" fontWeight="bold">01</text><text x="10" y="13" fontSize="5" fill="white" fillOpacity="0.95" fontFamily="monospace" fontWeight="bold">10</text></svg>) },
  { from: "#1e293b", to: "#f97316", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><circle cx="10" cy="10" r="3" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.9" strokeWidth="1.3"/><circle cx="10" cy="10" r="1.2" fill="white" fillOpacity="0.9"/><path d="M10 2.5 L10 4.5 M10 15.5 L10 17.5 M2.5 10 L4.5 10 M15.5 10 L17.5 10" stroke="white" strokeOpacity="0.7" strokeWidth="1.4" strokeLinecap="round"/></svg>) },
  { from: "#1d4ed8", to: "#f472b6", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><rect x="2" y="14" width="3" height="4" rx="1" fill="white" fillOpacity="0.5"/><rect x="6.5" y="11" width="3" height="7" rx="1" fill="white" fillOpacity="0.7"/><rect x="11" y="7.5" width="3" height="10.5" rx="1" fill="white" fillOpacity="0.85"/><rect x="15.5" y="4" width="3" height="14" rx="1" fill="white" fillOpacity="0.95"/></svg>) },
  { from: "#0f766e", to: "#a7f3d0", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><ellipse cx="10" cy="10" rx="8" ry="3.2" stroke="white" strokeOpacity="0.9" strokeWidth="1.2" fill="none"/><ellipse cx="10" cy="10" rx="8" ry="3.2" stroke="white" strokeOpacity="0.6" strokeWidth="1.2" fill="none" transform="rotate(60 10 10)"/><ellipse cx="10" cy="10" rx="8" ry="3.2" stroke="white" strokeOpacity="0.4" strokeWidth="1.2" fill="none" transform="rotate(120 10 10)"/><circle cx="10" cy="10" r="1.8" fill="white" fillOpacity="0.95"/></svg>) },
  { from: "#1a2e05", to: "#84cc16", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><circle cx="10" cy="10" r="7.5" stroke="white" strokeOpacity="0.3" strokeWidth="1" fill="none"/><circle cx="10" cy="10" r="5" stroke="white" strokeOpacity="0.4" strokeWidth="1" fill="none"/><circle cx="10" cy="10" r="2.5" stroke="white" strokeOpacity="0.55" strokeWidth="1" fill="none"/><line x1="10" y1="10" x2="10" y2="2.5" stroke="white" strokeOpacity="0.9" strokeWidth="1.3" strokeLinecap="round"/><circle cx="14.5" cy="5.5" r="1.2" fill="white" fillOpacity="0.9"/></svg>) },
  { from: "#713f12", to: "#facc15", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><path d="M11.5 2 L5.5 11.5 L9.5 11.5 L8.5 18 L14.5 8.5 L10.5 8.5 Z" fill="white" fillOpacity="0.95"/></svg>) },
  { from: "#0f2744", to: "#22d3ee", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><circle cx="10" cy="10" r="7.5" stroke="white" strokeOpacity="0.9" strokeWidth="1.2" fill="none"/><ellipse cx="10" cy="10" rx="4" ry="7.5" stroke="white" strokeOpacity="0.55" strokeWidth="1" fill="none"/><line x1="2.5" y1="10" x2="17.5" y2="10" stroke="white" strokeOpacity="0.55" strokeWidth="1"/></svg>) },
  { from: "#18181b", to: "#818cf8", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><rect x="2" y="2" width="5" height="5" rx="1" fill="white" fillOpacity="0.9"/><rect x="13" y="2" width="5" height="5" rx="1" fill="white" fillOpacity="0.9"/><rect x="2" y="13" width="5" height="5" rx="1" fill="white" fillOpacity="0.9"/><rect x="9" y="9" width="2" height="2" rx="0.5" fill="white" fillOpacity="0.9"/></svg>) },
  { from: "#7f1d1d", to: "#fb923c", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><path d="M10 2 C10 2 14 5 14 10 L12.5 13 L7.5 13 L6 10 C6 5 10 2 10 2 Z" fill="white" fillOpacity="0.9"/><circle cx="10" cy="8.5" r="1.8" fill="white" fillOpacity="0.2" stroke="white" strokeOpacity="0.6" strokeWidth="1"/></svg>) },
  { from: "#1d4ed8", to: "#a855f7", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><path d="M3.5 10 C3.5 7.5 5.2 5.5 7.5 5.5 C9 5.5 10 6.5 10 6.5 C10 6.5 11 5.5 12.5 5.5 C14.8 5.5 16.5 7.5 16.5 10 C16.5 12.5 14.8 14.5 12.5 14.5 C11 14.5 10 13.5 10 13.5 C10 13.5 9 14.5 7.5 14.5 C5.2 14.5 3.5 12.5 3.5 10 Z" stroke="white" strokeOpacity="0.95" strokeWidth="1.5" fill="none"/></svg>) },
  { from: "#134e4a", to: "#86efac", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><rect x="2.5" y="3" width="15" height="4" rx="1.5" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.9" strokeWidth="1.2"/><rect x="2.5" y="8" width="15" height="4" rx="1.5" fill="white" fillOpacity="0.1" stroke="white" strokeOpacity="0.65" strokeWidth="1.2"/><rect x="2.5" y="13" width="15" height="4" rx="1.5" fill="white" fillOpacity="0.05" stroke="white" strokeOpacity="0.4" strokeWidth="1.2"/></svg>) },
  { from: "#0f172a", to: "#60a5fa", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><path d="M7 7 L7 5 C7 3.9 7.9 3 9 3 C10.1 3 11 3.9 11 5 L11 7 L13 7 L13 5 C13 3.9 13.9 3 15 3 C16.1 3 17 3.9 17 5 C17 6.1 16.1 7 15 7 L13 7 L13 9 L15 9 C16.1 9 17 9.9 17 11 C17 12.1 16.1 13 15 13 L13 13 L13 15 C13 16.1 12.1 17 11 17 C9.9 17 9 16.1 9 15 L9 13 L7 13 L7 15 C7 16.1 6.1 17 5 17 C3.9 17 3 16.1 3 15 C3 13.9 3.9 13 5 13 L7 13 L7 11 L5 11 C3.9 11 3 10.1 3 9 C3 7.9 3.9 7 5 7 L7 7 Z M9 7 L9 9 L11 9 L11 7 Z M9 11 L9 13 L11 13 L11 11 Z" fill="white" fillOpacity="0.9"/></svg>) },
  { from: "#831843", to: "#fb7185", svg: (<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><circle cx="10" cy="10" r="7.5" stroke="white" strokeOpacity="0.25" strokeWidth="1" fill="none"/><circle cx="10" cy="10" r="5" stroke="white" strokeOpacity="0.4" strokeWidth="1.2" fill="none"/><circle cx="10" cy="10" r="2.5" fill="white" fillOpacity="0.9"/></svg>) },
];

// ─────────────────────────────────────────────────────────────────────────────
// Avatar with real status (from backend)
// ─────────────────────────────────────────────────────────────────────────────
const MemberAvatarWithStatus = ({
  email,
  isActive = false,
  size = 40,
}: {
  email: string;
  isActive?: boolean;
  size?: number;
}) => {
  const key = (email || "user@heimdall").toLowerCase().trim();
  const hash = djb2(key);
  const token = AVATAR_TOKENS[hash % AVATAR_TOKENS.length];
  const [hovered, setHovered] = useState(false);
  const dotColor = isActive ? "#22c55e" : "#eab308";
  const dotTitle = isActive ? "Active" : "Away";

  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: size, height: size }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Gradient avatar circle */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${token.from}, ${token.to})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 0 1.5px ${token.to}40, 0 1px 4px ${token.from}55`,
          position: "relative",
        }}
      >
        {token.svg}
        {/* Status dot */}
        <span
          style={{
            position: "absolute",
            bottom: -1,
            right: -1,
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: dotColor,
            border: "1.5px solid white",
            transition: "background 0.4s ease",
            boxShadow: isActive ? "0 0 4px #22c55e88" : "0 0 4px #eab30888",
          }}
        />
      </div>

      {/* Hover status dropdown */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            style={{
              position: "absolute",
              top: size + 6,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 50,
              whiteSpace: "nowrap",
            }}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl px-3 py-2 min-w-[110px]"
          >
            {/* Arrow */}
            <div
              style={{
                position: "absolute",
                top: -5,
                left: "50%",
                transform: "translateX(-50%) rotate(45deg)",
                width: 8,
                height: 8,
                background: "white",
                borderTop: "1px solid",
                borderLeft: "1px solid",
                borderColor: "rgba(148,163,184,0.3)",
              }}
              className="dark:bg-slate-900"
            />
            <div className="flex items-center gap-2">
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: dotColor,
                  flexShrink: 0,
                  boxShadow: isActive ? "0 0 4px #22c55e88" : "0 0 4px #eab30888",
                }}
              />
              <span
                className={`text-xs font-semibold ${
                  isActive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-500 dark:text-amber-400"
                }`}
              >
                {dotTitle}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Counting animation (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1000, start = true) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start || target === 0) { setValue(target); return; }
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return value;
}

const AnimatedNumber = ({ value }: { value: number }) => {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  const count = useCountUp(value, 1000, inView);
  return <span ref={ref}>{count}</span>;
};

const HoverCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <motion.div
    whileHover={{ y: -3, scale: 1.01 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    className={className}
  >
    {children}
  </motion.div>
);

interface NormalizedMember {
  id: string | number;
  role: 'admin' | 'analyst' | 'viewer';
  joined_at: string;
  user_status?: string;          // ← real status from backend
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    username: string;
  };
}

/* ════════════════════════════════════════════════════════════════════════ */
const Users = () => {
  const [activeTab, setActiveTab] = useState("members");
  const [members, setMembers] = useState<NormalizedMember[]>([]);
  const [sentInvitations, setSentInvitations] = useState<OrganisationInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSentInvites, setLoadingSentInvites] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [cancelInviteId, setCancelInviteId] = useState<string | null>(null);
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null);

  const [inviteRole, setInviteRole] = useState<"org_admin" | "org_member">("org_member");
  const [inviteWorkspaceIds, setInviteWorkspaceIds] = useState<string[]>([]);
  const [availableWorkspaces, setAvailableWorkspaces] = useState<any[]>([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);

  const { toast } = useToast();
  const { selectedPlatformId } = usePlatform();

  const loadData = async () => {
    if (!selectedPlatformId) {
      setLoading(false);
      setMembers([]);
      return;
    }
    setLoading(true);
    try {
      const membersData = await apiService.getPlatformMembers(selectedPlatformId);
      const normalizedMembers = Array.isArray(membersData)
        ? membersData.map((member: any) => {
            const nameParts = (member.user_name || '').split(' ');
            return {
              id: member.id,
              role: (member.is_owner ? 'admin' : member.role || 'viewer') as 'admin' | 'analyst' | 'viewer',
              joined_at: member.created_at || member.updated_at || new Date().toISOString(),
              user_status: member.user_status,   // ← include real status
              user: {
                id: typeof member.user === 'number' ? member.user : 0,
                email: member.user_email || '',
                first_name: nameParts[0] || '',
                last_name: nameParts.slice(1).join(' ') || '',
                username: member.user_email?.split('@')[0] || '',
              }
            };
          })
        : [];
      setMembers(normalizedMembers);
    } catch (error: any) {
      let errorMessage = error.message || "Failed to fetch members";
      if (error.body?.error === "You do not have access to this platform") {
        errorMessage = "You don't have access to this workspace. Please select a valid workspace or create one.";
      }
      toast({ title: "Error loading data", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadSentInvitations = async () => {
    setLoadingSentInvites(true);
    try {
      const data = await apiService.getMyInvitations('sent');
      setSentInvitations(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast({ title: "Error loading invitations", description: error.message || "Failed to load sent invitations", variant: "destructive" });
    } finally {
      setLoadingSentInvites(false);
    }
  };

  useEffect(() => {
    loadData();
    loadSentInvitations();
  }, [selectedPlatformId]);

  const handleSendInvitation = async () => {
    if (!selectedPlatformId) {
      toast({ title: "Error", description: "Please select a platform first", variant: "destructive" });
      return;
    }
    if (!inviteEmail || !inviteEmail.includes('@')) {
      toast({ title: "Invalid email", description: "Please enter a valid email address", variant: "destructive" });
      return;
    }
    setInviteLoading(true);
    try {
      const payload: any = {
        email: inviteEmail,
        role: inviteRole,
      };
      if (inviteRole === "org_member" && inviteWorkspaceIds.length > 0) {
        payload.workspace_ids = inviteWorkspaceIds;
      }
      await apiService.createOrganisationInvitation(payload);
      toast({ title: "Invitation sent", description: `Invitation sent to ${inviteEmail}` });
      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteMessage("");
      setInviteRole("org_member");
      setInviteWorkspaceIds([]);
      await loadSentInvitations();
    } catch (error: any) {
      toast({ title: "Error sending invitation", description: error.message || "Failed to send invitation", variant: "destructive" });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCancelInvitation = async () => {
    if (!cancelInviteId) return;
    try {
      await apiService.cancelInvitation(cancelInviteId);
      toast({ title: "Invitation cancelled", description: "The invitation has been cancelled" });
      setCancelInviteId(null);
      await loadSentInvitations();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to cancel invitation", variant: "destructive" });
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedPlatformId || !removeMemberId) return;
    try {
      await apiService.removeMember(selectedPlatformId, removeMemberId);
      toast({ title: "Member removed", description: "The member has been removed from the platform" });
      setRemoveMemberId(null);
      await loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to remove member", variant: "destructive" });
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin:   "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
      analyst: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      viewer:  "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    };
    return colors[role] || "bg-slate-100 text-slate-700";
  };

  const getInviteStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending:  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      accepted: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      expired:  "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  const statCards = [
    { label: "Team Members",  value: members.length,                                     icon: UsersIcon,  via: "via-blue-500/30",    iconBg: "bg-blue-50 dark:bg-blue-500/10",    iconColor: "text-blue-500",    border: "border-blue-200/50 dark:border-blue-800/30",    sub: `${sentInvitations.filter(i => i.status === 'pending').length} pending invitations` },
    { label: "Active Users",  value: members.length,                                     icon: CheckCircle,via: "via-green-500/30",   iconBg: "bg-green-50 dark:bg-green-500/10",  iconColor: "text-green-500",   border: "border-green-200/50 dark:border-green-800/30",   sub: "All members active"     },
    { label: "Admin Users",   value: members.filter(m => m.role === 'admin').length,      icon: Shield,     via: "via-red-500/30",     iconBg: "bg-red-50 dark:bg-red-500/10",      iconColor: "text-red-500",     border: "border-red-200/50 dark:border-red-800/30",       sub: "Full access granted"    },
    { label: "API Tokens",    value: 0,                                                   icon: Key,        via: "via-violet-500/30",  iconBg: "bg-violet-50 dark:bg-violet-500/10",iconColor: "text-violet-500",  border: "border-violet-200/50 dark:border-violet-800/30", sub: "Coming soon"            },
  ];

  const tabs = [
    { id: "members",     label: "Members",     icon: UsersIcon,   count: members.length },
    { id: "invitations", label: "Invitations", icon: Mail,        count: sentInvitations.filter(i => i.status === 'pending').length },
    { id: "tokens",      label: "API Tokens",  icon: Key,         count: null },
  ];

  if (!selectedPlatformId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-500/10">
              <UsersIcon className="h-8 w-8 text-blue-400" />
            </div>
            <p className="font-semibold text-slate-700 dark:text-slate-300">No workspace selected</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              You don't have any workspaces yet. Create your first workspace to start using Heimdall.
            </p>
            <Button className="mt-4" onClick={() => window.location.href = '/platforms'}>
              Create Workspace
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full min-w-0 max-w-full">

      {/* Hero Banner (unchanged) */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 sm:px-8 pt-7 pb-6 shadow-lg min-h-[140px]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />
          <div className="relative z-10 flex flex-col justify-between h-full gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/10 text-xs font-medium rounded-full">Team Management</Badge>
              <Badge className="border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/10 text-xs font-medium rounded-full">Access Control</Badge>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">Users & Teams</h1>
                <p className="mt-1 text-sm text-blue-100 max-w-xl">Manage team members, roles, and API access tokens for your platform.</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white rounded-full px-4 text-sm">
                  <Key className="h-4 w-4 mr-2" />Generate Token
                </Button>
                <Dialog open={inviteDialogOpen} onOpenChange={async (open) => {
                  setInviteDialogOpen(open);
                  if (open) {
                    setLoadingWorkspaces(true);
                    try {
                      const workspaces = await apiService.getWorkspaces();
                      setAvailableWorkspaces(workspaces);
                    } catch (error) {
                      toast({ title: "Error", description: "Failed to load workspaces", variant: "destructive" });
                    } finally {
                      setLoadingWorkspaces(false);
                    }
                  } else {
                    setInviteEmail(""); setInviteMessage(""); setInviteRole("org_member"); setInviteWorkspaceIds([]);
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm" disabled={!selectedPlatformId} className="bg-white text-blue-700 hover:bg-white/90 shadow-md rounded-full px-4 text-sm font-semibold">
                      <UserPlus className="h-4 w-4 mr-2" />Invite User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900 shadow-2xl">
                    <DialogHeader className="border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
                      <DialogTitle className="text-slate-900 dark:text-white">Invite Team Member</DialogTitle>
                      <DialogDescription className="text-slate-500 dark:text-slate-400">Send an invitation to join your security team</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Email Address</Label>
                        <Input type="email" placeholder="user@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="rounded-xl border-slate-200/70 bg-slate-50/80 dark:border-slate-700/70 dark:bg-slate-800/50" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Role</Label>
                        <Select value={inviteRole} onValueChange={(val) => setInviteRole(val as "org_admin" | "org_member")}>
                          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select role" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="org_admin">Organisation Admin – full access to all workspaces</SelectItem>
                            <SelectItem value="org_member">Organisation Member – access only to selected workspaces</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {inviteRole === "org_member" && (
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Workspace Access</Label>
                          {loadingWorkspaces ? (
                            <div className="text-sm text-muted-foreground">Loading workspaces...</div>
                          ) : availableWorkspaces.length === 0 ? (
                            <div className="text-sm text-muted-foreground">No workspaces available. Create one first.</div>
                          ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                              {availableWorkspaces.map((ws) => (
                                <div key={ws.id} className="flex items-center space-x-2">
                                  <Checkbox id={ws.id} checked={inviteWorkspaceIds.includes(ws.id)} onCheckedChange={(checked) => {
                                    if (checked) setInviteWorkspaceIds([...inviteWorkspaceIds, ws.id]);
                                    else setInviteWorkspaceIds(inviteWorkspaceIds.filter(id => id !== ws.id));
                                  }} />
                                  <label htmlFor={ws.id} className="text-sm font-medium leading-none">{ws.name}</label>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Message (Optional)</Label>
                        <Textarea placeholder="Optional invitation message (max 500 characters)" value={inviteMessage} onChange={(e) => { if (e.target.value.length <= 500) setInviteMessage(e.target.value); }} rows={3} className="rounded-xl border-slate-200/70 bg-slate-50/80 dark:border-slate-700/70 dark:bg-slate-800/50 resize-none" />
                        <p className="text-xs text-slate-400 dark:text-slate-500">{inviteMessage.length}/500 characters</p>
                      </div>
                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                        <Button variant="outline" className="rounded-xl border-slate-200/70 dark:border-slate-700"
                          onClick={() => { setInviteDialogOpen(false); setInviteEmail(""); setInviteMessage(""); setInviteRole("org_member"); setInviteWorkspaceIds([]); }}>
                          Cancel
                        </Button>
                        <Button disabled={inviteLoading || !inviteEmail} onClick={handleSendInvitation} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20">
                          {inviteLoading ? "Sending..." : "Send Invitation"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stat cards (unchanged) */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }} className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        {statCards.map(({ label, value, icon: Icon, via, iconBg, iconColor, border, sub }) => (
          <HoverCard key={label}>
            <Card className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/50 shadow-sm ${border}`}>
              <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${via} to-transparent`} />
              <CardHeader className="pb-2">
                <div className={`rounded-xl p-3 w-fit ${iconBg}`}><Icon className={`h-5 w-5 ${iconColor}`} /></div>
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-white"><AnimatedNumber value={value} /></div>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{sub}</p>
              </CardContent>
            </Card>
          </HoverCard>
        ))}
      </motion.div>

      {/* Tabs (unchanged) */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <div className="flex gap-1 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-slate-100/60 dark:bg-slate-800/30 p-1 w-fit">
          {tabs.map(({ id, label, icon: Icon, count }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === id ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}`}>
              <Icon className="h-4 w-4" />
              {label}
              {count !== null && (
                <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold ${activeTab === id ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"}`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Members Tab */}
      {activeTab === "members" && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/50 shadow-md">
            <CardHeader className="border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-transparent dark:border-slate-800/50 dark:from-slate-800/30">
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 p-2"><UsersIcon className="h-4 w-4 text-blue-500" /></div>
                Platform Members
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/20 px-2 text-xs font-bold text-blue-700 dark:text-blue-300">
                  <AnimatedNumber value={members.length} />
                </span>
              </CardTitle>
              <CardDescription>Manage members and their roles for the selected platform</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="relative mb-4 h-14 w-14">
                    <div className="absolute inset-0 rounded-full bg-blue-100 dark:bg-blue-500/20 animate-pulse" />
                    <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin" />
                  </div>
                  <p className="font-medium text-slate-700 dark:text-slate-300">Loading members...</p>
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                    <UsersIcon className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="font-semibold text-slate-700 dark:text-slate-300">No members found</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Invite team members to get started</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200/40 dark:divide-slate-800/40">
                  {members.map((member, idx) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.04 * idx }}
                      className="flex items-center justify-between px-5 py-4 hover:bg-blue-50/30 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar with real status */}
                        <MemberAvatarWithStatus
                          email={member.user.email}
                          isActive={member.user_status === 'active'}
                          size={40}
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-white">
                            {member.user.first_name} {member.user.last_name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{member.user.email || 'No email'}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            Joined {new Date(member.joined_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge className={getRoleColor(member.role)}>{member.role}</Badge>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setRemoveMemberId(String(member.id))}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200/50 dark:border-red-800/30 bg-red-50/60 dark:bg-red-900/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Invitations Tab (unchanged) */}
      {activeTab === "invitations" && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/50 shadow-md">
            <CardHeader className="border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-transparent dark:border-slate-800/50 dark:from-slate-800/30">
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                <div className="rounded-xl bg-cyan-50 dark:bg-cyan-500/10 p-2"><Mail className="h-4 w-4 text-cyan-500" /></div>
                Sent Invitations
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/20 px-2 text-xs font-bold text-blue-700 dark:text-blue-300">
                  <AnimatedNumber value={sentInvitations.filter(i => i.status === 'pending').length} />
                </span>
              </CardTitle>
              <CardDescription>Invitations you have sent to others</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loadingSentInvites ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="relative mb-4 h-14 w-14">
                    <div className="absolute inset-0 rounded-full bg-blue-100 dark:bg-blue-500/20 animate-pulse" />
                    <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin" />
                  </div>
                  <p className="font-medium text-slate-700 dark:text-slate-300">Loading invitations...</p>
                </div>
              ) : sentInvitations.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                    <Mail className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="font-semibold text-slate-700 dark:text-slate-300">No invitations sent</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Invite team members to get started</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200/40 dark:divide-slate-800/40">
                  {sentInvitations.map((invitation, idx) => (
                    <motion.div key={invitation.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * idx }}
                      className="flex items-center justify-between px-5 py-4 hover:bg-blue-50/30 dark:hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200/50 dark:border-cyan-800/30">
                          <Mail className="h-4 w-4 text-cyan-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-white">To: {invitation.email || 'Unknown'}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Role: <span className="capitalize">{invitation.role === 'org_admin' ? 'Admin' : 'Member'}</span></p>
                          {invitation.organisation_name && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">Organisation: {invitation.organisation_name}</p>
                          )}
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            Sent: {new Date(invitation.created_at).toLocaleDateString()} · Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge className={getInviteStatusColor(invitation.status)}>{invitation.status}</Badge>
                        {invitation.status === 'pending' && (
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setCancelInviteId(invitation.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200/50 dark:border-red-800/30 bg-red-50/60 dark:bg-red-900/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors">
                            <X className="h-3.5 w-3.5" />
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* API Tokens Tab (unchanged) */}
      {activeTab === "tokens" && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/50 shadow-md">
            <CardHeader className="border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-transparent dark:border-slate-800/50 dark:from-slate-800/30">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                    <div className="rounded-xl bg-violet-50 dark:bg-violet-500/10 p-2"><Key className="h-4 w-4 text-violet-500" /></div>
                    API Tokens
                  </CardTitle>
                  <CardDescription>Manage API access tokens for automated integrations</CardDescription>
                </div>
                <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 text-sm">
                  <Key className="h-4 w-4 mr-2" />Generate Token
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-center py-16 px-6">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-50 dark:bg-violet-500/10">
                  <Key className="h-8 w-8 text-violet-400" />
                </div>
                <p className="font-semibold text-slate-700 dark:text-slate-300">API Token Management</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Coming soon</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Cancel Invitation Dialog */}
      <AlertDialogComponent open={cancelInviteId !== null} onOpenChange={(open) => !open && setCancelInviteId(null)}>
        <AlertDialogContentComponent className="rounded-2xl border border-slate-200/50 dark:border-slate-800/50 dark:bg-slate-900">
          <AlertDialogHeaderComponent>
            <AlertDialogTitleComponent className="text-slate-900 dark:text-white">Cancel Invitation</AlertDialogTitleComponent>
            <AlertDialogDescriptionComponent className="text-slate-500 dark:text-slate-400">Are you sure you want to cancel this invitation? This action cannot be undone.</AlertDialogDescriptionComponent>
          </AlertDialogHeaderComponent>
          <AlertDialogFooterComponent>
            <AlertDialogCancelComponent className="rounded-xl border-slate-200/70 dark:border-slate-700" onClick={() => setCancelInviteId(null)}>Keep Invitation</AlertDialogCancelComponent>
            <AlertDialogActionComponent onClick={handleCancelInvitation} className="rounded-xl bg-red-500 hover:bg-red-600 text-white border-0">Cancel Invitation</AlertDialogActionComponent>
          </AlertDialogFooterComponent>
        </AlertDialogContentComponent>
      </AlertDialogComponent>

      {/* Remove Member Dialog */}
      <AlertDialogComponent open={removeMemberId !== null} onOpenChange={(open) => !open && setRemoveMemberId(null)}>
        <AlertDialogContentComponent className="rounded-2xl border border-slate-200/50 dark:border-slate-800/50 dark:bg-slate-900">
          <AlertDialogHeaderComponent>
            <AlertDialogTitleComponent className="text-slate-900 dark:text-white">Remove Member</AlertDialogTitleComponent>
            <AlertDialogDescriptionComponent className="text-slate-500 dark:text-slate-400">Are you sure you want to remove this member? They will lose access immediately.</AlertDialogDescriptionComponent>
          </AlertDialogHeaderComponent>
          <AlertDialogFooterComponent>
            <AlertDialogCancelComponent className="rounded-xl border-slate-200/70 dark:border-slate-700" onClick={() => setRemoveMemberId(null)}>Keep Member</AlertDialogCancelComponent>
            <AlertDialogActionComponent onClick={handleRemoveMember} className="rounded-xl bg-red-500 hover:bg-red-600 text-white border-0">Remove Member</AlertDialogActionComponent>
          </AlertDialogFooterComponent>
        </AlertDialogContentComponent>
      </AlertDialogComponent>
    </div>
  );
};

export default Users;