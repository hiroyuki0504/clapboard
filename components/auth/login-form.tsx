"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        credentials: "same-origin",
        body: JSON.stringify({ token }),
      });

      if (response.status === 401) {
        setError("トークンが一致しません。もう一度お試しください。");
        return;
      }

      if (response.status === 403) {
        setError("リクエスト元の検証に失敗しました（CSRF）。再読み込みしてからお試しください。");
        return;
      }

      if (response.status === 429) {
        const retryAfter = response.headers.get("retry-after");
        setError(
          retryAfter
            ? `試行回数の上限に達しました。${retryAfter}秒後に再度お試しください。`
            : "試行回数の上限に達しました。しばらく待ってから再度お試しください。",
        );
        return;
      }

      if (response.status === 503) {
        setError("サインイン機能が一時的に利用できません。管理者に確認してください。");
        return;
      }

      if (response.status === 413) {
        setError("入力が大きすぎます。トークンを確認してください。");
        return;
      }

      if (!response.ok) {
        setError("サインインに失敗しました。時間をおいて再試行してください。");
        return;
      }

      router.replace(redirectTo);
      router.refresh();
    } catch {
      setError("通信エラーが発生しました。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="mt-5 space-y-3" onSubmit={handleSubmit} noValidate>
      <label className="block text-xs font-bold uppercase tracking-[0.14em] text-[#81786d]">
        Access Token
        <input
          type="password"
          autoComplete="off"
          spellCheck={false}
          required
          minLength={16}
          value={token}
          onChange={(event) => setToken(event.target.value)}
          className="mt-2 h-10 w-full rounded-md border border-[#c8c0b4] bg-[#fbfaf5] px-3 font-mono text-sm tracking-wider text-[#312d27] outline-none focus:border-[#c95d3a]"
        />
      </label>
      {error && (
        <p
          role="alert"
          className="rounded-md border border-[#d2a528] bg-[#fff3c8] px-3 py-2 text-xs font-bold leading-5 text-[#6f5415]"
        >
          {error}
        </p>
      )}
      <Button type="submit" className="h-10 w-full" disabled={submitting}>
        {submitting ? "確認中..." : "サインインする"}
      </Button>
    </form>
  );
}
