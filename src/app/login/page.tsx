"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { accessToken, user } = await api.auth.login(email, password);
      const result = login(accessToken, user);
      if (!result.ok) {
        toast.error(result.error ?? "Login failed.");
      } else {
        router.replace("/dashboard");
      }
    } catch {
      toast.error("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-paper">

      {/* ── Left: Editorial hero panel (ink/dark) ──────────────────────── */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-col justify-between bg-ink p-10 shrink-0">

        {/* Top — wordmark */}
        <div>
          <span
            className="text-2xl font-bold text-paper leading-none"
            style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
          >
            TED<span className="text-red">x</span>
          </span>
          <span className="ml-2 kicker text-faint">Pune · Admin</span>
        </div>

        {/* Middle — display hero */}
        <div>
          <span className="block w-8 h-0.5 bg-red mb-6" />
          <h1
            className="text-[44px] leading-[1.0] tracking-[-1.2px] text-paper font-normal"
            style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
          >
            The pulse of<br />
            the community,<br />
            <em className="text-red not-italic">in your hands.</em>
          </h1>
          <p className="mt-6 text-[14px] leading-relaxed text-slate">
            Approve members. Moderate content.<br />Monitor engagement.
          </p>
        </div>

        {/* Bottom — mono screen tag */}
        <div>
          <p className="kicker text-faint">01 / login · access restricted</p>
          <p className="kicker text-faint mt-1">Members only · invite-verified</p>
        </div>
      </div>

      {/* ── Right: Login form (paper) ───────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-8 py-16">

        {/* Mobile brand (only visible < lg) */}
        <div className="mb-10 text-center lg:hidden">
          <span
            className="text-3xl font-bold text-ink"
            style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
          >
            TED<span className="text-red">x</span>
          </span>
          <span className="ml-2 kicker text-faint align-bottom">Pune Admin</span>
        </div>

        <div className="w-full max-w-sm">
          {/* Section kicker */}
          <span className="rule-red" />
          <p className="kicker text-faint mb-2">01 / login</p>

          <h2
            className="text-[28px] leading-[1.0] tracking-[-0.6px] text-ink mb-8"
            style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
          >
            Welcome back.
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[12px] font-medium text-slate">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@tedxpune.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 bg-mist border-transparent focus:border-ink focus:bg-paper rounded-[10px] text-[14px] text-ink placeholder:text-faint"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[12px] font-medium text-slate">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 bg-mist border-transparent focus:border-ink focus:bg-paper rounded-[10px] text-[14px] text-ink"
                required
                autoComplete="current-password"
              />
            </div>

            {/* Primary CTA — red, one per screen */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-[36px] bg-red hover:bg-red/90 text-paper text-[13px] font-semibold rounded-[8px] mt-2 transition-opacity"
            >
              {loading ? (
                <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Signing in…</>
              ) : (
                <><span>Sign In</span><ArrowRight className="ml-2 h-3.5 w-3.5 stroke-[2]" /></>
              )}
            </Button>
          </form>

          <p className="kicker text-faint text-center mt-6">
            Access restricted to TEDx Pune organizers.
          </p>
        </div>
      </div>
    </div>
  );
}
