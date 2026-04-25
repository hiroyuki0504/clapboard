import { LoginForm } from "@/components/auth/login-form";
import { sanitizeRedirectPath } from "@/lib/access-token";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string | string[] }>;
}) {
  const params = await searchParams;
  const fromRaw = Array.isArray(params.from) ? params.from[0] : params.from;
  const from = sanitizeRedirectPath(fromRaw);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg border border-[#423c33]/55 bg-[#fffefa] p-6 shadow-sm">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#81786d]">
          ACCESS REQUIRED
        </p>
        <h1 className="mt-2 text-xl font-black tracking-normal text-[#2f2b25]">
          ClawBoard サインイン
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#6f665b]">
          PMが共有しているアクセストークンを入力してください。トークンは HttpOnly Cookie に保存されます。
        </p>
        <LoginForm redirectTo={from} />
      </div>
    </div>
  );
}

