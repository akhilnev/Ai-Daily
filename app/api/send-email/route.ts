import { NextResponse } from "next/server";
import { Resend } from "resend";
import { fetchBrief } from "@/lib/brief";
import { buildEmailHtml } from "@/lib/email-template";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST() {
  try {
    const recipientEmail = process.env.RECIPIENT_EMAIL;
    if (!recipientEmail) throw new Error("RECIPIENT_EMAIL env var not set");
    const brief = await fetchBrief();
    const html = buildEmailHtml(brief);
    const { data, error } = await resend.emails.send({
      from: "AI Daily <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: `AI Daily Brief — ${brief.date}`,
      html,
    });
    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true, emailId: data?.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
