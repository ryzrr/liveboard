"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { LiveboardIcon } from "@/components/logo";

const hasGoogle =
  Boolean(process.env.NEXT_PUBLIC_GOOGLE_ENABLED) ||
  false;

const isDev = process.env.NODE_ENV !== "production";

const ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: "Failed to start Google sign-in. Check your OAuth configuration.",
  OAuthCallback: "Google sign-in failed. Please try again.",
  OAuthAccountNotLinked: "This email is linked to a different sign-in method.",
  CredentialsSignin: "Invalid credentials.",
  Configuration: "Auth is not fully configured yet.",
};

function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/overview";
  const error = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleDevLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    await signIn("dev-login", { email, name, callbackUrl });
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <LiveboardIcon size={28} />
          <span className="text-xl font-bold tracking-tight text-[#F5F5F5] font-display">
            Liveboard
          </span>
        </div>

        <div className="rounded-lg border border-[#1E1E1E] bg-[#111] p-8 space-y-6">
          <div className="space-y-1.5 text-center">
            <h1 className="text-lg font-semibold text-[#F5F5F5]">Welcome back</h1>
            <p className="text-sm text-[#555]">Sign in to your Liveboard workspace</p>
          </div>

          {error && (
            <div className="rounded border border-red/20 bg-red-dim px-3 py-2 text-xs text-red">
              {ERROR_MESSAGES[error] ?? "Authentication error. Please try again."}
            </div>
          )}

          {/* Google button — shown when GOOGLE_CLIENT_ID is configured */}
          {hasGoogle && (
            <button
              onClick={() => signIn("google", { callbackUrl })}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded border border-[#2A2A2A] bg-[#161616] hover:bg-[#1E1E1E] hover:border-[#333] transition-colors text-sm font-medium text-[#F5F5F5]"
            >
              <GoogleIcon />
              Continue with Google
            </button>
          )}

          {/* Dev login form — shown in development when Google isn't set up */}
          {isDev && (
            <>
              {hasGoogle && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-[#1E1E1E]" />
                  <span className="text-[10px] text-[#333]">dev login</span>
                  <div className="flex-1 h-px bg-[#1E1E1E]" />
                </div>
              )}
              <form onSubmit={handleDevLogin} className="space-y-3">
                {!hasGoogle && (
                  <div className="rounded border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                    <p className="text-[10px] text-amber-400 leading-relaxed">
                      <span className="font-semibold">Dev mode.</span>{" "}
                      Google OAuth not configured — sign in with any email below.
                      Set <code className="font-mono">GOOGLE_CLIENT_ID</code> to enable Google.
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded border border-[#2A2A2A] bg-[#161616] text-sm text-[#F5F5F5] placeholder-[#333] outline-none focus:border-blue/50 transition-colors"
                  />
                  <input
                    type="text"
                    placeholder="Display name (optional)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-[#2A2A2A] bg-[#161616] text-sm text-[#F5F5F5] placeholder-[#333] outline-none focus:border-blue/50 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!email || loading}
                  className="w-full px-4 py-2.5 rounded bg-blue hover:bg-blue-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium text-white"
                >
                  {loading ? "Signing in…" : "Sign in"}
                </button>
              </form>
            </>
          )}

          {!hasGoogle && !isDev && (
            <p className="text-center text-xs text-red">
              Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.
            </p>
          )}

          <p className="text-center text-[10px] text-[#444] leading-relaxed">
            By signing in you agree to our{" "}
            <span className="text-[#666] hover:text-[#888] cursor-pointer transition-colors">Terms of Service</span>
            {" "}and{" "}
            <span className="text-[#666] hover:text-[#888] cursor-pointer transition-colors">Privacy Policy</span>.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-[#333]">Open source API observability</p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0A]" />}>
      <SignInForm />
    </Suspense>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M15.68 8.18c0-.57-.05-1.11-.14-1.64H8v3.1h4.3a3.67 3.67 0 0 1-1.59 2.41v2h2.57c1.5-1.38 2.4-3.42 2.4-5.87z" fill="#4285F4" />
      <path d="M8 16c2.16 0 3.97-.72 5.29-1.94l-2.57-2c-.72.48-1.63.76-2.72.76-2.09 0-3.86-1.41-4.49-3.31H.86v2.06A8 8 0 0 0 8 16z" fill="#34A853" />
      <path d="M3.51 9.51A4.8 4.8 0 0 1 3.26 8c0-.52.09-1.03.25-1.51V4.43H.86A8 8 0 0 0 0 8c0 1.29.31 2.51.86 3.57l2.65-2.06z" fill="#FBBC05" />
      <path d="M8 3.18c1.18 0 2.23.41 3.07 1.2l2.3-2.3A8 8 0 0 0 .86 4.43L3.51 6.5C4.14 4.59 5.91 3.18 8 3.18z" fill="#EA4335" />
    </svg>
  );
}
