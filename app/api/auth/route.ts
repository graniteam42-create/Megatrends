import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  let password = "";
  try {
    const body = await req.json();
    password = typeof body?.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) {
    logger.warn("APP_PASSWORD not set — allowing all logins (insecure)");
    const res = NextResponse.json({ ok: true });
    setAuthCookie(res, false);
    return res;
  }

  if (password !== appPassword) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  setAuthCookie(res, process.env.NODE_ENV === "production");
  return res;
}

function setAuthCookie(res: NextResponse, secure: boolean) {
  // __Host- prefix requires: secure, path=/, no domain. Only use in production HTTPS.
  const name = secure ? "__Host-tc_auth" : "tc_auth";
  res.cookies.set(name, "1", {
    httpOnly: true,
    secure,
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  // Also set legacy name so existing middleware reads continue to work during rollout.
  if (secure) {
    res.cookies.set("tc_auth", "1", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }
}
