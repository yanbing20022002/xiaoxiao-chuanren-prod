import NpcDashboard from "../components/NpcDashboard";
import { GameLevel, LivePhoto, UserPassport } from "../types";

interface NpcPageProps {
  levels: GameLevel[];
  passport: UserPassport;
  photos: LivePhoto[];
  sceneAssets: string[];
  onUpdateScore: (levelId: string, stars: number) => void;
}

export default function NpcPage({ levels, passport, photos, sceneAssets, onUpdateScore }: NpcPageProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050609] text-white">
      <img src={sceneAssets[2]} alt="NPC 评分背景" className="absolute inset-0 h-full w-full object-cover opacity-20" />
      <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(7,8,12,0.88)_0%,rgba(8,8,10,0.94)_45%,rgba(0,0,0,0.98)_100%)]" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-8">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <p className="text-[11px] uppercase tracking-[0.35em] text-red-300/80">Npc Exclusive Console</p>
          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-serif tracking-[0.18em] text-white">真人 NPC 评分控制台</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-300">
                当前页面仅挂载 NPC 评分与点亮逻辑。每一关被现场点亮后，下一关才会在孩子端解锁；评为 5 星时，孩子端触发 2.5 秒金色光柱冲天特效。
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.28em] text-stone-500">Activated</p>
                <p className="mt-2 font-serif text-lg text-amber-100">{passport.activated ? "已激活" : "未激活"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.28em] text-stone-500">Npc Lit</p>
                <p className="mt-2 font-serif text-lg text-amber-100">{passport.npcLitLevels.length} / 5</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.28em] text-stone-500">Photos</p>
                <p className="mt-2 font-serif text-lg text-amber-100">{photos.length}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1">
          <NpcDashboard levels={levels} passport={passport} onUpdateScore={onUpdateScore} />
        </div>
      </div>
    </div>
  );
}
