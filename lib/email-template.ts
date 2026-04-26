import { Brief, BriefItem, Category } from "./brief";

const categoryColors: Record<Category, { bg: string; text: string; label: string }> = {
  model:    { bg: "#dbeafe", text: "#1e40af", label: "Models & APIs" },
  research: { bg: "#dcfce7", text: "#166534", label: "Research" },
  tools:    { bg: "#fef9c3", text: "#854d0e", label: "Tools & Infra" },
  industry: { bg: "#f3f4f6", text: "#374151", label: "Industry" },
};

function itemCard(item: BriefItem): string {
  const c = categoryColors[item.category] || categoryColors.industry;
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;background:#ffffff;">
    <tr>
      <td style="padding:20px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
          <tr>
            <td style="font-size:15px;font-weight:600;color:#111827;line-height:1.4;padding-right:12px;">${item.title}</td>
            <td align="right" valign="top" style="white-space:nowrap;">
              <span style="display:inline-block;font-size:11px;padding:3px 10px;border-radius:20px;background:${c.bg};color:${c.text};font-weight:500;">${c.label}</span>
            </td>
          </tr>
        </table>
        <p style="font-size:14px;color:#4b5563;line-height:1.7;margin:0 0 12px;">${item.summary}</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="border-top:1px solid #f3f4f6;padding-top:10px;">
              <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0;">
                <span style="font-weight:600;color:#374151;">Why it matters to you — </span>${item.relevance}
              </p>
            </td>
          </tr>
        </table>
        <p style="font-size:11px;color:#9ca3af;margin:10px 0 0;">${item.source}</p>
      </td>
    </tr>
  </table>`;
}

function categorySummaryChart(brief: Brief): string {
  const counts: Record<string, number> = { model: 0, research: 0, tools: 0, industry: 0 };
  brief.items.forEach(i => { if (counts[i.category] !== undefined) counts[i.category]++; });
  const total = brief.items.length || 1;
  const bars = Object.entries(counts).map(([cat, count]) => {
    if (!count) return "";
    const c = categoryColors[cat as Category];
    const width = Math.round((count / total) * 280);
    const pct = Math.round((count / total) * 100);
    return `
    <tr>
      <td style="font-size:12px;color:#6b7280;padding:4px 10px 4px 0;white-space:nowrap;width:90px;">${c.label}</td>
      <td style="padding:4px 8px 4px 0;">
        <div style="width:${width}px;height:16px;background:${c.bg};border-radius:4px;"></div>
      </td>
      <td style="font-size:12px;color:#374151;font-weight:500;padding:4px 0;">${count} item${count !== 1 ? "s" : ""} (${pct}%)</td>
    </tr>`;
  }).join("");

  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #e5e7eb;border-radius:12px;background:#f9fafb;">
    <tr><td style="padding:20px 24px;">
      <p style="font-size:13px;font-weight:600;color:#374151;margin:0 0 14px;">Today's breakdown</p>
      <table cellpadding="0" cellspacing="0">${bars}</table>
    </td></tr>
  </table>`;
}

export function buildEmailHtml(brief: Brief): string {
  const grouped: Record<string, BriefItem[]> = {};
  brief.items.forEach(item => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  const categoryOrder: Category[] = ["model", "research", "tools", "industry"];
  let sections = "";
  categoryOrder.forEach(cat => {
    if (!grouped[cat]?.length) return;
    const c = categoryColors[cat];
    sections += `
    <tr><td style="padding:8px 0 12px;">
      <p style="font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${c.text};margin:0 0 10px;">${c.label}</p>
      ${grouped[cat].map(itemCard).join("")}
    </td></tr>`;
  });

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="background:#111827;border-radius:12px 12px 0 0;padding:28px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <p style="font-size:22px;font-weight:700;color:#ffffff;margin:0;">AI Daily Brief</p>
                <p style="font-size:13px;color:#9ca3af;margin:4px 0 0;">${brief.date}</p>
              </td>
              <td align="right">
                <span style="font-size:11px;background:#374151;color:#d1d5db;padding:4px 10px;border-radius:20px;">${brief.items.length} developments</span>
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="background:#ffffff;padding:24px 32px;border-radius:0 0 12px 12px;">
          ${categorySummaryChart(brief)}
          <table width="100%" cellpadding="0" cellspacing="0">${sections}</table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;border-top:1px solid #f3f4f6;padding-top:20px;">
            <tr><td style="font-size:12px;color:#9ca3af;">
              Generated by AI Daily · <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://ai-daily.vercel.app"}" style="color:#6b7280;">Open app</a>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
