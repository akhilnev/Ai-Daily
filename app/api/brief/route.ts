import { NextResponse } from "next/server";
import { fetchBrief } from "@/lib/brief";

export const maxDuration = 60;

export async function GET() {
  try {
    const brief = await fetchBrief();
    return NextResponse.json(brief);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
