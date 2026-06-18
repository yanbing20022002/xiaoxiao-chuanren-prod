/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, MouseEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Droplet, Trophy, Sparkles, ShieldAlert, Crosshair, RefreshCcw } from "lucide-react";
import { synth } from "../utils/audio";
import confetti from "canvas-confetti";

interface SpiritStoneGameProps {
  onGameComplete: (stars: number) => void;
}

interface Stone {
  id: number;
  color: string;
  name: string;
  x: number;
  y: number;
  active: boolean;
}

interface Target {
  id: number;
  x: number;
  y: number;
  speed: number;
  size: number;
  scanned: boolean;
}

const STONE_TYPES = [
  { color: "#3b82f6", name: "天青灵石" },
  { color: "#10b981", name: "翡翠灵石" },
  { color: "#f59e0b", name: "流金灵石" },
  { color: "#ef4444", name: "朱砂灵石" },
  { color: "#ec4899", name: "绛霞灵石" },
];

export default function SpiritStoneGame({ onGameComplete }: SpiritStoneGameProps) {
  const [stones, setStones] = useState<Stone[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [basketCount, setBasketCount] = useState<number>(0);
  const [bulletsShot, setBulletsShot] = useState<number>(0);
  const [bulletsHit, setBulletsHit] = useState<number>(0);
  const [gameStage, setGameStage] = useState<"intro" | "fishing" | "shooting" | "score">("intro");
  const [timeLeft, setTimeLeft] = useState<number>(15);

  // Initialize stones randomly
  const initFishing = () => {
    synth.playWaterDrop();
    const list: Stone[] = Array.from({ length: 12 }).map((_, i) => {
      const type = STONE_TYPES[i % STONE_TYPES.length];
      return {
        id: i,
        color: type.color,
        name: type.name,
        x: Math.random() * 80 + 10,
        y: Math.random() * 60 + 20,
        active: true,
      };
    });
    setStones(list);
    setBasketCount(0);
    setTimeLeft(15);
    setGameStage("fishing");
  };

  // Click stone to "捞灵石"
  const handleScoopStone = (id: number) => {
    synth.playWaterDrop();
    setStones((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: false } : s))
    );
    setBasketCount((c) => {
      const next = c + 1;
      if (next >= 8) {
        // Complete fishing phase, move to shooting target phase
        setTimeout(() => {
          initShooting();
        }, 600);
      }
      return next;
    });
  };

  // Initialize targets
  const initShooting = () => {
    synth.playChime();
    setGameStage("shooting");
    const list: Target[] = Array.from({ length: 6 }).map((_, i) => ({
      id: i,
      x: -10 - i * 30, // staggered start
      y: Math.random() * 50 + 20,
      speed: Math.random() * 1.5 + 1.2,
      size: Math.random() * 15 + 25,
      scanned: false,
    }));
    setTargets(list);
    setBulletsShot(0);
    setBulletsHit(0);
    setTimeLeft(15);
  };

  // Shared countdown timer
  useEffect(() => {
    if (gameStage !== "fishing" && gameStage !== "shooting") return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          if (gameStage === "fishing") {
            // Transition to shooting
            synth.playChime();
            setGameStage("shooting");
            const list: Target[] = Array.from({ length: 6 }).map((_, i) => ({
              id: i,
              x: -10 - i * 30,
              y: Math.random() * 50 + 20,
              speed: Math.random() * 1.5 + 1.2,
              size: Math.random() * 15 + 25,
              scanned: false,
            }));
            setTargets(list);
            setBulletsShot(0);
            setBulletsHit(0);
            setTimeLeft(15);
          } else if (gameStage === "shooting") {
            setGameStage("score");
          }
          return 0;
        }
        if (t <= 4) {
          synth.playSwipe();
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStage]);

  // Bubble float update simulation loop
  useEffect(() => {
    if (gameStage === "shooting") {
      const interval = setInterval(() => {
        setTargets((prev) => {
          let allCleared = true;
          const next = prev.map((t) => {
            let nextX = t.x + t.speed;
            if (nextX > 110) {
              nextX = -15; // wrap around if not hit
            }
            if (!t.scanned) {
              allCleared = false;
            }
            return { ...t, x: nextX };
          });

          // Auto move to score phase if all bubbles shot out
          return next;
        });
      }, 45);

      return () => clearInterval(interval);
    } else if (gameStage === "fishing") {
      // gentle aquatic drifting motion for stones/bubbles during fishing phase!
      const interval = setInterval(() => {
        setStones((prev) =>
          prev.map((s) => {
            // Slight sway using sine waves and upward floating drift
            const wave = Math.sin(Date.now() * 0.0015 + s.id) * 0.22;
            let nx = s.x + wave;
            let ny = s.y - 0.25; // float gently upwards

            // Re-spawn or wrap-around if floating outside bounds
            if (nx < 4) nx = 92;
            if (nx > 92) nx = 4;
            if (ny < 12) {
              ny = 90; // restart from the bottom
              nx = Math.random() * 80 + 10; // randomize entry column
            }

            return { ...s, x: nx, y: ny };
          })
        );
      }, 40);

      return () => clearInterval(interval);
    }
  }, [gameStage]);

  // Click target to shoot water gun
  const handleShootTarget = (id: number) => {
    synth.playWaterDrop();
    setBulletsShot((s) => s + 1);
    setTargets((prev) =>
      prev.map((t) => {
        if (t.id === id && !t.scanned) {
          synth.playChime();
          setBulletsHit((h) => {
            const nextH = h + 1;
            if (nextH >= 5) {
              setTimeout(() => {
                setGameStage("score");
              }, 600);
            }
            return nextH;
          });
          return { ...t, scanned: true };
        }
        return t;
      })
    );
  };

  // Shot miss (click background container during shooting stage)
  const handleContainerClick = (e: MouseEvent) => {
    if (gameStage !== "shooting") return;
    // prevent register if click actually hit bubble target
    if ((e.target as HTMLElement).closest(".bubble-target")) return;

    synth.playSwipe();
    setBulletsShot((s) => s + 1);
  };

  // Calculate star rating based on scoop rate & hit rate
  const hitRate = bulletsShot > 0 ? Math.round((bulletsHit / bulletsShot) * 100) : 0;
  
  const calculateStars = () => {
    const totalScore = basketCount + bulletsHit;
    if (totalScore >= 13 && hitRate >= 65) return 5;
    if (totalScore >= 10) return 4;
    return 3;
  };

  const handleFinish = () => {
    const stars = calculateStars();
    synth.playChime();
    confetti({
      particleCount: 40,
      spread: 40,
      colors: ["#3b82f6", "#10b981", "#dfb15b"],
    });
    onGameComplete(stars);
  };

  return (
    <div className="w-full bg-stone-950/80 rounded-2xl p-4 border border-blue-900/40 relative overflow-hidden flex flex-col justify-between select-none min-h-[290px]">
      
      {/* Wave glow backdrop */}
      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-950/10 via-transparent to-blue-950/20 pointer-events-none" />

      {/* Intro Stage */}
      {gameStage === "intro" && (
        <div className="text-center py-6 space-y-4 flex-1 flex flex-col justify-center items-center">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Droplet className="w-6 h-6 animate-bounce" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-serif font-bold text-slate-200">
              灵泉水源污染，速往广场御敌！
            </h4>
            <p className="text-[10px] text-stone-400 font-serif max-w-xs mx-auto leading-relaxed">
              第一步：从泡泡潭中搜捞 8 颗【五色灵石】投入乾坤筐；<br />
              第二步：手持灵泉水枪，精确打破 5 个飘拂的【浊气怪泡】！
            </p>
          </div>
          <button
            onClick={initFishing}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:brightness-110 active:scale-95 text-xs font-serif font-semibold tracking-wider rounded-lg transition-all"
          >
            🚀 迎入灵泉守护战
          </button>
        </div>
      )}

      {/* Game Stage 1: Fishing/捞灵石 */}
      {gameStage === "fishing" && (
        <div className="flex-1 flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-center bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 text-[10px] font-serif">
            <span className="text-blue-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
              <span>浮气潭：捞取五色灵石</span>
            </span>
            <div className="flex items-center gap-3">
              <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${timeLeft <= 4 ? "bg-red-500/20 text-red-400 animate-pulse border border-red-500/30" : "bg-blue-500/10 text-cyan-400 border border-blue-500/20"}`}>
                ⏱️ 倒计时 {timeLeft}s
              </span>
              <span className="text-stone-400">
                乾坤筐：
                <span className="text-orange-400 font-bold font-mono">{basketCount}</span> / 8 颗
              </span>
            </div>
          </div>

          {/* Interactive Pool Viewport */}
          <div className="h-44 bg-[#081524] rounded-xl border border-blue-900/60 relative overflow-hidden">
            {/* Animating water waves */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(16,185,129,0.1)_0%,transparent_70%)] animate-pulse pointer-events-none" />

            {stones.map((s) => (
              <AnimatePresence key={s.id}>
                {s.active && (
                  <motion.button
                    onClick={() => handleScoopStone(s.id)}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    style={{ 
                      left: `${s.x}%`,
                      top: `${s.y}%`,
                      backgroundColor: s.color,
                      boxShadow: `0 0 14px ${s.color}b0, inset 0 2.5px 5px rgba(255, 255, 255, 0.7)` 
                    }}
                    className="absolute w-6.5 h-6.5 rounded-full border border-white/60 flex items-center justify-center text-[7.5px] font-extrabold text-white font-serif tracking-widest cursor-pointer hover:scale-115 active:scale-95 transition-transform outline-none select-none"
                  >
                    灵
                  </motion.button>
                )}
              </AnimatePresence>
            ))}

            {basketCount === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-stone-500 font-serif text-[10px] pointer-events-none">
                点击水中漂动的灵石，收纳至乾坤筐
              </div>
            )}
          </div>

          <div className="w-full bg-stone-900 h-1.5 rounded-full overflow-hidden border border-white/5">
            <motion.div
              animate={{ width: `${(basketCount / 8) * 100}%` }}
              className="bg-blue-400 h-full w-0"
            />
          </div>
        </div>
      )}

      {/* Game Stage 2: Target shooting/打标靶 */}
      {gameStage === "shooting" && (
        <div 
          onClick={handleContainerClick}
          className="flex-1 flex flex-col justify-between space-y-3"
        >
          <div className="flex justify-between items-center bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 text-[10px] font-serif">
            <span className="text-red-400 font-bold flex items-center gap-1">
              <Crosshair className="w-3.5 h-3.5 text-red-500 animate-spin" />
              <span>水枪标靶比拼</span>
            </span>
            <div className="flex items-center gap-3">
              <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${timeLeft <= 4 ? "bg-red-500/20 text-red-400 animate-pulse border border-red-500/30" : "bg-red-500/10 text-rose-400 border border-red-500/20"}`}>
                ⏱️ 倒计时 {timeLeft}s
              </span>
              <span className="text-stone-400">
                击中：<span className="text-emerald-400 font-bold font-mono">{bulletsHit}</span> / 5 | 
                射击数：<span className="text-stone-300 font-mono">{bulletsShot}</span>
              </span>
            </div>
          </div>

          {/* Target canvas space */}
          <div className="h-44 bg-[#200a0a]/40 rounded-xl border border-red-950/60 relative overflow-hidden cursor-crosshair">
            <div className="absolute top-2 left-2 text-[8px] text-red-500/80 font-mono uppercase">
              Firing range • Shoot bubble monsters
            </div>

            {targets.map((t) => (
              <AnimatePresence key={t.id}>
                {!t.scanned && (
                  <motion.button
                    onClick={() => handleShootTarget(t.id)}
                    className="bubble-target absolute rounded-full bg-gradient-to-b from-[#e11d48]/40 to-[#9f1239]/80 border border-slate-200/40 cursor-pointer text-[8px] text-white flex items-center justify-center font-serif text-center outline-none"
                    style={{
                      left: `${t.x}%`,
                      top: `${t.y}%`,
                      width: `${t.size}px`,
                      height: `${t.size}px`,
                      boxShadow: "0 4px 10px rgba(225, 29, 72, 0.4)",
                    }}
                  >
                    👾
                  </motion.button>
                )}
              </AnimatePresence>
            ))}

            {bulletsHit >= 5 && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-emerald-400 font-serif text-[11px] font-bold">
                ✓ 浊气泡泡已扫清！
              </div>
            )}
          </div>

          <div className="flex justify-between items-center text-[10px] text-stone-500">
            <span>枪法准度: {hitRate}%</span>
            <span>请连续点击上方漂流的怪兽泡泡</span>
          </div>
        </div>
      )}

      {/* Game Stage 3: Scoring Results */}
      {gameStage === "score" && (
        <div className="text-center py-4 space-y-4 flex-1 flex flex-col justify-center items-center">
          <div className="w-10 h-10 rounded-full bg-[#dfb15b]/10 text-[#dfb15b] border border-[#dfb15b]/30 flex items-center justify-center">
            <Trophy className="w-5 h-5" />
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-serif font-bold text-stone-100">灵泉保卫战·模拟战绩</h4>
            <div className="text-stone-300 text-xs font-serif space-y-1">
              <div>搜罗五色灵石：<span className="text-orange-400 font-bold">{basketCount} 颗</span> {basketCount >= 8 ? <span className="text-emerald-400 font-semibold">(完成)</span> : <span className="text-red-400 font-semibold">(超时未满)</span>}</div>
              <div>击中浊气标靶：<span className="text-[#dfb15b] font-bold">{bulletsHit} 个</span> {bulletsHit >= 5 ? <span className="text-emerald-400 font-semibold">(完成)</span> : <span className="text-red-400 font-semibold">(超时未满)</span>}</div>
              <div>综合狙击精度：<span className="text-cyan-400 font-semibold">{hitRate}%</span></div>
            </div>
            {/* Stars evaluation */}
            <div className="flex gap-1 justify-center text-xl text-orange-400 pt-1">
              {Array.from({ length: calculateStars() }).map((_, i) => (
                <span key={i}>★</span>
              ))}
            </div>
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={() => setGameStage("intro")}
              className="flex-1 py-2 rounded-xl text-[10px] font-serif border border-stone-800 text-stone-400 flex items-center justify-center gap-1"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>重新模拟</span>
            </button>
            <button
              onClick={handleFinish}
              className="flex-1 py-1 bg-gradient-to-r from-orange-400 to-orange-500 text-black font-semibold text-xs rounded-xl tracking-wider uppercase font-serif"
            >
              完成并接收授勋
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
