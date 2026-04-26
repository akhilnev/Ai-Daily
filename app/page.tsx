"use client";

import { useEffect, useState, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

type Category = "model" | "research" | "tools" | "industry";

interface BriefItem {
  title: string;
  category: Category;
  summary: string;
  relevance: string;
  source: string;
  imageQuery: string;
}

interface Brief {
  items: BriefItem[];
  generatedAt: string;
  date: string;
}

const CAT_META: Record<Category, { label: string; color: string; bg: string; dot: string }> = {
  model:    { label: "Models & APIs", color: "#1e40af", bg: "#eff6ff", dot: "#3b82f6" },
  research: { label: "Research",      color: "#166534", bg: "#f0fdf4", dot: "#22c55e" },
  tools:    { label: "Tools & Infra", color: "#854d0e", bg: "#fefce8", dot: "#eab308" },
  industry: { label: "Industry",      color: "#374151", bg: "#f9fafb", dot: "#9ca3af" },
};

function Badge({ cat }: { cat: Category }) {
  const m = CAT_META[cat];
  return (
    <span style={{
      fontSize: 11, padding: "3px 10px", borderRadius: 20,
      background: m.bg, color: m.color, fontWeight: 600,
      border: `1px solid ${m.dot}30`, whiteSpace: "nowrap", flexShrink: 0,
    }}>{m.label}</span>
  );
}

function Card({ item }: { item: BriefItem }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{
      background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
      padding: "18px 22px", transition: "border-color 0.15s",
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "#d1d5db")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "#e5e7eb")}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: "#111827", lineHeight: 1.4, margin: 0 }}>{item.title}</p>
        <Badge cat={item.category} />
      </div>
      <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.7, margin: "0 0 10px" }}>{item.summary}</p>
      <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 10 }}>
        <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, margin: 0 }}>
          <span style={{ fontWeight: 600, color: "#374151" }}>Why it matters — </span>
          {expanded ? item.relevance : item.relevance.slice(0, 120) + (item.relevance.length > 120 ? "..." : "")}
          {item.relevance.length > 120 && (
            <button onClick={() => setExpanded(!expanded)} style={{
              background: "none", border: "none", color: "#6b7280", cursor: "pointer",
              fontSize: 12, marginLeft: 4, textDecoration: "underline",
            }}>{expanded ? "less" : "more"}</button>
          )}
        </p>
      </div>
      <p style={{ fontSize: 11, color: "#9ca3af", margin: "8px 0 0" }}>{item.source}</p>
    </div>
  );
}

function ChartPanel({ items }: { items: BriefItem[] }) {
  const data = (Object.keys(CAT_META) as Category[]).map(cat => ({
    name: CAT_META[cat].label.split(" ")[0],
    count: items.filter(i => i.category === cat).length,
    color: CAT_META[cat].dot,
  })).filter(d => d.count > 0);

  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "18px 22px", marginBottom: 20 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", margin: "0 0 14px" }}>Today's breakdown</p>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} barSize={28} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#d1d5db" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb", boxShadow: "none" }} cursor={{ fill: "#f9fafb" }} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Home() {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Category | "all">("all");
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/brief");
      if (!res.ok) throw new Error("Failed to fetch brief");
      const data = await res.json();
      setBrief(data);
      setLastFetched(new Date());
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const sendEmail = async () => {
    setEmailStatus("sending");
    try {
      const res = await fetch("/api/send-email", { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      setEmailStatus("sent");
      setTimeout(() => setEmailStatus("idle"), 3000);
    } catch {
      setEmailStatus("error");
      setTimeout(() => setEmailStatus("idle"), 3000);
    }
  };

  const filtered = brief?.items.filter(i => filter === "all" || i.category === filter) ?? [];

  return (
    <main style={{ maxWidth: 680, margin: "0 auto", padding: "32px 20px 64px", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>AI Daily Brief</h1>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={load} disabled={loading} style={{
              fontSize: 13, padding: "6px 14px", borderRadius: 8, border: "1px solid #e5e7eb",
              background: "#fff", cursor: loading ? "not-allowed" : "pointer", color: "#4b5563", opacity: loading ? 0.5 : 1,
            }}>{loading ? "Loading..." : "Refresh ↻"}</button>
            <button onClick={sendEmail} disabled={emailStatus === "sending"} style={{
              fontSize: 13, padding: "6px 14px", borderRadius: 8, border: "1px solid #e5e7eb",
              background: emailStatus === "sent" ? "#f0fdf4" : "#fff",
              cursor: emailStatus === "sending" ? "not-allowed" : "pointer",
              color: emailStatus === "sent" ? "#166534" : emailStatus === "error" ? "#991b1b" : "#4b5563",
              opacity: emailStatus === "sending" ? 0.5 : 1,
            }}>
              {emailStatus === "sending" ? "Sending..." : emailStatus === "sent" ? "Sent ✓" : emailStatus === "error" ? "Failed ✗" : "Email me"}
            </button>
          </div>
        </div>
        <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
          {brief?.date ?? "Loading..."}
          {lastFetched && <span> · fetched {lastFetched.toLocaleTimeString()}</span>}
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {(["all", "model", "research", "tools", "industry"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            fontSize: 12, padding: "5px 14px", borderRadius: 20,
            border: `1px solid ${filter === f ? "#9ca3af" : "#e5e7eb"}`,
            background: filter === f ? "#f3f4f6" : "#fff",
            color: filter === f ? "#111827" : "#6b7280",
            cursor: "pointer", fontWeight: filter === f ? 600 : 400,
          }}>
            {f === "all" ? "All" : CAT_META[f].label}
          </button>
        ))}
        {brief && <span style={{ fontSize: 13, color: "#9ca3af", alignSelf: "center", marginLeft: 4 }}>{filtered.length} items</span>}
      </div>

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[160, 140, 180, 150, 165].map((h, i) => (
            <div key={i} style={{ height: h, borderRadius: 12, background: "#f3f4f6", animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
        </div>
      )}

      {error && !loading && (
        <div style={{ textAlign: "center", padding: "3rem 0", color: "#6b7280" }}>
          <p style={{ marginBottom: 16 }}>Could not load — {error}</p>
          <button onClick={load} style={{ fontSize: 13, padding: "8px 18px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer" }}>Try again</button>
        </div>
      )}

      {brief && !loading && (
        <>
          {filter === "all" && <ChartPanel items={brief.items} />}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((item, i) => <Card key={i} item={item} />)}
          </div>
        </>
      )}
    </main>
  );
}
