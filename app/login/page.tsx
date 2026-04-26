import { LoginForm } from "@/components/auth/login-form";
import { sanitizeRedirectPath } from "@/lib/auth";

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
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#f4f1e8] px-4 py-8 text-[#312d27]">
      <section className="w-full max-w-[420px] rounded-lg border border-[#c8c0b4] bg-[#fffefa] p-6 shadow-[0_18px_45px_rgba(49,45,39,0.12)]">
        <div className="flex items-center gap-3">
          <img
            src="/icon.png"
            alt=""
            className="h-11 w-11 rounded-md object-cover"
            aria-hidden
          />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#81786d]">
              ClawBoard
            </p>
            <h1 className="mt-1 text-xl font-black tracking-normal text-[#2f2b25]">
              ログイン
            </h1>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-[#6f665b]">
          共有されたパスワードを入力してください。
        </p>
        <LoginForm redirectTo={from} />
      </section>
    </main>
  );
}
