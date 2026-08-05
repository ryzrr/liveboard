"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AlertCircle, Terminal } from "lucide-react";
import { LiveboardIcon } from "@/components/logo";
import { primaryButtonClass, secondaryButtonClass } from "@/components/landing/button-styles";

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
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <LiveboardIcon size={26} />
          <span className="text-lg font-semibold tracking-tight text-foreground">Liveboard</span>
        </Link>

        <div className="border border-border bg-surface p-8">
          <div className="text-center">
            <h1 className="text-lg font-semibold text-foreground">Sign in to Liveboard</h1>
            <p className="mt-1.5 text-sm text-muted">New here? Signing in creates your workspace automatically.</p>
          </div>

          {error && (
            <div className="mt-6 flex items-start gap-2 border border-red/25 bg-red-dim px-3 py-2.5 text-xs text-red">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.75} />
              <span>{ERROR_MESSAGES[error] ?? "Authentication error. Please try again."}</span>
            </div>
          )}

          <div className="mt-6 space-y-5">
            {hasGoogle && (
              <button onClick={() => signIn("google", { callbackUrl })} className={secondaryButtonClass("md", "w-full")}>
                <GoogleIcon />
                Continue with Google
              </button>
            )}

            {isDev && (
              <div>
                {hasGoogle && (
                  <div className="mb-5 flex items-center gap-3">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-[10px] uppercase tracking-wider text-muted-dark">or</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                )}

                <div className="mb-3 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-dark">
                  <Terminal className="h-3 w-3" strokeWidth={1.75} />
                  Development sign-in
                </div>

                <form onSubmit={handleDevLogin} className="space-y-3">
                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-xs text-muted">
                      Email address
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-dark focus:border-blue"
                    />
                  </div>
                  <div>
                    <label htmlFor="name" className="mb-1.5 block text-xs text-muted">
                      Display name
                    </label>
                    <input
                      id="name"
                      type="text"
                      placeholder="Only needed the first time"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-dark focus:border-blue"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!email || loading}
                    className={primaryButtonClass("md", "w-full disabled:pointer-events-none disabled:opacity-40")}
                  >
                    {loading ? "Signing in…" : "Sign in"}
                  </button>
                </form>

                <p className="mt-3 text-[11px] leading-relaxed text-muted-dark">
                  No password needed in development. This form is hidden in production once Google OAuth is configured.
                </p>
              </div>
            )}

            {!hasGoogle && !isDev && (
              <p className="text-center text-xs text-red">
                Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.
              </p>
            )}
          </div>

          <p className="mt-6 text-center text-[11px] leading-relaxed text-muted-dark">
            By signing in you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <div className="h-[420px] w-full max-w-sm border border-border bg-surface" />
        </div>
      }
    >
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
