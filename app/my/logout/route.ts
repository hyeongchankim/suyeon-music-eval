import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getStudentSession();
  session.destroy();
  return NextResponse.redirect(new URL("/", req.url));
}
