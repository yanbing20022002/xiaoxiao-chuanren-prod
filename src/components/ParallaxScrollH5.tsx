/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Award, QrCode, Sparkles, MapPin, Camera, 
  Layers, ArrowDown, ChevronRight, HelpCircle, 
  RotateCcw, Sparkle, UserCheck, Shield, Feather, 
  BookOpen, Droplets, Check, X, Sliders, Play, Lock
} from "lucide-react";
import confetti from "canvas-confetti";
import { synth } from "../utils/audio";
import { GameLevel, UserPassport, LivePhoto, LevelStatus, VerifiedFamilySession } from "../types";
import { maskPhone } from "../utils/customerAccess";
import { looksLikeMojibake, repairMojibakeText } from "../utils/textEncoding";

import WorshipShrine from "./WorshipShrine";
import SpiritStoneGame from "./SpiritStoneGame";
import CatchFishGame from "./CatchFishGame";
import BotanicalLibrary from "./BotanicalLibrary";
import LeaderboardRank from "./LeaderboardRank";
import PassportQrCode from "./PassportQrCode";

interface ParallaxScrollH5Props {
  levels: GameLevel[];
  passport: UserPassport;
  photos: LivePhoto[];
  onUpdatePassport: (updated: Partial<UserPassport>) => void;
  onClearScore: () => void;
  lastTriggeredStamp: { levelId: string; stars: number; timestamp: number } | null;
  onCompletedLevelClick?: (level: GameLevel) => void;
  allowDebugControls?: boolean;
  sceneAssets?: string[];
  verifiedFamily?: VerifiedFamilySession | null;
  passportScanPayload?: string;
  customerResumeUrl?: string;
  npcResumeUrl?: string;
  photographerResumeUrl?: string;
  onVerifyCustomerAccess?: (phone: string) => Promise<{ ok: boolean; message: string }>;
  onClearCustomerAccess?: () => void;
  onRestartCustomerActivation?: () => void;
}

export default function ParallaxScrollH5({
  levels,
  passport,
  photos,
  onUpdatePassport,
  onClearScore,
  lastTriggeredStamp,
  onCompletedLevelClick,
  allowDebugControls = true,
  sceneAssets = [],
  verifiedFamily = null,
  passportScanPayload = "",
  customerResumeUrl = "",
  npcResumeUrl = "",
  photographerResumeUrl = "",
  onVerifyCustomerAccess,
  onClearCustomerAccess,
  onRestartCustomerActivation
}: ParallaxScrollH5Props) {
  
  // Tab control: "home" (Map Scroll), "photos" (Growth Wall), "profile" (Passport detailing)
  const [activeTab, setActiveTab] = useState<"map" | "photos" | "passport">("map");
  
  // Game states
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState<string>(passport.childName || "玄羽");
  const [familyInput, setFamilyInput] = useState<string>(passport.familyName || "李");
  const [customMottoInput, setCustomMottoInput] = useState<string>(passport.customMotto || "封一坛陈酿，守护百年家风。");
  const [selectedAvatar, setSelectedAvatar] = useState<string>(passport.avatarStyle || "汉服青衣");
  const [worshipActive, setWorshipActive] = useState<boolean>(false);
  const [verificationPhoneInput, setVerificationPhoneInput] = useState<string>(passport.contactPhone || "");
  const [accessFeedback, setAccessFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  
  // Mini trials interactions
  const [springCleanProgress, setSpringCleanProgress] = useState<number>(0);
  const [identifiedGrains, setIdentifiedGrains] = useState<string[]>([]);
  const [sniffedAromas, setSniffedAromas] = useState<string[]>([]);
  const [sealMeltProgress, setSealMeltProgress] = useState<number>(0);
  
  // Poster popups
  const [showGoldSealOverlay, setShowGoldSealOverlay] = useState<boolean>(false);
  const [overlayLevel, setOverlayLevel] = useState<{ id: string; stars: number } | null>(null);
  const [shaking, setShaking] = useState<boolean>(false);
  const [showPoster, setShowPoster] = useState<boolean>(false);

  // 5-Star special "金柱冲天" full-screen column of light states
  const [goldPillarActive, setGoldPillarActive] = useState<boolean>(false);

  // Parallax Scroller Offset Ref
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollPercent, setScrollPercent] = useState<number>(0);
  const nextUnlockLevel = levels.find((level) => !passport.npcLitLevels.includes(level.id));
  const hasCustomerAccess = Boolean(verifiedFamily?.contactPhone || passport.contactPhone);
  const verifiedFamilyLabelText = repairMojibakeText(passport.familyLabel || verifiedFamily?.familyLabel || "");
  const verifiedContactNameText = repairMojibakeText(passport.contactName || verifiedFamily?.contactName || "");
  const safeVerifiedFamilyLabel = verifiedFamilyLabelText && !looksLikeMojibake(verifiedFamilyLabelText)
    ? verifiedFamilyLabelText
    : "已核验家庭";
  const safeVerifiedContactName = verifiedContactNameText && !looksLikeMojibake(verifiedContactNameText)
    ? verifiedContactNameText
    : "已核验联系人";

  useEffect(() => {
    if (passport.contactPhone) {
      setVerificationPhoneInput(passport.contactPhone);
    }
  }, [passport.contactPhone]);

  // Catch NPC WebSocket Star Trigger
  useEffect(() => {
    if (lastTriggeredStamp) {
      setOverlayLevel({ id: lastTriggeredStamp.levelId, stars: lastTriggeredStamp.stars });
      setShowGoldSealOverlay(true);
      setShaking(true);
      
      // Play deep stamp bang
      synth.playGoldSealStamp();

      // Trigger spectacular "金柱冲天" effect if NPC clicked 5 stars
      if (lastTriggeredStamp.stars === 5) {
        setGoldPillarActive(true);
        setTimeout(() => {
          setGoldPillarActive(false);
        }, 2500);
      }

      // Explode pristine gold spark particles
      setTimeout(() => {
        const duration = 2500;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 25, spread: 360, ticks: 50, zIndex: 100 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(() => {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 40 * (timeLeft / duration);
          // Splendid gold sparks confetti
          confetti(Object.assign({}, defaults, { 
            particleCount, 
            origin: { x: randomInRange(0.1, 0.3), y: randomInRange(0.3, 0.7) },
            colors: ['#dfb15b', '#fce8b2', '#b88c3a']
          }));
          confetti(Object.assign({}, defaults, { 
            particleCount, 
            origin: { x: randomInRange(0.7, 0.9), y: randomInRange(0.3, 0.7) },
            colors: ['#dfb15b', '#df805b', '#f9f9fb']
          }));
        }, 220);
      }, 300);

      const shakeTimeout = setTimeout(() => {
        setShaking(false);
      }, 700);

      return () => {
        clearTimeout(shakeTimeout);
      };
    }
  }, [lastTriggeredStamp]);

  // Parallax calculations
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) return;
    const percent = el.scrollTop / maxScroll;
    setScrollPercent(percent);
  };

  const handleRegisterPassport = (e: FormEvent) => {
    e.preventDefault();
    if (!nameInput || !familyInput) return;
    synth.playChime();
    setWorshipActive(true);
  };

  const handleFinalWorshipPublish = () => {
    onUpdatePassport({
      rosterFamilyId: passport.rosterFamilyId,
      familyLabel: passport.familyLabel,
      contactName: passport.contactName,
      contactPhone: passport.contactPhone,
      childName: nameInput,
      familyName: familyInput,
      customMotto: customMottoInput,
      avatarStyle: selectedAvatar,
      activated: true
    });
    synth.playChime();
    setWorshipActive(false);
    setActiveTab("map");
  };

  const handleVerifyAccess = async (event: FormEvent) => {
    event.preventDefault();
    if (!onVerifyCustomerAccess) return;

    const result = await onVerifyCustomerAccess(verificationPhoneInput);
    setAccessFeedback(result);

    if (result.ok) {
      synth.playChime();
      return;
    }

    synth.playSwipe();
  };

  const handleResetCustomerAccess = () => {
    setVerificationPhoneInput("");
    setAccessFeedback(null);
    setWorshipActive(false);
    onClearCustomerAccess?.();
    synth.playSwipe();
  };

  // Micro game 02: Clean spring water
  const handleSpringSplash = () => {
    synth.playWaterDrop();
    setSpringCleanProgress(prev => {
      const next = Math.min(prev + 20, 100);
      if (next === 100) {
        synth.playChime();
      }
      return next;
    });
  };

  // Micro game 03: grain checklist identification
  const toggleGrainSelection = (grain: string) => {
    synth.playSwipe();
    setIdentifiedGrains(prev => {
      if (prev.includes(grain)) {
        return prev.filter(g => g !== grain);
      } else {
        const next = [...prev, grain];
        if (next.length === 3) {
          synth.playChime();
        }
        return next;
      }
    });
  };

  // Micro game 04: scent jars checklist
  const toggleScentSelection = (scent: string) => {
    synth.playChime();
    setSniffedAromas(prev => {
      if (prev.includes(scent)) {
        return prev.filter(s => s !== scent);
      } else {
        return [...prev, scent];
      }
    });
  };

  // Micro game 05: Firewax Melter
  const handleMeltPress = () => {
    synth.playGoldSealStamp();
    setSealMeltProgress(prev => {
      const next = Math.min(prev + 25, 100);
      if (next === 100) {
        synth.playChime();
      }
      return next;
    });
  };

  // Save specific mini game completion
  const handleCompleteTrial = (levelId: string) => {
    synth.playChime();
    const mockStars = levelId === "02" && springCleanProgress === 100 ? 5 
                    : levelId === "03" && identifiedGrains.length >= 3 ? 5
                    : levelId === "04" && sniffedAromas.length >= 2 ? 4
                    : levelId === "05" && sealMeltProgress === 100 ? 5
                    : 3;
    
    // Automatically trigger stamp overlay mimicking instant save
    setOverlayLevel({ id: levelId, stars: mockStars });
    setShowGoldSealOverlay(true);
    setShaking(true);
    synth.playGoldSealStamp();

    setTimeout(() => {
      setShaking(false);
      // Trigger passport state update
      const updatedHistory = { ...passport.scoreHistory, [levelId]: mockStars };
      onUpdatePassport({
        scoreHistory: updatedHistory
      });
    }, 750);

    setSelectedLevelId(null);
  };

  const handleInteractiveComplete = (levelId: string, stars: number) => {
    synth.playGoldSealStamp();
    setOverlayLevel({ id: levelId, stars });
    setShowGoldSealOverlay(true);
    setShaking(true);

    if (stars === 5) {
      setGoldPillarActive(true);
      setTimeout(() => {
        setGoldPillarActive(false);
      }, 2500);
    }

    const updatedHistory = { ...passport.scoreHistory, [levelId]: stars };
    onUpdatePassport({
      scoreHistory: updatedHistory
    });

    setTimeout(() => {
      setShaking(false);
    }, 700);

    setSelectedLevelId(null);
  };

  const getStyleThemeColor = () => {
    switch (passport.avatarStyle) {
      case "汉服赤袍": return "from-[#df5b5b] to-[#a32222] text-[#ffc5c5]";
      case "汉服玄衣": return "from-[#333] to-[#111] text-[#ffd700]";
      case "汉服金羽": return "from-[#e4bd70] to-[#8d6722] text-black";
      default: return "from-cyan-800 to-slate-900 text-[#e0f7fa]";
    }
  };

  const handleLevelClick = (level: GameLevel) => {
    if (level.status === LevelStatus.LOCKED) {
      synth.playSwipe();
      return;
    }

    synth.playChime();
    if (level.status === LevelStatus.COMPLETED && onCompletedLevelClick) {
      onCompletedLevelClick(level);
      return;
    }
    setSelectedLevelId(level.id);
  };

  return (
    <div className="relative w-full h-[760px] max-w-[410px] mx-auto bg-[#020205] text-white rounded-[36px] border-4 border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col font-sans select-none dynamic-glass-glow">
      
      {/* Top Status ambient Header representing noble Chinese brand */}
      <div className="absolute top-0 inset-x-0 z-30 px-6 py-3.5 bg-gradient-to-b from-black/80 to-transparent pointer-events-none flex justify-between items-center text-[10px] tracking-[0.2em] font-serif text-slate-400">
        <span className="flex items-center gap-1.5 text-orange-400 animate-pulse">
          <Sparkle className="w-3 h-3 fill-orange-400" />
          <span>小小封藏传人</span>
        </span>
        <span className="font-mono text-slate-500">LIVE RITUALS</span>
      </div>

      {passport.activated && hasCustomerAccess && onRestartCustomerActivation && (
        <div className="absolute right-4 top-12 z-[35]">
          <button
            type="button"
            onClick={onRestartCustomerActivation}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-[10px] tracking-[0.16em] text-stone-200 backdrop-blur-xl transition-colors hover:text-white"
          >
            <RotateCcw className="h-3 w-3" />
            重走激活仪式
          </button>
        </div>
      )}

      {/* Main body viewport */}
      <div className="mobile-safe-content flex-1 overflow-hidden relative pt-8">
        
        {/* BACKGROUND 3D PARALLAX SIMULATION FOR INNER SCREEN */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {/* Layer 1: Stars / deep night gradient */}
          <div className="absolute inset-0 bg-[#09090b] bg-[radial-gradient(circle_at_50%_120%,rgba(223,177,91,0.06)_0%,transparent_60%)]" />
          {sceneAssets[0] && (
            <div
              className="absolute inset-0 opacity-18 bg-cover bg-center mix-blend-screen"
              style={{ backgroundImage: `url(${sceneAssets[0]})`, transform: `translate3d(0, ${scrollPercent * -30}px, 0) scale(1.12)` }}
            />
          )}
          
          {/* Layer 2: Misty Ink mountain ranges that move relative to scroll percent */}
          <div 
            style={{ transform: `translateY(${scrollPercent * 80}px)` }}
            className="absolute bottom-0 left-0 right-0 h-96 opacity-10 transition-transform duration-300 ease-out"
          >
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full fill-stone-300">
              <path d="M 0 100 L 0 50 Q 20 20 40 60 T 80 40 Q 90 70 100 50 L 100 100 Z" />
            </svg>
          </div>
          
          {/* Layer 3: Dynamic high gold floating haze dust */}
          <div 
            style={{ transform: `translateY(${scrollPercent * 180}px) rotate(${scrollPercent * 15}deg)` }}
            className="absolute inset-0 opacity-20 pointer-events-none transition-transform duration-500 ease-out"
          >
            <div className="absolute top-20 left-10 w-2.5 h-2.5 rounded-full bg-[#dfb15b] filter blur-[1px] animate-pulse" />
            <div className="absolute top-48 right-16 w-1.5 h-1.5 rounded-full bg-white filter blur-[0.5px]" />
            <div className="absolute top-96 left-32 w-3.5 h-3.5 rounded-full bg-[#dfb15b] filter blur-[2px]" />
          </div>
        </div>

        {/* COMPONENT ROUTING ENGINE */}
        <AnimatePresence mode="wait">
          
          {/* NOT REGISTERED YET / PASSPORT HUB */}
          {!passport.activated ? (
            <motion.div
              key="passport-registration"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              className="absolute inset-0 z-20 flex flex-col justify-between p-6 bg-[#0a0a0c]/95 overflow-y-auto"
            >
              {!hasCustomerAccess ? (
                <div className="space-y-6 pt-4">
                  <div className="text-center space-y-2">
                    <span className="text-[10px] tracking-[0.3em] font-mono text-stone-500 block uppercase">Family Check-In</span>
                    <h2 className="text-2xl font-serif tracking-widest text-[#dfb15b] font-medium">家庭团手机号验团</h2>
                    <div className="h-[1px] bg-gradient-to-r from-transparent via-[#dfb15b]/30 to-transparent w-32 mx-auto mt-2" />
                    <p className="mx-auto max-w-xs text-[11px] leading-6 text-stone-400">
                      仅已录入本场家庭团名单的手机号可进入游戏系统。请在报到处完成核验后，再为孩子激活传人护照。
                    </p>
                  </div>

                  <form onSubmit={handleVerifyAccess} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-serif tracking-widest text-stone-400 block">报名手机号</label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={11}
                        value={verificationPhoneInput}
                        onChange={(e) => setVerificationPhoneInput(e.target.value.replace(/\D/g, "").slice(0, 11))}
                        placeholder="请输入报团登记手机号"
                        className="w-full bg-stone-900 border border-stone-800 focus:border-[#dfb15b]/80 rounded px-3 py-3 text-center font-mono text-base text-[#dfb15b] outline-none tracking-[0.18em]"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-[10px] text-stone-500">
                      <div className="rounded-xl border border-stone-800 bg-stone-950/80 px-3 py-3">
                        <p className="font-mono uppercase tracking-[0.2em] text-stone-600">Roster Gate</p>
                        <p className="mt-2 leading-5">命中预录入家庭名单后，才开放当前终端的护照激活入口。</p>
                      </div>
                      <div className="rounded-xl border border-stone-800 bg-stone-950/80 px-3 py-3">
                        <p className="font-mono uppercase tracking-[0.2em] text-stone-600">Onsite Check-In</p>
                        <p className="mt-2 leading-5">不在名单内的手机号无法直接进入，请由前台核对团单后处理。</p>
                      </div>
                    </div>

                    {accessFeedback && (
                      <div
                        className={`rounded-xl border px-3 py-3 text-[11px] leading-5 ${
                          accessFeedback.ok
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                            : "border-red-500/30 bg-red-500/10 text-red-300"
                        }`}
                      >
                        {accessFeedback.message}
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-[#dfb15b] hover:bg-white text-black font-semibold text-xs uppercase tracking-widest rounded transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-[#dfb15b]/10"
                      >
                        <Shield className="w-4 h-4" />
                        核验手机号 • 进入报到
                      </button>
                    </div>
                  </form>
                </div>
              ) : worshipActive ? (
                <WorshipShrine
                  familyName={familyInput}
                  childName={nameInput}
                  motto={customMottoInput}
                  avatarStyle={selectedAvatar}
                  onWorshipComplete={handleFinalWorshipPublish}
                />
              ) : (
                <div className="space-y-6 pt-4">
                  <div className="text-center space-y-2">
                    <span className="text-[10px] tracking-[0.3em] font-mono text-stone-500 block uppercase">Passport Activation</span>
                    <h2 className="text-2xl font-serif tracking-widest text-[#dfb15b] font-medium">唤醒传人印记</h2>
                    <div className="h-[1px] bg-gradient-to-r from-transparent via-[#dfb15b]/30 to-transparent w-32 mx-auto mt-2" />
                  </div>

                  <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-300">Verified Family</p>
                        <h3 className="text-sm font-serif text-stone-100">{safeVerifiedFamilyLabel}</h3>
                        <p className="text-[11px] leading-5 text-stone-400">
                          联系人：{safeVerifiedContactName} · 手机号：{maskPhone(passport.contactPhone || verifiedFamily?.contactPhone || "")}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetCustomerAccess}
                        className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] tracking-[0.18em] text-stone-300 transition-colors hover:text-white"
                      >
                        切换家庭
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleRegisterPassport} className="space-y-4">
                    {/* Clan Lineage Name Inputs */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-serif tracking-widest text-stone-400 block">家族姓氏 (Surname)</label>
                        <input
                          type="text"
                          maxLength={2}
                          value={familyInput}
                          onChange={(e) => { setFamilyInput(e.target.value); synth.playSwipe(); }}
                          placeholder="王"
                          className="w-full bg-stone-900 border border-stone-800 focus:border-[#dfb15b]/80 rounded px-3 py-2 text-center font-serif text-lg text-[#dfb15b] outline-none"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-serif tracking-widest text-stone-400 block">传人名讳 (Given Name)</label>
                        <input
                          type="text"
                          maxLength={4}
                          value={nameInput}
                          onChange={(e) => { setNameInput(e.target.value); synth.playSwipe(); }}
                          placeholder="玄羽"
                          className="w-full bg-stone-900 border border-stone-800 focus:border-[#dfb15b]/80 rounded px-3 py-2 text-center font-serif text-lg text-[#dfb15b] outline-none"
                          required
                        />
                      </div>
                    </div>

                    {/* Chinese custom clan motto */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-serif tracking-widest text-stone-400 block">封藏家训 / 家族箴言：</label>
                      <textarea
                        rows={2}
                        maxLength={60}
                        value={customMottoInput}
                        onChange={(e) => setCustomMottoInput(e.target.value)}
                        placeholder="修身齐家，封岁月一樽，承百年德范。"
                        className="w-full bg-stone-900 border border-stone-800 focus:border-[#dfb15b]/80 rounded px-3 py-2 text-xs font-serif text-stone-300 leading-relaxed outline-none resize-none"
                      />
                    </div>

                    {/* Costume avatar select */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-serif tracking-widest text-stone-400 block">定制仪式华服 (Cloak selection)：</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { name: "汉服青衣", desc: "青峰竹隐 • 雅致淡然", border: "border-cyan-800", text: "text-cyan-400" },
                          { name: "汉服玄衣", desc: "金泥乌漆 • 皇家威严", border: "border-stone-800", text: "text-amber-500" },
                          { name: "汉服赤袍", desc: "火漆朱泥 • 热烈喜瑞", border: "border-red-950", text: "text-red-400" }
                        ].map((av) => (
                          <button
                            key={av.name}
                            type="button"
                            onClick={() => { setSelectedAvatar(av.name); synth.playSwipe(); }}
                            className={`p-2.5 rounded border text-left flex flex-col justify-between h-20 transition-all ${
                              selectedAvatar === av.name
                                ? "bg-[#dfb15b]/10 border-[#dfb15b]"
                                : "bg-stone-950 border-stone-800/80 hover:border-stone-700"
                            }`}
                          >
                            <span className={`text-[11px] font-serif font-bold ${av.text}`}>
                              {av.name}
                            </span>
                            <span className="text-[8px] text-stone-500 leading-tight block truncate">
                              {av.desc}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-[#dfb15b] hover:bg-white text-black font-semibold text-xs uppercase tracking-widest rounded transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-[#dfb15b]/10"
                      >
                        <UserCheck className="w-4 h-4" />
                        唤醒护照 • 开启传人
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Physical Passport mockup visual footer */}
              {!worshipActive && (
                <div className="border border-stone-800/80 p-3 bg-stone-950 rounded flex gap-2.5 items-center">
                  <span className="p-2 bg-[#dfb15b]/5 text-[#dfb15b] rounded border border-[#dfb15b]/10">
                    <Shield className="w-5 h-5 animate-pulse" />
                  </span>
                  <p className="text-[9px] text-stone-500 font-serif leading-relaxed">
                    提示：需先通过家庭团手机号核验，系统才会开放护照激活。激活后将生成专属实时护照码，可在2天1夜的各实景关卡出示给真人 NPC 授勋。
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            <>
              {/* PAGE MAIN PORTALS: MAP TIMELINE */}
              {activeTab === "map" && (
                <div 
                  ref={scrollContainerRef}
                  onScroll={handleScroll}
                  className="mobile-safe-scroll absolute inset-0 overflow-y-auto px-4 space-y-6 z-10 scroll-smooth"
                >
                  
                  {/* Decorative Family Linage Title top-bento */}
                  <div className="bg-stone-950/80 backdrop-blur-md rounded-xl p-4 border border-stone-900 flex justify-between items-center mt-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#dfb15b] to-yellow-600 font-serif text-black font-bold text-center flex items-center justify-center shadow-md">
                        {passport.familyName}
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-mono text-stone-500 uppercase tracking-wider">Lineage Name</span>
                        <h4 className="font-serif text-xs text-stone-300">
                          {passport.familyName}氏传人：
                          <span className="text-[#dfb15b] font-bold font-serif">{passport.childName}</span>
                        </h4>
                      </div>
                    </div>

                    <div className="flex gap-1.5 items-center">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-[9px] text-[#dfb15b] font-serif border border-[#dfb15b]/30 bg-[#dfb15b]/5 px-2 py-0.5 rounded-full">
                        {passport.avatarStyle}
                      </span>
                    </div>
                  </div>

                  {/* Parallax Long Scroll Indicator / Timeline introduction banner */}
                  <div className="text-center py-2 relative">
                    <span className="text-[9px] font-serif text-stone-400 tracking-[0.25em] uppercase block">
                      - 向 下 滑 动 探 寻 时 间 (Scroll Time Scroll) -
                    </span>
                    <motion.div
                      animate={{ y: [0, 4, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="inline-block mt-1 text-[#dfb15b]"
                    >
                      <ArrowDown className="w-3.5 h-3.5 mx-auto" />
                    </motion.div>
                  </div>

                  {/* 3D PARALLAX SCROLL TIMELINE ROAD */}
                  <div className="relative pl-10 pr-2 py-4 space-y-12 z-10">
                    {/* Golden backbone axis link */}
                    <div className="absolute left-[24.5px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-[#dfb15b] via-amber-800 to-[#dfb15b]/10 z-10" />

                    {/* Scenic Illustrated hand-drawn map background */}
                    <div className="absolute inset-x-0 top-0 bottom-0 pointer-events-none overflow-hidden select-none z-0 opacity-40">
                      <svg className="absolute inset-0 w-full h-full min-h-[900px]" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                        <defs>
                          <radialGradient id="temple-glow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#dfb15b" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                          </radialGradient>
                        </defs>

                        {/* Winding mountain paths linking stages */}
                        <path d="M 24,80 C 120,130 180,210 24,250 C -40,280 80,360 24,420 C -20,460 140,540 24,590 C -30,640 120,720 24,760" fill="none" stroke="#dfb15b" strokeWidth="2" strokeDasharray="5,7" className="opacity-40" />

                        {/* Traditional Chinese cloud SVGs at height tiers */}
                        <g className="opacity-20 fill-amber-400/30">
                          <path d="M 60,110 Q 70,100 85,105 Q 100,90 115,105 Q 125,100 135,110 Z" />
                          <path d="M 170,310 Q 180,300 195,305 Q 210,290 225,305 Z" />
                          <path d="M 40,520 Q 50,510 65,515 Q 80,500 95,515 Z" />
                        </g>

                        {/* Miniature hand-drawn site coordinate badges */}
                        {/* Node 1: 太真先祖殿 - Pagoda cap */}
                        <g transform="translate(24, 40)" className="opacity-30">
                          <circle cx="0" cy="0" r="16" fill="url(#temple-glow)" />
                          <path d="M -8,6 L -8,0 L 0,-8 L 8,0 L 8,6 Z" stroke="#dfb15b" strokeWidth="1" fill="none" />
                          <line x1="-12" y1="6" x2="12" y2="6" stroke="#dfb15b" strokeWidth="1.5" />
                        </g>

                        {/* Node 2: 天酿广场 - Spring ripples */}
                        <g transform="translate(24, 185)" className="opacity-30">
                          <circle cx="0" cy="0" r="14" fill="url(#temple-glow)" />
                          <circle cx="0" cy="0" r="8" fill="none" stroke="#22d3ee" strokeWidth="1" />
                          <path d="M -12,3 Q -6,1 0,3 T 12,3" fill="none" stroke="#22d3ee" strokeWidth="1" />
                        </g>

                        {/* Node 3: 泰安作坊 - Wheat & pool */}
                        <g transform="translate(24, 325)" className="opacity-30">
                          <circle cx="0" cy="0" r="14" fill="url(#temple-glow)" />
                          <path d="M -8,-6 H 8 V -4 H -8 Z" fill="#dfb15b" />
                          <circle cx="0" cy="2" r="3" fill="#dfb15b" />
                        </g>

                        {/* Node 4: 百草阁 - Herbal leaf */}
                        <g transform="translate(24, 475)" className="opacity-30">
                          <circle cx="0" cy="0" r="14" fill="url(#temple-glow)" />
                          <path d="M 0,8 Q -4,2 -6,-3 T -4,-9 Q 0,-3 0,8" fill="none" stroke="#10b981" strokeWidth="1" />
                          <path d="M 0,8 Q 4,2 6,-3 T 4,-9 Q 0,-3 0,8" fill="none" stroke="#10b981" strokeWidth="1" />
                        </g>

                        {/* Node 5: 封坛大古窖 - Cellar dome */}
                        <g transform="translate(24, 635)" className="opacity-30">
                          <circle cx="0" cy="0" r="15" fill="none" stroke="#ef4444" strokeWidth="1" />
                          <path d="M -10,6 A 10,10 0 0,1 10,6 Z" stroke="#dfb15b" strokeWidth="1.2" fill="none" />
                        </g>
                      </svg>
                    </div>

                    {levels.map((lvl, index) => {
                      const starRating = passport.scoreHistory[lvl.id] ?? lvl.stars;
                      const isCompleted = lvl.status === LevelStatus.COMPLETED;
                      const isActive = lvl.status === LevelStatus.ACTIVE;
                      const isLocked = lvl.status === LevelStatus.LOCKED;
                      const sequenceNo = index + 1;

                      return (
                        <motion.div
                          key={lvl.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true, margin: "-40px" }}
                          transition={{ delay: index * 0.1, duration: 0.5 }}
                          className="relative"
                        >
                          {/* Drifting Clouds Mist Overlay inside Locked nodes */}
                          <AnimatePresence>
                            {isLocked && (
                              <motion.div
                                initial={{ opacity: 1 }}
                                animate={{ opacity: 0.96 }}
                                exit={{ 
                                  opacity: 0,
                                  scale: 1.35,
                                  filter: "blur(15px)",
                                  x: index % 2 === 0 ? 90 : -90,
                                  transition: { duration: 0.85, ease: "easeOut" }
                                }}
                                className="absolute inset-0 z-30 rounded-xl bg-gradient-to-br from-[#160a0a]/96 via-[#130d13]/98 to-[#0c0c11]/98 border border-red-500/35 flex flex-col items-center justify-center p-3 text-center cursor-not-allowed select-none overflow-hidden shadow-2xl"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  synth.playSwipe(); // Play a small whoosh
                                }}
                              >
                                {/* Floating cloud vapor background nodes */}
                                <div className="absolute inset-0 flex items-center justify-around opacity-30 pointer-events-none">
                                  <motion.div 
                                    animate={{ x: [-15, 15, -15], y: [-6, 6, -6] }}
                                    transition={{ repeat: Infinity, duration: 5 + index, ease: "easeInOut" }}
                                    className="w-24 h-12 rounded-full bg-slate-400 blur-xl" 
                                  />
                                  <motion.div 
                                    animate={{ x: [20, -20, 20], y: [6, -6, 6] }}
                                    transition={{ repeat: Infinity, duration: 6 + index, ease: "easeInOut" }}
                                    className="w-32 h-14 rounded-full bg-stone-400 blur-2xl" 
                                  />
                                </div>

                                <div className="relative z-10 flex flex-col items-center gap-1.5 px-3">
                                  <div className="w-9 h-9 rounded-full bg-red-950/70 border border-red-500/40 flex items-center justify-center text-red-300 shadow-[0_0_18px_rgba(239,68,68,0.18)]">
                                    <Lock className="w-3.5 h-3.5 animate-pulse" />
                                  </div>
                                  <div>
                                    <span className="text-[9.5px] font-serif font-bold tracking-[0.2em] text-red-300 uppercase block">
                                      红锁未解
                                    </span>
                                    <p className="text-[8px] text-stone-500 font-serif leading-relaxed mt-0.5">
                                      前序关卡尚未被 NPC 点亮<br />当前不可进入
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Left node check badge marker */}
                          <button
                            onClick={() => handleLevelClick(lvl)}
                            className={`absolute -left-[45px] top-4 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all z-20 outline-none ${
                              isCompleted 
                                ? "bg-[#dfb15b] border-white text-black shadow-lg shadow-[#dfb15b]/30 scale-110" 
                                : "bg-stone-950 border-stone-700/80 text-stone-400 hover:border-[#dfb15b]/50"
                            }`}
                          >
                            {isCompleted ? (
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            ) : (
                              <span className="text-[10px] font-mono font-bold">{lvl.id}</span>
                            )}
                          </button>

                          {/* Outer card shell with water-ink details */}
                          <div 
                            onClick={() => handleLevelClick(lvl)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                              isCompleted 
                                ? "bg-stone-900/90 border-[#dfb15b]/40 shadow-lg" 
                                : isActive
                                ? "bg-stone-950/80 border-amber-500/25 hover:border-amber-400/45"
                                : "bg-stone-950/60 border-stone-800/80 hover:border-stone-700/80"
                            }`}
                          >
                            <div className="flex justify-between items-start mb-1.5">
                              <span className="text-[9px] font-mono tracking-widest text-[#dfb15b] uppercase">
                                Stage {lvl.id} • {sequenceNo === 5 ? "FINAL CHOREO" : "TRIAL"}
                              </span>
                              {starRating > 0 && (
                                <div className="flex items-center gap-0.5 text-xs text-amber-400 font-bold">
                                  {Array.from({ length: starRating }).map((_, i) => (
                                    <span key={i}>★</span>
                                  ))}
                                </div>
                              )}
                            </div>

                            <h3 className="text-sm font-serif font-bold text-stone-100 flex items-center gap-1">
                              {lvl.title}
                              <ChevronRight className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                            </h3>
                            <p className="text-[11px] text-stone-400 font-serif mt-1 leading-normal">
                              {lvl.subtitle}
                            </p>

                            <div className="mt-3 pt-2 border-t border-stone-900 flex justify-between items-center text-[10px] text-stone-500 font-serif">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-[#dfb15b]" />
                                {lvl.successStandard.slice(0, 16)}...
                              </span>
                              {isCompleted && (
                                <span className="text-[9px] bg-[#dfb15b]/10 text-[#f0d9a4] border border-[#dfb15b]/20 px-1.5 py-0.5 rounded-full font-mono">
                                  NPC LIT
                                </span>
                              )}
                              {isActive && (
                                <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-mono animate-pulse">
                                  READY
                                </span>
                              )}
                              {isLocked && (
                                <span className="text-[9px] bg-red-500/10 text-red-300 border border-red-500/20 px-1.5 py-0.5 rounded-full font-mono">
                                  RED LOCK
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Cultivation Leaderboard Dashboard inside H5 bottom */}
                  <div className="pt-2">
                    <LeaderboardRank
                      childName={passport.childName}
                      familyName={passport.familyName}
                      avatarStyle={passport.avatarStyle}
                      scoreHistory={passport.scoreHistory}
                    />
                  </div>

                  {/* Global reset mechanism for CEO test audit */}
                  {allowDebugControls && <div className="pt-6 text-center">
                    <button
                      onClick={() => { onClearScore(); synth.playSwipe(); }}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-stone-800 text-[10px] text-stone-500 font-serif hover:text-stone-300 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      重置所有关卡与星级进度
                    </button>
                  </div>}

                </div>
              )}

              {/* PAGE TWO PORTALS: WIRELESS PHOTOGRAPHY MEDIA */}
              {activeTab === "photos" && (
                <div className="absolute inset-0 overflow-y-auto px-4 py-3 space-y-5 z-10">
                  <div className="text-center py-2 space-y-1">
                    <span className="text-[10px] font-mono tracking-widest text-[#dfb15b] uppercase">Traveler Stream</span>
                    <h3 className="font-serif text-lg tracking-widest text-stone-100">旅拍成长长卷</h3>
                    <p className="text-[10px] text-stone-500 font-serif">摄影师回传精彩瞬间，一键生成官宣海报</p>
                  </div>

                  {photos.length === 0 ? (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-dashed border-stone-800 p-6 text-center">
                        <p className="text-xs font-serif leading-relaxed text-stone-400">
                          当前尚未生成现场跟拍照片，先以 4 张实景主视觉替代占位内容，保持客户端观感完整。
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {sceneAssets.slice(0, 4).map((asset, index) => (
                          <div key={asset} className="overflow-hidden rounded-2xl border border-white/10 bg-black/25">
                            <img src={asset} alt={`实景图 ${index + 1}`} className="h-32 w-full object-cover" />
                            <div className="p-3">
                              <p className="text-[9px] font-mono uppercase tracking-[0.28em] text-amber-300/75">Scene Asset {index + 1}</p>
                              <p className="mt-2 text-[11px] font-serif text-stone-300">
                                {index === 0 && "墨染启幕"}
                                {index === 1 && "奔跑穿行"}
                                {index === 2 && "联手封坛"}
                                {index === 3 && "最终主视觉"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* One click generated WeChat layout */}
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-[#dfb15b] font-mono">
                          {photos.length} 张照片已接收
                        </span>
                        
                        <button
                          onClick={() => { setShowPoster(true); synth.playChime(); }}
                          className="flex items-center gap-1.5 px-3 py-1 bg-[#dfb15b] hover:bg-white text-black font-semibold text-[10px] uppercase tracking-wider rounded-full transition-all shadow-md"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>一键生成传人九宫格海报</span>
                        </button>
                      </div>

                      {/* Photo List scroll */}
                      <div className="grid grid-cols-2 gap-3">
                        {photos.map((ph, i) => (
                          <div 
                            key={ph.id}
                            className="bg-stone-950 border border-stone-900 rounded-lg overflow-hidden flex flex-col justify-between"
                          >
                            <div className="relative h-28 overflow-hidden bg-stone-900">
                              <img
                                src={ph.imageUrl}
                                alt={ph.caption}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[8px] font-mono text-cyan-400">
                                {ph.timestamp}
                              </span>
                            </div>

                            <div className="p-2 space-y-1 bg-stone-950 flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex justify-between items-center text-[8px] text-[#dfb15b] font-serif">
                                  <span>{ph.caption}</span>
                                </div>
                                <p className="text-[9px] text-stone-400 font-serif leading-relaxed line-clamp-2 mt-1">
                                  {ph.aiMotto}
                                </p>
                              </div>

                              <div className="pt-1.5 border-t border-stone-900 text-[8px] text-stone-600 font-mono flex items-center gap-1">
                                <MapPin className="w-2.5 h-2.5" />
                                <span className="truncate">{ph.location}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PAGE THREE PORTALS: QR CODE PORTRAIT ACTIVE BADGE */}
              {activeTab === "passport" && (
                <div className="absolute inset-0 overflow-y-auto px-6 py-6 space-y-6 z-10 flex flex-col justify-between">
                  
                  {/* Decorative passport cover framing */}
                  <div className="bg-stone-950/90 border border-stone-800 rounded-2xl p-5 space-y-6 text-center relative overflow-hidden flex-1 flex flex-col justify-center">
                    
                    {/* Background badge gold seal silhouette */}
                    <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-[#dfb15b]/5 border border-[#dfb15b]/10 rounded-full flex items-center justify-center font-serif text-[4rem] text-stone-800 pointer-events-none select-none">
                      印
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-mono tracking-widest text-stone-500 uppercase">Clan Passport Seal</span>
                      <h3 className="font-serif text-lg text-[#dfb15b] font-bold tracking-widest">
                        「小小封藏传人」印信
                      </h3>
                      <p className="text-[9px] text-stone-400 font-serif">客户、NPC 与摄影师共用同一传人档案，但各自使用独立专属链接。</p>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-serif font-bold text-stone-100">
                        {passport.familyName}氏世家传子：
                        <span className="text-[#dfb15b]">{passport.childName}</span>
                      </div>
                      <p className="text-[10px] text-stone-400 font-serif leading-relaxed italic px-4">
                        “ {passport.customMotto || "封一坛陈酿，守护百年家风。"} ”
                      </p>
                    </div>

                    <div className="pt-2 border-t border-stone-900 grid grid-cols-2 gap-2 text-left">
                      <div className="p-2 bg-stone-900/60 rounded">
                        <span className="block text-[8px] text-stone-500">传人护照号</span>
                        <span className="text-[10px] text-[#dfb15b] font-mono break-all">{passport.passportId || "待激活"}</span>
                      </div>
                      <div className="p-2 bg-stone-900/60 rounded">
                        <span className="block text-[8px] text-stone-500">定制披风</span>
                        <span className="text-[10px] text-[#dfb15b] font-serif">{passport.avatarStyle}</span>
                      </div>
                      <div className="p-2 bg-stone-900/60 rounded">
                        <span className="block text-[8px] text-stone-500">点亮进度</span>
                        <span className="text-[10px] text-stone-200 font-serif">
                          已点亮 {passport.npcLitLevels.length} / 5
                        </span>
                      </div>
                      <div className="p-2 bg-stone-900/60 rounded">
                        <span className="block text-[8px] text-stone-500">当前验核关卡</span>
                        <span className="text-[10px] text-stone-200 font-serif">
                          {nextUnlockLevel ? `${nextUnlockLevel.id} ${nextUnlockLevel.title}` : "已完成全部封藏环节"}
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-3 text-left">
                      <div className="rounded-xl border border-[#dfb15b]/15 bg-[#120f0c] p-3">
                        <p className="text-[9px] uppercase tracking-[0.22em] text-[#dfb15b]/80">现场验核印信码</p>
                        <div className="mt-3 flex gap-3">
                          <div className="shrink-0 rounded-xl bg-white p-2">
                            <PassportQrCode value={passportScanPayload || customerResumeUrl} size={96} alt="Passport Scan Payload QR Code" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] leading-5 text-stone-300 font-serif">
                              线下任务完成后，请在工作人员自己的 `npc` 或 `photographer` 端先通过门禁，再用站内扫码功能识别此印信码以锁定当前传人。此码已升级为短时有效且一次性使用的授权票据，不再直接公开后台链接。
                            </p>
                            <p className="mt-2 text-[9px] leading-4 text-stone-500 break-all font-mono">
                              {passportScanPayload || customerResumeUrl}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-xl border border-white/10 bg-stone-900/60 p-3 text-left">
                          <p className="text-[9px] uppercase tracking-[0.22em] text-cyan-300/80">客户自用恢复网址</p>
                          <div className="mt-3 flex justify-center">
                            <div className="rounded-xl bg-white p-2">
                              <PassportQrCode value={customerResumeUrl} size={92} alt="Customer Resume QR Code" />
                            </div>
                          </div>
                          <p className="mt-3 text-[10px] leading-5 text-stone-300 font-serif">
                            这个二维码只用于家长在自己的手机上恢复客户前端长卷，不再向客户公开任何后台直达地址。
                          </p>
                          <p className="mt-3 text-[9px] leading-4 text-stone-500 break-all font-mono">
                            {customerResumeUrl}
                          </p>
                        </div>

                        <div className="rounded-xl border border-red-500/15 bg-stone-900/60 p-3 text-left">
                          <p className="text-[9px] uppercase tracking-[0.22em] text-red-300/80">NPC 专属后台码</p>
                          <div className="mt-3 flex justify-center">
                            <div className="rounded-xl bg-white p-2">
                              <PassportQrCode value={npcResumeUrl} size={92} alt="NPC Resume QR Code" />
                            </div>
                          </div>
                          <p className="mt-3 text-[10px] leading-5 text-stone-300 font-serif">
                            真人 NPC 用手机扫这个码，会先进入 `npc` 门禁页；如果这台手机还没登录过，需先输入 PIN，通过后会自动进入当前孩子的专属评分后台。
                          </p>
                          <p className="mt-3 text-[9px] leading-4 text-stone-500 break-all font-mono">
                            {npcResumeUrl}
                          </p>
                        </div>

                        <div className="rounded-xl border border-cyan-500/15 bg-stone-900/60 p-3 text-left">
                          <p className="text-[9px] uppercase tracking-[0.22em] text-cyan-300/80">摄影师专属后台码</p>
                          <div className="mt-3 flex justify-center">
                            <div className="rounded-xl bg-white p-2">
                              <PassportQrCode value={photographerResumeUrl} size={92} alt="Photographer Resume QR Code" />
                            </div>
                          </div>
                          <p className="mt-3 text-[10px] leading-5 text-stone-300 font-serif">
                            摄影师扫这个码，会先进入 `photographer` 门禁页；如果这台手机还没登录过，需先输入 PIN，通过后会自动进入当前孩子的专属上传后台。
                          </p>
                          <p className="mt-3 text-[9px] leading-4 text-stone-500 break-all font-mono">
                            {photographerResumeUrl}
                          </p>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>
              )}

            </>
          )}

        </AnimatePresence>

      </div>

      {/* FOOTER NAVIGATION MENU TABS */}
      {passport.activated && (
        <div className="mobile-safe-nav absolute bottom-0 inset-x-0 z-30 bg-black/40 backdrop-blur-xl border-t border-white/5 px-4 pt-2 flex justify-around items-center">
          <button
            onClick={() => { setActiveTab("map"); synth.playSwipe(); }}
            className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all outline-none cursor-pointer ${
              activeTab === "map" ? "text-orange-400 scale-105 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-5 h-5" />
            <span className="text-[9px] font-serif tracking-wider">时间长卷</span>
          </button>

          <button
            onClick={() => { setActiveTab("photos"); synth.playSwipe(); }}
            className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all outline-none cursor-pointer ${
              activeTab === "photos" ? "text-orange-400 scale-105 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Camera className="w-5 h-5" />
            <span className="text-[9px] font-serif tracking-wider">相片长卷</span>
          </button>

          <button
            onClick={() => { setActiveTab("passport"); synth.playSwipe(); }}
            className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all outline-none cursor-pointer ${
              activeTab === "passport" ? "text-orange-400 scale-105 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <QrCode className="w-5 h-5" />
            <span className="text-[9px] font-serif tracking-wider">传人印信</span>
          </button>
        </div>
      )}

      {/* MINI TRIAL PLAYABLE OVERLAY POPUPS */}
      <AnimatePresence>
        {selectedLevelId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/85 backdrop-blur-sm flex flex-col justify-end p-4 text-left"
          >
            <motion.div
              initial={{ y: 150 }}
              animate={{ y: 0 }}
              exit={{ y: 150 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-stone-900 border border-stone-800 rounded-t-2xl p-5 space-y-4 shadow-2xl relative"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedLevelId(null)}
                className="absolute top-4 right-4 text-stone-500 hover:text-stone-300 outline-none"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Title Header */}
              <div>
                <span className="text-[9px] font-mono text-[#dfb15b] uppercase tracking-widest block">
                  Stage {selectedLevelId} Trial • 游戏模拟体验
                </span>
                <h3 className="text-lg font-serif font-bold text-stone-100">
                  {levels.find(l => l.id === selectedLevelId)?.title}
                </h3>
              </div>

              {/* Interactive Sandbox Game Screen depending on selected Node */}
              <div className="bg-stone-950 p-2 rounded-xl border border-stone-800 text-stone-300 text-xs text-center space-y-3 relative overflow-hidden flex flex-col justify-center items-center">
                
                {/* 01 CHECK-IN INDEPENDENCE */}
                {selectedLevelId === "01" && (
                  <div className="space-y-3 w-full py-2">
                    <span className="w-10 h-10 rounded-full bg-[#dfb15b]/10 text-[#dfb15b] border border-[#dfb15b]/20 flex items-center justify-center mx-auto">
                      <BookOpen className="w-5 h-5" />
                    </span>
                    <h4 className="text-xs font-serif font-bold text-stone-200">家族先祖盟誓古卷已开</h4>
                    <div className="bg-stone-900/40 p-3 rounded border border-orange-500/10 max-w-xs mx-auto text-left relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-8 h-8 rounded-full bg-red-600/10 border border-red-600/20 text-red-500 flex items-center justify-center font-serif text-[8px] font-bold rotate-12">
                        朱印
                      </div>
                      <p className="text-[10px] text-[#dfb15b] font-serif font-semibold text-center pb-1">
                        【{familyInput}氏宗脉 • {nameInput}传人印】
                      </p>
                      <p className="text-[10px] text-stone-400 font-serif italic leading-relaxed text-center">
                        “ {customMottoInput} ”
                      </p>
                    </div>
                    <p className="text-[9.5px] text-stone-500 font-serif text-center mt-1">
                      您已于太真先祖殿中，成功完成了火漆家训落款与宗祠拜誓仪式！恭喜获得首阶段至高五星修为。
                    </p>
                    <button
                      onClick={() => handleInteractiveComplete("01", 5)}
                      className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold rounded text-xs outline-none"
                    >
                      研读宣毕 • 往长卷探秘
                    </button>
                  </div>
                )}

                {/* 02 DIVINE SPRING CLEANUP */}
                {selectedLevelId === "02" && (
                  <div className="w-full">
                    <SpiritStoneGame onGameComplete={(stars) => handleInteractiveComplete("02", stars)} />
                  </div>
                )}

                {/* 03 BICAN SEARCH SEEDS */}
                {selectedLevelId === "03" && (
                  <div className="w-full">
                    <CatchFishGame onGameComplete={(stars) => handleInteractiveComplete("03", stars)} />
                  </div>
                )}

                {/* 04 SMELL SCENTS POTS */}
                {selectedLevelId === "04" && (
                  <div className="w-full space-y-2">
                    <BotanicalLibrary />
                    <button
                      onClick={() => handleInteractiveComplete("04", 5)}
                      className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold rounded text-xs select-none hover:scale-[1.02] active:scale-95 transition-all outline-none"
                    >
                      🌿 闻香完毕，收录此典 (认领 5★ 学星)
                    </button>
                  </div>
                )}

                {/* 05 WAX SEAL CAPPING */}
                {selectedLevelId === "05" && (
                  <div className="space-y-4 w-full py-2 text-center">
                    <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center mx-auto">
                      <Sparkles className="w-5 h-5 animate-pulse" />
                    </div>

                    <div className="space-y-1 max-w-xs mx-auto">
                      <h4 className="text-[11px] font-serif font-bold text-stone-200">终期祈福•天人契盟封坛大典</h4>
                      <p className="text-[9.5px] text-stone-400 font-serif leading-relaxed">
                        线上辅助封口仿真。在现场，您将用燃融的朱红火漆封口属于您家庭的【百年大桶】，并在热漆上加盖定制大金印，合契誓盟。
                      </p>
                    </div>

                    <div className="h-10 relative flex justify-center items-center">
                      <motion.div
                        animate={{ scale: sealMeltProgress === 100 ? 1 : [0.95, 1.05, 0.95] }}
                        className={`w-9 h-9 rounded-full flex items-center justify-center border-2 ${
                          sealMeltProgress === 100 
                            ? "bg-amber-500 border-white text-black text-xs font-semibold font-serif" 
                            : "bg-[#df805b]/20 border-[#df805b]/50 text-[#df805b]"
                        }`}
                      >
                        {sealMeltProgress === 100 ? "封" : "融"}
                      </motion.div>
                    </div>

                    {sealMeltProgress < 100 ? (
                      <button
                        onClick={handleMeltPress}
                        className="mx-auto flex items-center gap-1 px-4 py-2 bg-amber-950/20 text-amber-300 border border-amber-900 rounded text-xs hover:bg-amber-900/30 transition-all select-none"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>注入火漆溶物 ({100 - sealMeltProgress}% left)</span>
                      </button>
                    ) : (
                      <div className="space-y-1">
                        <span className="text-[10px] text-emerald-400 font-serif block font-bold">
                          ✓ 封藏火漆溶融完美，金印重落！
                        </span>
                        <button
                          onClick={() => handleInteractiveComplete("05", 5)}
                          className="w-full py-2 bg-[#dfb15b] text-black font-serif font-bold rounded text-xs hover:brightness-110 active:scale-95 transition-all select-none"
                        >
                          印落盟成 • 终极授勋
                        </button>
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* Physical details & save button */}
              <div className="flex gap-2.5 pt-1">
                <button
                  onClick={() => setSelectedLevelId(null)}
                  className="w-full py-2 border border-stone-800 hover:bg-stone-800 rounded text-stone-400 text-xs tracking-wider outline-none"
                >
                  返回长卷
                </button>
              </div>

              <div className="p-2 bg-stone-950/50 rounded text-[9px] text-stone-500 font-serif leading-relaxed text-center">
                * 线上小游戏由“筑梦未来”科技包提供趣味互动仿真。<br />
                现场比赛时，请由随行NPC执微型星级打点红外枪扫描您下方的【传人印信】实时打点记录！
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FIRE WAX IMPERIAL STAMP FALLING DOWN ANIMATION OVERLAY */}
      <AnimatePresence>
        {showGoldSealOverlay && overlayLevel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowGoldSealOverlay(false)}
            className="absolute inset-0 z-50 bg-[#0d0d10]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center shadow-inner overflow-hidden"
          >
            {/* Ink Splash Backdrop circles */}
            <div className="absolute inset-x-0 w-full flex items-center justify-center overflow-hidden pointer-events-none opacity-20">
              <motion.div
                initial={{ scale: 0.5, rotate: 0 }}
                animate={{ scale: [1, 1.8], rotate: 45 }}
                transition={{ duration: 1.5 }}
                className="w-96 h-96 rounded-full bg-gradient-to-r from-red-600 via-amber-600 to-transparent blur-3xl"
              />
            </div>

            {/* Shaking Action Wrapper */}
            <motion.div
              animate={shaking ? {
                x: [-12, 12, -10, 10, -6, 6, -3, 3, 0],
                y: [-5, 5, -4, 4, -2, 2, 0],
              } : {}}
              transition={{ duration: 0.55 }}
              className="space-y-8 relative z-10"
            >
              <div className="space-y-1">
                <span className="text-[9px] font-mono tracking-widest text-stone-500 uppercase">Interactive Achievements</span>
                <h4 className="text-stone-300 font-serif text-sm">NPC 认可授勋通知</h4>
              </div>

              {/* Big Golden seal Stamp falling simulation */}
              <div className="relative h-44 flex items-center justify-center">
                
                {/* Simulated heavy falling hammer stamp shadow */}
                <motion.div
                  initial={{ scale: 3.5, y: -250, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  transition={{ type: "spring", damping: 12, stiffness: 220 }}
                  className="w-32 h-32 rounded-full border-4 border-[#dfb15b] flex items-center justify-center bg-gradient-to-br from-red-700 to-amber-900 text-white shadow-2xl relative"
                >
                  {/* Fire wax word center */}
                  <div className="text-center font-serif">
                    <span className="text-3xl font-extrabold text-[#dfb15b] block tracking-tighter uppercase mb-0.5">
                      封
                    </span>
                    <span className="text-[8px] tracking-widest text-[#dfb15b]/80 uppercase block">
                      SEALED
                    </span>
                  </div>

                  {/* Embossed inner pattern rings */}
                  <div className="absolute inset-1 border border-dashed border-[#dfb15b]/40 rounded-full" />
                </motion.div>
                
              </div>

              {/* Status details */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="space-y-3"
              >
                <div className="text-stone-100 font-serif text-lg font-bold">
                  「{levels.find(l => l.id === overlayLevel.id)?.title}」通关！
                </div>

                {/* Score Stars display */}
                <div className="flex justify-center gap-1.5 text-2xl text-[#dfb15b]">
                  {Array.from({ length: overlayLevel.stars }).map((_, i) => (
                    <motion.span
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.4, 1] }}
                      transition={{ delay: 0.8 + (i * 0.12), duration: 0.4 }}
                    >
                      ★
                    </motion.span>
                  ))}
                </div>

                <p className="text-[11px] text-stone-400 font-serif max-w-xs leading-relaxed px-4">
                  大印震落，朱砂入印。您已获得该环节授勋。印记已同步至个人护照！
                </p>
              </motion.div>

              {/* Click button or auto close */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="pt-2"
              >
                <button
                  onClick={() => setShowGoldSealOverlay(false)}
                  className="px-6 py-2 bg-gradient-to-r from-[#dfb15b] to-yellow-600 text-black font-semibold text-[10px] tracking-widest uppercase rounded-full shadow hover:brightness-110 active:scale-95 transition-all outline-none"
                >
                  收下传承印信 (Confirm)
                </button>
              </motion.div>

            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* FULL BLOW PORTRAIT SOUVENIR POSTER (微信九宫格九九海报) */}
      <AnimatePresence>
        {showPoster && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-[#08080a] flex flex-col justify-between p-5 text-left"
          >
            {/* Top Back Action button */}
            <div className="flex justify-between items-center text-[10px] pb-2 border-b border-stone-900">
              <span className="font-serif text-[#dfb15b] tracking-wider uppercase">九宫格官宣图</span>
              <button 
                onClick={() => setShowPoster(false)}
                className="px-3 py-1 rounded-full bg-stone-900 text-stone-400 hover:text-white outline-none"
              >
                返回长卷
              </button>
            </div>

            {/* Poster Blueprint frame */}
            <div className="bg-[#0f0f12] p-4 rounded-xl border border-[#dfb15b]/20 text-center space-y-4 flex-1 flex flex-col justify-center relative">
              
              {/* Gold borders representing ancient lacquerware craftsmanship */}
              <div className="absolute inset-2 border border-[#dfb15b]/10 rounded pointer-events-none" />

              <div className="space-y-0.5">
                <span className="text-[9px] font-mono tracking-widest text-[#dfb15b] uppercase block">
                  CROWN OF HERITAGE
                </span>
                <h3 className="font-serif text-lg tracking-widest font-semibold text-stone-100">
                  小小封藏传人九宫印信
                </h3>
                <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#dfb15b]/40 to-transparent mx-auto mt-1" />
              </div>

              {/* 3x3 Photo Grids or Status stamps */}
              <div className="grid grid-cols-3 gap-1.5 py-1">
                {Array.from({ length: 9 }).map((_, idx) => {
                  const correlatedPhoto = photos[idx];
                  
                  return (
                    <div 
                      key={idx} 
                      className="aspect-square bg-stone-950 border border-stone-850 rounded relative overflow-hidden flex flex-col items-center justify-center text-center p-1"
                    >
                      {correlatedPhoto ? (
                        <img
                          src={correlatedPhoto.imageUrl}
                          alt="Growth grid"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="space-y-0.5 pointer-events-none">
                          <span className="text-[8px] font-mono text-stone-600 block">GRID {idx + 1}</span>
                          <span className="text-[7px] text-[#dfb15b]/30 font-serif leading-none block">
                            {idx < 5 ? "等扫码点亮" : "待上传"}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Personalized AI Golden Motton bottom */}
              <div className="bg-stone-950 p-3 rounded border border-stone-900/60 text-left space-y-1.5 relative">
                <div className="flex justify-between items-center text-[9px] text-[#dfb15b] font-serif uppercase tracking-wider">
                  <span>传世家训箴言 • AI 预测</span>
                  <span className="font-mono text-[8px] text-stone-500">HERMES PRIVATE LABEL</span>
                </div>
                <p className="text-[10px] text-stone-300 font-serif leading-relaxed italic pr-2">
                  “ {passport.familyName}门秀木，秀拔于风。今日于泰安广场封藏家训陈酿，百年风骨不坠，世代香火重光。 ”
                </p>
                <span className="text-[8.5px] text-stone-500 font-serif block">
                  传人：{passport.familyName}氏世家尊子【{passport.childName}】
                </span>
              </div>

              <div className="text-[8px] text-stone-600 font-serif text-center pb-1 leading-normal">
                长按可将海报保存至相册，或直接分享至微信朋友圈官宣
              </div>

            </div>

            {/* Downloader trigger action */}
            <div className="pt-3">
              <button
                onClick={() => {
                  synth.playChime();
                  confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 }, colors: ['#dfb15b', '#df805b', '#fff'] });
                  alert("海报已经渲染成高解析度底图并模拟保存到系统相册！");
                }}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-[#dfb15b] text-black font-semibold text-xs tracking-widest uppercase rounded shadow transition-all"
              >
                保存高清海报官宣至社交图
              </button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* 5-STAR SPECIAL "金柱冲天" SOARING GOLD PILLAR PARTICLE EFFECT LAYER */}
      <AnimatePresence>
        {goldPillarActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-[60] bg-black/40 flex flex-col justify-end items-center pointer-events-none overflow-hidden select-none"
          >
            {/* The main vertical beam of golden light (金柱) shooting up */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0.5, y: 760 }}
              animate={{ 
                scaleX: [1, 2.8, 3.2, 2, 0.5, 0], 
                opacity: [1, 1, 0.9, 0.8, 0],
                y: 0 
              }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute inset-x-0 bottom-0 top-0 w-20 mx-auto bg-gradient-to-t from-orange-500/80 via-yellow-300 to-white shadow-[0_0_80px_rgba(251,191,36,0.95)] origin-bottom"
            />

            {/* Faster secondary core streak */}
            <motion.div
              initial={{ scaleX: 0, y: 760 }}
              animate={{ 
                scaleX: [0, 4, 1, 0],
                y: -100 
              }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="absolute inset-x-0 bottom-0 top-0 w-5 mx-auto bg-white shadow-[0_0_50px_#fff]"
            />

            {/* Rushing upward golden particles */}
            <div className="absolute inset-0 flex justify-center items-center">
              {Array.from({ length: 45 }).map((_, i) => {
                const startX = Math.random() * 140 - 70; // centered columns
                const speed = Math.random() * 0.7 + 0.5; // random duration multipliers
                const delay = Math.random() * 0.25;
                const sizeVal = Math.random() * 6 + 4; // gold sparks sizes

                return (
                  <motion.div
                    key={i}
                    initial={{ y: 760, x: startX, scale: 0, opacity: 1 }}
                    animate={{ 
                      y: -150, 
                      scale: [1, 1.8, 0], 
                      opacity: [1, 1, 0.7, 0] 
                    }}
                    transition={{ 
                      duration: speed, 
                      delay: delay, 
                      ease: "easeOut" 
                    }}
                    style={{ 
                      backgroundColor: i % 2 === 0 ? "#dfb15b" : "#f97316",
                      width: `${sizeVal}px`,
                      height: `${sizeVal}px`
                    }}
                    className="absolute rounded-full shadow-[0_0_12px_rgba(251,191,36,0.9)]"
                  />
                );
              })}
            </div>

            {/* Glowing ripple waves at the base of the pillar */}
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 5, opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute bottom-10 w-20 h-6 bg-yellow-400 rounded-full blur-sm"
            />
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 6.5, opacity: 0 }}
              transition={{ duration: 1.1, delay: 0.2 }}
              className="absolute bottom-10 w-16 h-4 bg-orange-500 rounded-full blur-md"
            />

            {/* Splendid text ribbon */}
            <div className="absolute top-[32%] inset-x-0 text-center space-y-1 bg-black/70 py-3 border-y border-yellow-500/20 backdrop-blur-sm z-30">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [0.8, 1.1, 1], opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="text-lg font-serif font-extrabold text-[#dfb15b] tracking-[0.4em] drop-shadow-lg flex items-center justify-center gap-1 text-center"
              >
                ★ 金柱冲天 ★
              </motion.div>
              <div className="text-[9.5px] text-stone-300 font-serif tracking-widest uppercase">
                家族荣誉至显 • 获五星至高修为
              </div>
            </div>

            {/* Screen flashing burst */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 bg-white"
            />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
