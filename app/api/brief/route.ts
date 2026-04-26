import { NextResponse } from "next/server";
import { fetchBrief } from "@/lib/brief";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET() {
  try {
    const brief = await fetchBrief();
    return NextResponse.json(brief);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
