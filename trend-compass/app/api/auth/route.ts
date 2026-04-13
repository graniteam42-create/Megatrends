import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { password } = await req.json();
  const appPassword = process.env.APP_PASSWORD;
  const valid = appPassword ? password === appPassword : true;

  if (!valid) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("tc_auth", "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
  return res;
}
