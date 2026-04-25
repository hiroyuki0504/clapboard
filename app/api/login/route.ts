import { NextResponse } from "next/server";
import { SESSION_COOKIE, createSessionValue } from "@/middleware";

export const dynamic = "force-dynamic";

// デモ用簡易パスワード認証
const PASSWORD = "password";

export async function POST(request: Request) {
  let body: { password?: unknown } | null = null;
  try {
    body = (await request.json()) as { password?: unknown };
  } catch {
    return NextResponse.json(
      { error: "invalid-payload" },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }

  if (body?.password !== PASSWORD) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: { "cache-control": "no-store" } },
    );
  }

  const response = NextResponse.json(
    { ok: true },
    { status: 200, headers: { "cache-control": "no-store" } },
  );
  response.cookies.set({
    name: SESSION_COOKIE,
    value: await createSessionValue(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7日
  });
  return response;
}
