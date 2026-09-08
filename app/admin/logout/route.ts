import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getAdminSession();
  session.destroy();
  return NextResponse.redirect(new URL("/admin/login", req.url));
}
