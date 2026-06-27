import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { LockKeyhole, LogOut, ShieldCheck } from "lucide-react";
import { synth } from "../utils/audio";
import { createStaffSession, readStaffSession, revokeStaffSession, StaffRole, validateStoredStaffSession } from "../utils/staffAccess";

interface StaffAccessGateProps {
  role: StaffRole;
  title: string;
  description: string;
  accentClassName: string;
  hintLabel: string;
  children: ReactNode;
}

export default function StaffAccessGate({
  role,
  title,
  description,
  accentClassName,
  hintLabel,
  children
}: StaffAccessGateProps) {
  const [session, setSession] = useState(() => readStaffSession(role));
  const [operatorName, setOperatorName] = useState("");
  const [pin, setPin] = useState("");
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void validateStoredStaffSession(role).then((nextSession) => {
      if (cancelled) return;
      setSession(nextSession);
    });

    return () => {
      cancelled = true;
    };
  }, [role]);

  const expiresAtLabel = useMemo(() => {
    if (!session) return "";
    return new Date(session.expiresAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  }, [session]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);

    const result = await createStaffSession(role, pin, operatorName);
    setLoading(false);

    if (!result.ok || !result.session) {
      setFeedback({
        ok: false,
        message: result.message
      });
      synth.playSwipe();
      return;
    }

    setSession(result.session);
    setPin("");
    setFeedback({
      ok: true,
      message: result.message
    });
    synth.playChime();
  };

  const handleLogout = async () => {
    await revokeStaffSession(role);
    setSession(null);
    setPin("");
    setFeedback(null);
    synth.playSwipe();
  };

  if (session) {
    return (
      <div className="relative">
        <div className="pointer-events-none absolute right-6 top-6 z-30 flex justify-end">
          <div className="pointer-events-auto rounded-2xl border border-white/10 bg-black/45 px-4 py-3 backdrop-blur-xl shadow-lg">
            <div className="flex items-center gap-3">
              <ShieldCheck className={`h-4 w-4 ${accentClassName}`} />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.22em] text-stone-500">{hintLabel}</p>
                <p className="text-sm font-serif text-white">{session.operatorName}</p>
                <p className="text-[10px] text-stone-400">本设备授权有效至 {expiresAtLabel}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-stone-300 transition-colors hover:text-white"
              >
                <LogOut className="h-3.5 w-3.5" />
                退出
              </button>
            </div>
          </div>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050609] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_28%),linear-gradient(160deg,#050609_0%,#0c1018_45%,#040404_100%)]" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-[30px] border border-white/10 bg-white/6 p-8 shadow-[0_24px_120px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
              <LockKeyhole className={`h-6 w-6 ${accentClassName}`} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.32em] text-stone-500">{hintLabel}</p>
              <h1 className="mt-2 text-2xl font-serif tracking-[0.18em] text-white">{title}</h1>
            </div>
          </div>
          <p className="mt-5 text-sm leading-7 text-stone-300">{description}</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <input
              type="text"
              value={operatorName}
              onChange={(event) => setOperatorName(event.target.value)}
              placeholder="输入工作人员姓名，例如：03号 NPC"
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-white/30"
            />
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              placeholder="输入工作人员 PIN"
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-white/30"
            />
            {feedback && (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${
                  feedback.ok
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border-red-500/30 bg-red-500/10 text-red-300"
                }`}
              >
                {feedback.message}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm uppercase tracking-[0.24em] text-white transition-colors hover:bg-white/15"
            >
              {loading ? "正在验证身份..." : "进入工作人员后台"}
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-white/8 bg-black/25 p-4 text-xs leading-6 text-stone-400">
            当前收口策略：客户端只公开孩子自己的印信码与客户回到长卷的链接；`npc` 与 `photographer` 均需先在设备上完成工作人员门禁后，才能扫码绑定孩子并执行后台操作。
          </div>
        </div>
      </div>
    </div>
  );
}
