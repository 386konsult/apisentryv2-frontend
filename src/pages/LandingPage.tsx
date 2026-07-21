import { useState } from "react";
import { useNavigate } from "react-router-dom";
import HeimdallAILogo from "@/components/HeimdallAILogo";

const LandingPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const tabs = [
    {
      label: "WAF Protection",
      title: "Enterprise-Grade Web Application Firewall",
      description:
        "Block OWASP Top 10, zero-days, and custom attack patterns in real time. Heimdall's WAF sits in front of your APIs and stops threats before they reach your backend.",
      features: ["OWASP Top 10 coverage", "Custom rule builder", "Zero-day protection", "DDoS mitigation"],
    },
    {
      label: "AI Threat Engine",
      title: "AI That Learns Your Traffic Pattern",
      description:
        "Our ML engine builds a baseline of your API traffic and flags anomalies automatically — without manual rules. It adapts as your traffic evolves.",
      features: ["Behavioral baselining", "Anomaly detection", "Auto-tuning rules", "False positive reduction"],
    },
    {
      label: "API Discovery",
      title: "Find Every API in Your Stack",
      description:
        "Heimdall passively monitors traffic to discover undocumented APIs, shadow endpoints, and deprecated routes that are still being called.",
      features: ["Passive API inventory", "Shadow API detection", "Endpoint risk scoring", "Auto-generated API map"],
    },
    {
      label: "Analytics",
      title: "Real-Time Security Analytics",
      description:
        "See every blocked request, threat actor, and attack pattern in a unified dashboard. Export reports for compliance or SOC reviews.",
      features: ["Live threat feed", "Attacker IP tracking", "Compliance reports", "Custom dashboards"],
    },
  ];

  const faqs: { q: string; a: string }[] = [
    {
      q: "How long does it take to deploy Heimdall?",
      a: "Most teams are live in under 10 minutes. You point your DNS or configure an Envoy/NGINX proxy — Heimdall provides a WASM filter that slots in without changing your application code.",
    },
    {
      q: "Does it work with any API framework?",
      a: "Yes. Heimdall is framework-agnostic. It operates at the proxy layer so it protects REST, GraphQL, gRPC, and WebSocket APIs regardless of what's running underneath.",
    },
    {
      q: "Will it slow down my APIs?",
      a: "No. The WASM filter adds sub-millisecond latency (typically <0.5ms p99). It runs in the same process as your proxy, so there's no network hop.",
    },
    {
      q: "How does the AI avoid blocking legitimate traffic?",
      a: "Heimdall learns your traffic baseline over the first 24–48 hours and only flags deviations. You can review flagged requests and provide feedback to improve accuracy.",
    },
    {
      q: "Is my traffic data stored?",
      a: "Only metadata (IPs, paths, response codes, threat scores) is stored — never request or response bodies. Data is encrypted at rest and can be retained for 30, 90, or 365 days.",
    },
  ];

  const compareRows: { label: string; traditional: string | null }[] = [
    { label: "API-aware threat detection",  traditional: null },
    { label: "AI/ML anomaly detection",     traditional: null },
    { label: "Sub-millisecond latency",     traditional: null },
    { label: "No-code deployment (WASM)",   traditional: null },
    { label: "Real-time request analytics", traditional: "Basic" },
    { label: "Shadow API discovery",        traditional: null },
    { label: "Per-tenant isolation",        traditional: null },
    { label: "Custom AI chat assistant",    traditional: null },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      overflowX: "hidden",
      background: "#FFFFFF",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>

      {/* ── HERO VIEWPORT ── */}
      <div style={{ position: "relative", height: "100vh", display: "flex", flexDirection: "column" }}>

        {/* Background gradient */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          background: `
            radial-gradient(ellipse 70% 45% at 50% 0%, rgba(37,99,235,0.06) 0%, transparent 60%),
            radial-gradient(ellipse 50% 35% at 80% 100%, rgba(6,182,212,0.04) 0%, transparent 60%)
          `,
        }} />

        {/* ── NAVBAR ── */}
        <div style={{
          position: "relative", zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 48px", height: 64, flexShrink: 0,
          background: "transparent",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}
            onClick={() => navigate("/")}>
            <HeimdallAILogo size={32} />
            <span style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em" }}>
              Heimdall
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => navigate("/login")} style={{
              background: "transparent", border: "1.5px solid #E5E7EB",
              cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#374151",
              padding: "9px 20px", borderRadius: 12, transition: "border-color 0.15s, background 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#D1D5DB"; e.currentTarget.style.background = "#F9FAFB"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.background = "transparent"; }}
            >Sign In</button>
            <button onClick={() => navigate("/register")} style={{
              background: "linear-gradient(135deg, #2563EB, #0EA5E9)",
              border: "none", cursor: "pointer",
              fontSize: 14, fontWeight: 600, color: "#fff",
              padding: "10px 22px", borderRadius: 12, transition: "transform 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
            >Sign Up</button>
          </div>
        </div>

        {/* ── HERO CONTENT ── */}
        <div style={{
          position: "relative", zIndex: 1, flex: 1,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "0 24px 12px",
        }}>

          {/* Visual network diagram */}
          <div style={{ position: "relative", width: "100%", maxWidth: 780, height: 280, flexShrink: 0, marginBottom: 20 }}>
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", pointerEvents: "none" }}>
              <line x1="17%" y1="16%" x2="50%" y2="50%" stroke="rgba(37,99,235,0.14)" strokeWidth="1"/>
              <line x1="22%" y1="76%" x2="50%" y2="50%" stroke="rgba(37,99,235,0.14)" strokeWidth="1"/>
              <line x1="4%"  y1="46%" x2="50%" y2="50%" stroke="rgba(37,99,235,0.14)" strokeWidth="1"/>
              <line x1="83%" y1="16%" x2="50%" y2="50%" stroke="rgba(37,99,235,0.14)" strokeWidth="1"/>
              <line x1="78%" y1="78%" x2="50%" y2="50%" stroke="rgba(37,99,235,0.14)" strokeWidth="1"/>
              <line x1="97%" y1="44%" x2="50%" y2="50%" stroke="rgba(37,99,235,0.14)" strokeWidth="1"/>
              {([["31%","33%"],["33%","64%"],["23%","48%"],["68%","31%"],["66%","65%"],["77%","47%"]] as [string,string][]).map(([cx,cy],i)=>(
                <circle key={i} cx={cx} cy={cy} r="3" fill="rgba(37,99,235,0.45)">
                  <animate attributeName="opacity" values="0.3;0.9;0.3" dur={`${2+i*0.35}s`} repeatCount="indefinite"/>
                  <animate attributeName="r" values="2.5;4;2.5" dur={`${2+i*0.35}s`} repeatCount="indefinite"/>
                </circle>
              ))}
            </svg>

            {/* Center card */}
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: 110, height: 110, borderRadius: 28,
              background: "linear-gradient(135deg, #2563EB 0%, #0EA5E9 100%)",
              boxShadow: "0 24px 72px rgba(37,99,235,0.3), 0 0 0 1px rgba(255,255,255,0.15) inset",
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "floatCenter 4s ease-in-out infinite alternate", zIndex: 10,
            }}>
              <div style={{
                position: "absolute", inset: -16,
                background: "radial-gradient(ellipse, rgba(37,99,235,0.18) 0%, transparent 70%)",
                animation: "glowPulse 3s ease-in-out infinite", borderRadius: "50%",
              }}/>
              <HeimdallAILogo size={56} inverted />
            </div>

            {/* Top left — yellow */}
            <FloatNode top="5%" left="13%" anim="float0" dur={3.5}>
              <FloatCard bg="linear-gradient(135deg,#FCD34D,#F59E0B)" size={62} radius={18} shadow="0 10px 24px rgba(245,158,11,0.28)">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3C8.69 3 6 5.69 6 9c0 2.22 1.21 4.16 3 5.2V16a1 1 0 001 1h4a1 1 0 001-1v-1.8C16.79 13.16 18 11.22 18 9c0-3.31-2.69-6-6-6z" fill="white" fillOpacity="0.9"/>
                  <rect x="9" y="18" width="6" height="1.5" rx="0.75" fill="white" fillOpacity="0.7"/>
                </svg>
              </FloatCard>
              <NodeLabel>Threat Intel</NodeLabel>
            </FloatNode>

            {/* Bottom left — blue */}
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

            {/* Far left — avatar */}
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

            {/* Top right — orange */}
            <FloatNode top="5%" left="83%" anim="float3" dur={3.3}>
              <FloatCard bg="linear-gradient(135deg,#FB923C,#EF4444)" size={62} radius={18} shadow="0 10px 24px rgba(239,68,68,0.28)">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" fill="white" fillOpacity="0.95"/>
                </svg>
              </FloatCard>
              <NodeLabel>Real-time Block</NodeLabel>
            </FloatNode>

            {/* Bottom right — green avatar */}
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

            {/* Far right — eye */}
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

          {/* Headline */}
          <h1 style={{
            fontSize: "clamp(2rem, 3.8vw, 3.4rem)", fontWeight: 800, color: "#0F172A",
            textAlign: "center", letterSpacing: "-0.04em", lineHeight: 1.05,
            maxWidth: 820, margin: "0 0 12px",
          }}>
            AI-Powered API Security Platform
            <br />
            <span style={{
              background: "linear-gradient(135deg, #2563EB, #0EA5E9)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>Built for Modern Engineering Teams</span>
          </h1>

          <p style={{ fontSize: 15, fontWeight: 400, color: "#64748B", textAlign: "center", lineHeight: 1.65, maxWidth: 540, margin: "0 0 28px" }}>
            Protect APIs in real time with AI-driven threat detection, intelligent rate limiting,
            attack monitoring, and enterprise-grade security workflows.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
            <button onClick={() => navigate("/register")} style={{
              height: 50, padding: "0 32px",
              background: "linear-gradient(135deg, #2563EB, #0EA5E9)",
              border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#fff",
              borderRadius: 14, transition: "transform 0.2s", letterSpacing: "-0.01em",
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

          {/* Trust row */}
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
      </div>

      {/* ── STATS STRIP ── */}
      <div style={{ background: "#F8FAFC", borderTop: "1px solid #E2E8F0", borderBottom: "1px solid #E2E8F0", padding: "48px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, textAlign: "center" }}>
          {[
            { num: "99.97%", label: "Uptime SLA" },
            { num: "50M+",   label: "Requests blocked daily" },
            { num: "<1ms",   label: "Added latency (p99)" },
            { num: "SOC 2",  label: "Type II Certified" },
          ].map(stat => (
            <div key={stat.label}>
              <div style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 800, color: "#2563EB", letterSpacing: "-0.03em", lineHeight: 1 }}>{stat.num}</div>
              <div style={{ fontSize: 13, color: "#64748B", marginTop: 8, fontWeight: 500 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURE TABS ── */}
      <div style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.5rem, 2.8vw, 2.2rem)", fontWeight: 800, color: "#0F172A", textAlign: "center", letterSpacing: "-0.03em", marginBottom: 8 }}>
            Everything you need to secure your APIs
          </h2>
          <p style={{ textAlign: "center", color: "#64748B", fontSize: 15, marginBottom: 40, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
            A unified platform built for modern API-first teams.
          </p>

          {/* Tab pills */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 40 }}>
            {tabs.map((tab, i) => (
              <button key={i} onClick={() => setActiveTab(i)} style={{
                padding: "9px 18px", borderRadius: 50, fontSize: 14, fontWeight: 500,
                cursor: "pointer", border: "1.5px solid",
                borderColor: activeTab === i ? "#2563EB" : "#E2E8F0",
                background: activeTab === i ? "#EFF6FF" : "#fff",
                color: activeTab === i ? "#2563EB" : "#64748B",
                transition: "all 0.15s",
              }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab panel */}
          <div style={{
            background: "#F8FAFC", borderRadius: 20, padding: "40px",
            border: "1px solid #E2E8F0",
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center",
          }}>
            <div>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0F172A", marginBottom: 12, letterSpacing: "-0.02em" }}>
                {tabs[activeTab].title}
              </h3>
              <p style={{ color: "#64748B", fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
                {tabs[activeTab].description}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {tabs[activeTab].features.map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%",
                      background: "linear-gradient(135deg, #2563EB, #0EA5E9)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span style={{ fontSize: 14, color: "#374151", fontWeight: 500 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{
              height: 220, borderRadius: 16,
              background: "linear-gradient(135deg, rgba(37,99,235,0.06), rgba(6,182,212,0.06))",
              border: "1px solid rgba(37,99,235,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <HeimdallAILogo size={72} />
            </div>
          </div>
        </div>
      </div>

      {/* ── WHY SWITCH ── */}
      <div style={{ background: "#F8FAFC", borderTop: "1px solid #E2E8F0", padding: "80px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.5rem, 2.8vw, 2.2rem)", fontWeight: 800, color: "#0F172A", textAlign: "center", letterSpacing: "-0.03em", marginBottom: 8 }}>
            Why teams switch to Heimdall
          </h2>
          <p style={{ textAlign: "center", color: "#64748B", fontSize: 15, marginBottom: 48 }}>
            Built API-first, not bolted on.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "12px 16px", color: "#64748B", fontWeight: 600, fontSize: 13, borderBottom: "1px solid #E2E8F0" }}>Feature</th>
                  <th style={{ textAlign: "center", padding: "12px 16px", color: "#64748B", fontWeight: 600, fontSize: 13, borderBottom: "1px solid #E2E8F0" }}>Traditional WAF</th>
                  <th style={{ textAlign: "center", padding: "12px 16px", color: "#2563EB", fontWeight: 700, fontSize: 13, background: "rgba(37,99,235,0.05)", borderBottom: "1px solid #BFDBFE" }}>Heimdall</th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "transparent" }}>
                    <td style={{ padding: "13px 16px", color: "#374151", fontWeight: 500, borderBottom: "1px solid #F1F5F9" }}>{row.label}</td>
                    <td style={{ padding: "13px 16px", textAlign: "center", borderBottom: "1px solid #F1F5F9" }}>
                      {row.traditional === null ? (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display: "inline" }}>
                          <path d="M4 4l8 8M12 4l-8 8" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      ) : (
                        <span style={{ fontSize: 12, fontWeight: 500, color: "#94A3B8" }}>{row.traditional}</span>
                      )}
                    </td>
                    <td style={{ padding: "13px 16px", textAlign: "center", background: "rgba(37,99,235,0.03)", borderBottom: "1px solid #EFF6FF" }}>
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ display: "inline" }}>
                        <circle cx="9" cy="9" r="8" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1"/>
                        <path d="M5.5 9l2.5 2.5 4.5-4.5" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── TESTIMONIALS ── */}
      <div style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.5rem, 2.8vw, 2.2rem)", fontWeight: 800, color: "#0F172A", textAlign: "center", letterSpacing: "-0.03em", marginBottom: 48 }}>
            Trusted by engineering teams
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {[
              {
                quote: "We blocked 12,000 injection attempts in the first 24 hours after deploying Heimdall. The AI caught things our old WAF missed.",
                name: "Adaeze O.", role: "Lead Security Engineer", company: "FinTech startup, Lagos",
              },
              {
                quote: "Deploying took 8 minutes. No code changes, just a WASM filter. Our p99 latency didn't move at all.",
                name: "Kofi M.", role: "Platform Engineering Lead", company: "E-commerce platform, Accra",
              },
              {
                quote: "The Heimdall AI assistant answered every security question our dev team had. It's like having a security expert on call.",
                name: "Seun A.", role: "CTO", company: "SaaS company, Abuja",
              },
            ].map((t, i) => (
              <div key={i} style={{
                background: "#fff", border: "1.5px solid #E2E8F0",
                borderRadius: 16, padding: "28px 24px",
                display: "flex", flexDirection: "column", gap: 16,
              }}>
                <svg width="24" height="18" viewBox="0 0 24 18" fill="none">
                  <path d="M0 18V11.5C0 5.167 3.167 1.333 9.5 0L11 2.5C8.333 3.167 6.667 4.5 6 6.5H9V18H0ZM13 18V11.5C13 5.167 16.167 1.333 22.5 0L24 2.5C21.333 3.167 19.667 4.5 19 6.5H22V18H13Z" fill="#2563EB" fillOpacity="0.18"/>
                </svg>
                <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, margin: 0 }}>{t.quote}</p>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#0F172A" }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{t.role} · {t.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div style={{ background: "#F8FAFC", borderTop: "1px solid #E2E8F0", padding: "80px 24px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.5rem, 2.8vw, 2.2rem)", fontWeight: 800, color: "#0F172A", textAlign: "center", letterSpacing: "-0.03em", marginBottom: 48 }}>
            Frequently asked questions
          </h2>
          <div>
            {faqs.map((faq, i) => (
              <div key={i} style={{ borderTop: "1px solid #E2E8F0", ...(i === faqs.length - 1 ? { borderBottom: "1px solid #E2E8F0" } : {}) }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: "100%", textAlign: "left", padding: "18px 0",
                    background: "none", border: "none", cursor: "pointer",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    fontSize: 15, fontWeight: 600, color: "#0F172A",
                  }}
                >
                  {faq.q}
                  <svg
                    width="20" height="20" viewBox="0 0 20 20" fill="none"
                    style={{ flexShrink: 0, marginLeft: 12, transition: "transform 0.2s", transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)" }}
                  >
                    <path d="M5 7.5l5 5 5-5" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                {openFaq === i && (
                  <div style={{ paddingBottom: 18, fontSize: 14, color: "#64748B", lineHeight: 1.7 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FOOTER CTA ── */}
      <div style={{ padding: "80px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <HeimdallAILogo size={48} />
          </div>
          <h2 style={{ fontSize: "clamp(1.4rem, 2.6vw, 2rem)", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.03em", margin: "0 0 12px" }}>
            Ready to secure your APIs?
          </h2>
          <p style={{ color: "#64748B", fontSize: 15, marginBottom: 28 }}>
            Get started in minutes. No credit card required.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button onClick={() => navigate("/register")} style={{
              height: 50, padding: "0 32px",
              background: "linear-gradient(135deg, #2563EB, #0EA5E9)",
              border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#fff",
              borderRadius: 14, transition: "transform 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
            >Get Started Free</button>
            <button onClick={() => navigate("/login")} style={{
              height: 50, padding: "0 28px",
              background: "#fff", border: "1.5px solid #E5E7EB",
              cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#374151",
              borderRadius: 14, transition: "border-color 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#D1D5DB"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#E5E7EB"; }}
            >Sign In</button>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        borderTop: "1px solid #E2E8F0", padding: "24px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <HeimdallAILogo size={22} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Heimdall</span>
        </div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {["Privacy Policy", "Terms of Service", "Security", "Contact"].map(link => (
            <span key={link} style={{ fontSize: 13, color: "#64748B", cursor: "pointer" }}
              onMouseEnter={e => { (e.target as HTMLElement).style.color = "#2563EB"; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.color = "#64748B"; }}
            >{link}</span>
          ))}
        </div>
        <span style={{ fontSize: 12, color: "#94A3B8" }}>© 2026 Heimdall Security. All rights reserved.</span>
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
