"use client";

import { LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
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
        setError("パスワードが一致しません。");
        return;
      }

      if (response.status === 413) {
        setError("入力が大きすぎます。");
        return;
      }

      if (response.status === 503) {
        setError("ログイン設定が未完了です。管理者に確認してください。");
        return;
      }

      if (!response.ok) {
        setError("ログインに失敗しました。もう一度お試しください。");
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
        Password
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 h-11 w-full rounded-md border border-[#c8c0b4] bg-[#fbfaf5] px-3 text-sm text-[#312d27] outline-none focus:border-[#c95d3a] focus:ring-2 focus:ring-[#c95d3a]/15"
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
      <Button type="submit" className="h-11 w-full" disabled={submitting || !password}>
        <LockKeyhole className="h-4 w-4" aria-hidden />
        {submitting ? "確認中..." : "ログイン"}
      </Button>
    </form>
  );
}
