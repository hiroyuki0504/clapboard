"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
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
        body: JSON.stringify({ password }),
      });

      if (response.status === 401) {
        setError("パスワードが違います。もう一度お試しください。");
        return;
      }

      if (!response.ok) {
        setError("ログインに失敗しました。時間をおいて再試行してください。");
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
        パスワード
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
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
        {submitting ? "確認中..." : "ログイン"}
      </Button>
    </form>
  );
}
