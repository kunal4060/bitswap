import { NextResponse } from "next/server";
import { getUsdtUsdRate } from "@/lib/rates";

export async function GET() {
  const { rate, live } = await getUsdtUsdRate();
  return NextResponse.json({ usdtUsd: rate, live });
}
