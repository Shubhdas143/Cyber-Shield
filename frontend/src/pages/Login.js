import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Lock, User, Loader2, Info } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AshokaLine } from "@/components/AshokaLine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [officerId, setOfficerId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) navigate("/", { replace: true });

  const submit = async (e) => {
    e.preventDefault();
    if (!officerId || !password) { toast.error("Enter Officer ID and password"); return; }
    setLoading(true);
    const res = await login(officerId.trim(), password);
    setLoading(false);
    if (res.ok) { toast.success("Authenticated"); navigate("/", { replace: true }); }
    else toast.error(res.error);
  };

  const useDemo = () => { setOfficerId("amroha001"); setPassword("cyber@123"); };

  return (
    <div className="cs-shell grid min-h-screen place-items-center px-4 py-10">
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl border border-[rgba(45,212,191,0.3)] bg-[rgba(45,212,191,0.1)]">
            <Shield size={28} className="text-[var(--cs-primary)]" />
          </div>
          <div className="font-display text-2xl font-bold tracking-[0.16em] text-[var(--cs-text)]">CYBER SHIELD</div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[var(--cs-muted)]">Investigation Suite</div>
        </div>

        <div className="overflow-hidden rounded-[var(--cs-radius-lg)] border border-[var(--cs-border)] bg-[var(--cs-surface)] shadow-[var(--cs-shadow-2)]">
          <AshokaLine />
          <div className="px-7 pb-7 pt-6">
            <h2 className="font-display text-lg font-semibold text-[var(--cs-text)]">Officer Sign In</h2>
            <p className="mt-1 text-xs text-[var(--cs-muted)]">Amroha Cyber Crime Police Station, Uttar Pradesh</p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="officer" className="text-xs text-[var(--cs-muted)]">Officer ID</Label>
                <div className="relative">
                  <User size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cs-muted)]" />
                  <Input id="officer" data-testid="login-officer-input" value={officerId} onChange={(e) => setOfficerId(e.target.value)}
                    placeholder="e.g. amroha001" autoComplete="username"
                    className="border-[var(--cs-border)] bg-[var(--cs-surface-2)] pl-9 text-[var(--cs-text)]" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pwd" className="text-xs text-[var(--cs-muted)]">Password</Label>
                <div className="relative">
                  <Lock size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cs-muted)]" />
                  <Input id="pwd" type="password" data-testid="login-password-input" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" autoComplete="current-password"
                    className="border-[var(--cs-border)] bg-[var(--cs-surface-2)] pl-9 text-[var(--cs-text)]" />
                </div>
              </div>
              <Button type="submit" disabled={loading} data-testid="login-submit-button"
                className="w-full bg-[var(--cs-primary)] font-semibold text-black hover:bg-[#34e6cf]">
                {loading ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Lock size={15} className="mr-2" />}
                {loading ? "Authenticating…" : "Sign In Securely"}
              </Button>
            </form>

            <button onClick={useDemo} data-testid="login-demo-button"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-[var(--cs-radius-sm)] border border-dashed border-[var(--cs-border)] px-3 py-2 text-[11px] text-[var(--cs-muted)] hover:bg-white/5 transition-colors">
              <Info size={13} /> Use demo officer credentials (amroha001 / cyber@123)
            </button>
          </div>
        </div>

        <p className="mt-5 text-center text-[10.5px] leading-relaxed text-[var(--cs-muted)]">
          Authorized use only. All actions are logged. AI-assisted findings are investigative
          leads and must be corroborated through due legal process.
        </p>
      </div>
    </div>
  );
}
