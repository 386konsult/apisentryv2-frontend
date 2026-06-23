import { useNavigate } from "react-router-dom";
import HeimdallAILogo from "@/components/HeimdallAILogo";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      height: "100vh",
      maxHeight: "100vh",
      overflow: "hidden",
      background: "#FFFFFF",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      position: "relative",
      display: "flex",
      flexDirection: "column",
    }}>

      {/* ── BACKGROUND ── */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `
          radial-gradient(ellipse 70% 45% at 50% 0%, rgba(37,99,235,0.06) 0%, transparent 60%),
          radial-gradient(ellipse 50% 35% at 80% 100%, rgba(6,182,212,0.04) 0%, transparent 60%)
        `,
      }} />

      {/* ── FLAT FULL-WIDTH NAVBAR ── */}
      <div style={{
        position: "relative", zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 48px",
        height: 64,
        flexShrink: 0,
        borderBottom: "none",
        background: "transparent",
      }}>
        {/* Logo — far left */}
        <div style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}
          onClick={() => navigate("/")}>
          <HeimdallAILogo size={32} />
          <span style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em" }}>
            Heimdall
          </span>
        </div>

        {/* Buttons — far right */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => navigate("/login")} style={{
            background: "transparent", border: "1.5px solid #E5E7EB",
            cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#374151",
            padding: "9px 20px", borderRadius: 12,
            transition: "border-color 0.15s, background 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#D1D5DB"; e.currentTarget.style.background = "#F9FAFB"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.background = "transparent"; }}
          >Sign In</button>

          <button onClick={() => navigate("/register")} style={{
            background: "linear-gradient(135deg, #2563EB, #0EA5E9)",
            border: "none", cursor: "pointer",
            fontSize: 14, fontWeight: 600, color: "#fff",
            padding: "10px 22px", borderRadius: 12,
            boxShadow: "none",
            transition: "transform 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
          >Sign Up</button>
        </div>
      </div>

      {/* ── HERO CONTENT ── */}
      <div style={{
        position: "relative", zIndex: 1,
        flex: 1,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "0 24px 12px",
      }}>

        {/* ── VISUAL NETWORK ── */}
        <div style={{
          position: "relative",
          width: "100%", maxWidth: 780,
          height: 280,
          flexShrink: 0,
          marginBottom: 20,
        }}>
          {/* SVG connection lines */}
          <svg style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            overflow: "visible", pointerEvents: "none",
          }}>
            <line x1="17%" y1="16%" x2="50%" y2="50%" stroke="rgba(37,99,235,0.14)" strokeWidth="1"/>
            <line x1="22%" y1="76%" x2="50%" y2="50%" stroke="rgba(37,99,235,0.14)" strokeWidth="1"/>
            <line x1="4%"  y1="46%" x2="50%" y2="50%" stroke="rgba(37,99,235,0.14)" strokeWidth="1"/>
            <line x1="83%" y1="16%" x2="50%" y2="50%" stroke="rgba(37,99,235,0.14)" strokeWidth="1"/>
            <line x1="78%" y1="78%" x2="50%" y2="50%" stroke="rgba(37,99,235,0.14)" strokeWidth="1"/>
            <line x1="97%" y1="44%" x2="50%" y2="50%" stroke="rgba(37,99,235,0.14)" strokeWidth="1"/>

            {[["31%","33%"],["33%","64%"],["23%","48%"],["68%","31%"],["66%","65%"],["77%","47%"]].map(([cx,cy],i)=>(
              <circle key={i} cx={cx} cy={cy} r="3" fill="rgba(37,99,235,0.45)">
                <animate attributeName="opacity" values="0.3;0.9;0.3" dur={`${2+i*0.35}s`} repeatCount="indefinite"/>
                <animate attributeName="r" values="2.5;4;2.5" dur={`${2+i*0.35}s`} repeatCount="indefinite"/>
              </circle>
            ))}
          </svg>

          {/* ── CENTER CARD — Heimdall blue ── */}
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: 110, height: 110, borderRadius: 28,
            background: "linear-gradient(135deg, #2563EB 0%, #0EA5E9 100%)",
            boxShadow: "0 24px 72px rgba(37,99,235,0.3), 0 0 0 1px rgba(255,255,255,0.15) inset",
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: "floatCenter 4s ease-in-out infinite alternate",
            zIndex: 10,
          }}>
            <div style={{
              position: "absolute", inset: -16,
              background: "radial-gradient(ellipse, rgba(37,99,235,0.18) 0%, transparent 70%)",
              animation: "glowPulse 3s ease-in-out infinite",
              borderRadius: "50%",
            }}/>
            <HeimdallAILogo size={56} inverted />
          </div>

          {/* TOP LEFT — yellow */}
          <FloatNode top="5%" left="13%" anim="float0" dur={3.5}>
            <FloatCard bg="linear-gradient(135deg,#FCD34D,#F59E0B)" size={62} radius={18} shadow="0 10px 24px rgba(245,158,11,0.28)">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M12 3C8.69 3 6 5.69 6 9c0 2.22 1.21 4.16 3 5.2V16a1 1 0 001 1h4a1 1 0 001-1v-1.8C16.79 13.16 18 11.22 18 9c0-3.31-2.69-6-6-6z" fill="white" fillOpacity="0.9"/>
                <rect x="9" y="18" width="6" height="1.5" rx="0.75" fill="white" fillOpacity="0.7"/>
              </svg>
            </FloatCard>
            <NodeLabel>Threat Intel</NodeLabel>
          </FloatNode>

          {/* BOTTOM LEFT — blue */}
          <FloatNode top="70%" left="18%" anim="float1" dur={4.1}>
            <FloatCard bg="linear-gradient(135deg,#38BDF8,#0EA5E9)" size={62} radius={18} shadow="0 10px 24px rgba(14,165,233,0.28)">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="8" width="18" height="8" rx="4" stroke="white" strokeWidth="1.8" fill="none"/>
                <circle cx="8" cy="12" r="1.5" fill="white"/>
                <circle cx="12" cy="12" r="1.5" fill="white"/>
                <circle cx="16" cy="12" r="1.5" fill="white"/>
              </svg>
            </FloatCard>
            <NodeLabel>API Discovery</NodeLabel>
          </FloatNode>

          {/* FAR LEFT — avatar */}
          <div style={{
            position: "absolute", top: "43%", left: "-1%",
            transform: "translate(0,-50%)",
            animation: "floatFarLeft 3.8s ease-in-out infinite alternate",
            display: "flex", flexDirection: "column", alignItems: "center",
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: "linear-gradient(135deg,#DBEAFE,#BFDBFE)",
              border: "2px solid rgba(255,255,255,0.9)",
              boxShadow: "0 8px 22px rgba(37,99,235,0.16)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" fill="#2563EB" fillOpacity="0.7"/>
                <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" fill="#2563EB" fillOpacity="0.5"/>
              </svg>
            </div>
            <NodeLabel>Security Team</NodeLabel>
          </div>

          {/* TOP RIGHT — orange */}
          <FloatNode top="5%" left="83%" anim="float3" dur={3.3}>
            <FloatCard bg="linear-gradient(135deg,#FB923C,#EF4444)" size={62} radius={18} shadow="0 10px 24px rgba(239,68,68,0.28)">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" fill="white" fillOpacity="0.95"/>
              </svg>
            </FloatCard>
            <NodeLabel>Real-time Block</NodeLabel>
          </FloatNode>

          {/* BOTTOM RIGHT — green avatar */}
          <FloatNode top="72%" left="78%" anim="float4" dur={4.4}>
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: "linear-gradient(135deg,#D1FAE5,#A7F3D0)",
              border: "2px solid rgba(255,255,255,0.9)",
              boxShadow: "0 8px 22px rgba(16,185,129,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="3.5" fill="#10B981" fillOpacity="0.8"/>
                <path d="M5 20c0-3.5 3.13-6 7-6s7 2.5 7 6" fill="#10B981" fillOpacity="0.5"/>
              </svg>
            </div>
            <NodeLabel>Analyst</NodeLabel>
          </FloatNode>

          {/* FAR RIGHT — eye */}
          <FloatNode top="41%" left="96%" anim="float5" dur={3.7}>
            <FloatCard bg="#FFFFFF" size={58} radius={16} shadow="0 8px 22px rgba(0,0,0,0.09)" border="1px solid rgba(0,0,0,0.07)">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#2563EB" strokeWidth="1.8" fill="none"/>
                <circle cx="12" cy="12" r="3" stroke="#2563EB" strokeWidth="1.8" fill="rgba(37,99,235,0.1)"/>
              </svg>
            </FloatCard>
            <NodeLabel>Monitoring</NodeLabel>
          </FloatNode>
        </div>

        {/* ── HEADLINE ── */}
        <h1 style={{
          fontSize: "clamp(2rem, 3.8vw, 3.4rem)",
          fontWeight: 800,
          color: "#0F172A",
          textAlign: "center",
          letterSpacing: "-0.04em",
          lineHeight: 1.05,
          maxWidth: 820,
          margin: "0 0 12px",
        }}>
          AI-Powered API Security Platform
          <br />
          <span style={{
            background: "linear-gradient(135deg, #2563EB, #0EA5E9)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>Built for Modern Engineering Teams</span>
        </h1>

        {/* ── SUBHEADLINE ── */}
        <p style={{
          fontSize: 15, fontWeight: 400, color: "#64748B",
          textAlign: "center", lineHeight: 1.65,
          maxWidth: 540, margin: "0 0 28px",
        }}>
          Protect APIs in real time with AI-driven threat detection, intelligent rate limiting,
          attack monitoring, and enterprise-grade security workflows.
        </p>

        {/* ── CTA BUTTONS ── */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
          <button onClick={() => navigate("/register")} style={{
            height: 50, padding: "0 32px",
            background: "linear-gradient(135deg, #2563EB, #0EA5E9)",
            border: "none", cursor: "pointer",
            fontSize: 14, fontWeight: 600, color: "#fff", borderRadius: 14,
            boxShadow: "none",
            transition: "transform 0.2s",
            letterSpacing: "-0.01em",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
          >Get Started Free</button>

          <button onClick={() => navigate("/login")} style={{
            height: 50, padding: "0 28px",
            background: "#fff", border: "1.5px solid #E5E7EB",
            cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#374151",
            borderRadius: 14, transition: "border-color 0.2s, transform 0.2s, box-shadow 0.2s",
            letterSpacing: "-0.01em",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#D1D5DB"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.07)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
          >Sign In</button>
        </div>

        {/* ── TRUST ROW ── */}
        <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
          {["No credit card required","Deploy in 2 minutes","SOC 2 Ready","Enterprise Security"].map(item => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{
                width: 16, height: 16, borderRadius: "50%",
                background: "rgba(37,99,235,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2 2 4-4" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes floatCenter {
          0%   { transform: translate(-50%,-50%) translateY(0px);  }
          100% { transform: translate(-50%,-50%) translateY(-8px); }
        }
        @keyframes glowPulse {
          0%,100% { opacity:0.6; transform:scale(1);    }
          50%      { opacity:1;   transform:scale(1.15); }
        }
        @keyframes float0      { 0%{transform:translate(-50%,-50%) translateY(0)}    100%{transform:translate(-50%,-50%) translateY(-7px)} }
        @keyframes float1      { 0%{transform:translate(-50%,-50%) translateY(0)}    100%{transform:translate(-50%,-50%) translateY(-9px)} }
        @keyframes floatFarLeft{ 0%{transform:translate(0,-50%) translateY(0)}       100%{transform:translate(0,-50%) translateY(-6px)}   }
        @keyframes float3      { 0%{transform:translate(-50%,-50%) translateY(0)}    100%{transform:translate(-50%,-50%) translateY(-10px)}  }
        @keyframes float4      { 0%{transform:translate(-50%,-50%) translateY(0)}    100%{transform:translate(-50%,-50%) translateY(-5px)}   }
        @keyframes float5      { 0%{transform:translate(-50%,-50%) translateY(0)}    100%{transform:translate(-50%,-50%) translateY(-8px)}   }
      `}</style>
    </div>
  );
};

/* ── Floating node wrapper ── */
const FloatNode = ({ children, top, left, anim, dur }: {
  children: React.ReactNode; top: string; left: string; anim: string; dur: number;
}) => (
  <div style={{
    position: "absolute", top, left,
    transform: "translate(-50%,-50%)",
    animation: `${anim} ${dur}s ease-in-out infinite alternate`,
    display: "flex", flexDirection: "column", alignItems: "center",
  }}>
    {children}
  </div>
);

/* ── Icon card ── */
const FloatCard = ({ children, bg, size, radius, shadow, border }: {
  children: React.ReactNode; bg: string; size: number;
  radius: number; shadow: string; border?: string;
}) => (
  <div style={{
    width: size, height: size, borderRadius: radius,
    background: bg,
    border: border || "2px solid rgba(255,255,255,0.65)",
    boxShadow: shadow,
    display: "flex", alignItems: "center", justifyContent: "center",
  }}>
    {children}
  </div>
);

/* ── Label below card ── */
const NodeLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    textAlign: "center", marginTop: 6,
    fontSize: 10, fontWeight: 600,
    color: "#94A3B8", letterSpacing: "0.02em", whiteSpace: "nowrap",
  }}>
    {children}
  </div>
);

export default LandingPage;
