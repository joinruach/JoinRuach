"use server";

import { NextResponse } from "next/server";
import { getViewerAccessContext } from "@/lib/access-context";

export async function GET() {
  const context = await getViewerAccessContext();
  return NextResponse.json(context);
}
