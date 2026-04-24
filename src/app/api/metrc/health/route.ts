import { NextResponse } from "next/server";
import { getMetrcAdapter } from "@/server/metrc/metrc.service";

export async function GET() {
  const adapter = getMetrcAdapter();
  const health = await adapter.healthCheck();

  return NextResponse.json(health);
}
