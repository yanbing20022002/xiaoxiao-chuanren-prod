/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Flame, Star, Award, Leaf, Shield, Check, Send } from "lucide-react";
import { synth } from "../utils/audio";
import confetti from "canvas-confetti";

interface WorshipShrineProps {
  familyName: string;
  childName: string;
  motto: string;
  avatarStyle: string;
  onWorshipComplete: () => void;
}

export default function WorshipShrine({
  familyName,
  childName,
  motto,
  avatarStyle,
  onWorshipComplete,
}: WorshipShrineProps) {
  const [incenseLevel, setIncenseLevel] = useState<number>(0); // 0: unlit, 1: lit, 2: fully active
  const [isWorshipping, setIsWorshipping] = useState<boolean>(false);
  const [showGoldScroll, setShowGoldScroll] = useState<boolean>(false);

  const handleLightIncense = () => {
    synth.playWaterDrop();
    setIncenseLevel(1);
    // Explode ambient particles
    confetti({
      particleCount: 20,
      spread: 30,
      origin: { y: 0.6 },
      colors: ["#dfb15b", "#ef4444"],
    });
  };

  const handleWorshipBow = () => {
    if (incenseLevel < 1) return;
    setIsWorshipping(true);
    synth.playGoldSealStamp();
    
    setTimeout(() => {
      setIsWorshipping(false);
      setIncenseLevel(2);
      setShowGoldScroll(true);
      synth.playChime();
      
      // Explode pristine gold spark particles
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.5 },
        colors: ["#dfb15b", "#ffd700", "#ffffff"],
      });
    }, 1500);
  };

  return (
    <div className="w-full bg-stone-950/90 rounded-2xl p-5 border border-amber-900/40 space-y-5 text-center relative overflow-hidden select-none">
      {/* Red lacquered shrine ambient glow */}
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-red-950/30 to-transparent pointer-events-none" />
      
      <div className="space-y-1">
        <span className="text-[10px] tracking-[0.2em] text-orange-400 font-serif block uppercase">Ancient Temple Ceremony</span>
        <h3 className="text-base font-serif font-bold text-amber-100">【{familyName}氏宗族祠堂祭拜】</h3>
        <p className="text-[10px] text-stone-400 font-serif leading-relaxed">
          换上华服斗篷，至祖宗像前敬陈心意，将家训落入时间之轴。
        </p>
      </div>

      {/* Visual Altar Shrine */}
      <div className="relative bg-black/40 border border-stone-900 rounded-xl p-4 min-h-[160px] flex flex-col items-center justify-between">
        
        {/* Altar Tablets with Glow */}
        <div className="flex gap-2.5 items-end justify-center mb-2">
          {/* Side Tablets */}
          <div className="w-6 h-12 bg-amber-950/40 border border-amber-900/50 rounded flex items-center justify-center text-[8px] text-amber-500/70 font-serif [writing-mode:vertical-lr]">
            积善余庆
          </div>
          {/* Main tablet */}
          <div className="w-14 h-16 bg-gradient-to-b from-amber-800 to-amber-950 border-2 border-amber-500 rounded-md shadow-[0_0_15px_rgba(239,183,91,0.25)] flex flex-col items-center justify-center text-center p-1">
            <span className="text-[8px] text-amber-400/80 font-serif">历代先祖</span>
            <span className="text-xs font-bold text-amber-300 font-serif mt-0.5">{familyName}门牌位</span>
          </div>
          <div className="w-6 h-12 bg-amber-950/40 border border-amber-900/50 rounded flex items-center justify-center text-[8px] text-amber-500/70 font-serif [writing-mode:vertical-lr]">
            孝悌忠信
          </div>
        </div>

        {/* Incense Burner Mockup */}
        <div className="relative flex flex-col items-center justify-center py-2">
          {/* Glowing Smoke Trails */}
          {incenseLevel > 0 && (
            <div className="absolute -top-12 z-10 flex gap-2 justify-center">
              <motion.div
                animate={{ y: [-5, -25], x: [0, -4, 0], opacity: [0.7, 0] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
                className="w-1 h-8 bg-gradient-to-t from-orange-400/40 to-transparent blur-[1.5px]"
              />
              <motion.div
                animate={{ y: [-5, -30], x: [0, 5, 0], opacity: [0.8, 0] }}
                transition={{ repeat: Infinity, duration: 2.1, delay: 0.3, ease: "linear" }}
                className="w-[1.5px] h-10 bg-gradient-to-t from-yellow-300/30 to-transparent blur-[1px]"
              />
            </div>
          )}

          {/* Incense Sticks */}
          <div className="flex gap-1.5 items-end justify-center h-8 mb-[2px]">
            {incenseLevel > 0 ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="w-[1.5px] h-7 bg-red-800 relative">
                  {/* Glowing tip */}
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-orange-400 animate-pulse shadow-[0_0_4px_#f97316]" />
                </div>
              ))
            ) : (
              <p className="text-[9px] text-stone-600 font-serif">香案虚设</p>
            )}
          </div>

          {/* Burner Pot */}
          <div className="w-14 h-6 rounded-t-sm rounded-b-lg bg-gradient-to-b from-amber-600 to-amber-900 border border-amber-500 shadow-md flex items-center justify-center text-[8px] text-amber-300 font-bold tracking-widest">
            鼎
          </div>
        </div>

        {/* Action instruction visual text */}
        <div className="text-center pt-1.5">
          {isWorshipping ? (
            <span className="text-[10px] text-orange-400 animate-pulse font-serif block">
              🙇‍ {familyName}氏传人诚心揖拜，灵烟绕案...
            </span>
          ) : incenseLevel === 0 ? (
            <span className="text-[9px] text-stone-500 font-serif">
              请先“点燃信香”，开启宗族告祭仪式。
            </span>
          ) : incenseLevel === 1 ? (
            <span className="text-[9px] text-amber-400 font-serif animate-pulse">
              信香已燃！点击“祭拜宗族”注入信仰。
            </span>
          ) : (
            <span className="text-[9px] text-emerald-400 font-serif flex items-center gap-1 justify-center">
              <Check className="w-3 h-3" /> 宗族祠堂祭拜合仪，家门光耀！
            </span>
          )}
        </div>
      </div>

      {/* Button Controls */}
      <div className="flex gap-3">
        {incenseLevel === 0 ? (
          <button
            onClick={handleLightIncense}
            className="flex-1 py-2.5 bg-gradient-to-r from-orange-400 to-amber-500 text-black font-semibold text-xs tracking-widest uppercase rounded-lg shadow-md hover:brightness-110 active:scale-95 transition-all outline-none"
          >
            🔥 点燃法向信香
          </button>
        ) : incenseLevel === 1 ? (
          <button
            disabled={isWorshipping}
            onClick={handleWorshipBow}
            className="flex-1 py-2.5 bg-[#dfb15b] hover:bg-white text-black font-semibold text-xs tracking-widest uppercase rounded-lg shadow flex items-center justify-center gap-1.5 transition-all outline-none disabled:opacity-55"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>诚恳揖首祭拜</span>
          </button>
        ) : (
          <button
            onClick={() => onWorshipComplete()}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-widest uppercase rounded-lg shadow transition-all outline-none"
          >
            ✓ 启圣启智 · 携福进发
          </button>
        )}
      </div>

      {/* Ancestral Scroll rolling visual with Golden Letters flying in (金字入卷) */}
      <AnimatePresence>
        {showGoldScroll && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85 }}
            className="bg-[#faf3e0] text-stone-800 p-5 rounded-xl border-t-[8px] border-b-[8px] border-amber-700 shadow-xl relative overflow-hidden"
          >
            {/* Background pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(223,177,91,0.08)_0%,transparent_75%)] pointer-events-none" />
            <div className="absolute inset-2 border border-amber-800/20 rounded pointer-events-none" />

            {/* Glowing Golden particles overlay mimicking letters flying in */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <motion.div
                animate={{ x: [-10, 120, 300], y: [100, 30, -50], opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
                transition={{ duration: 1.5, repeat: 2 }}
                className="absolute w-2 h-2 rounded-full bg-amber-400 filter blur-[0.5px]"
              />
              <motion.div
                animate={{ x: [300, 180, -20], y: [120, 50, -30], opacity: [0, 1, 0], scale: [0.4, 1.5, 0.4] }}
                transition={{ duration: 1.8, delay: 0.3, repeat: 2 }}
                className="absolute w-3 h-3 rounded-full bg-yellow-300 filter blur-[1px]"
              />
            </div>

            <div className="text-center space-y-3 relative z-10">
              <span className="text-[8px] font-mono tracking-widest text-amber-700 uppercase block font-bold">
                * Family Heritage Document *
              </span>
              <h4 className="font-serif text-sm font-bold text-amber-900 border-b border-amber-800/10 pb-1.5">
                {familyName}门圣德 · 书香永续训卷
              </h4>
              
              {/* Motto rendering inside scroll with glowing shadow to represent '金字入卷' */}
              <div className="py-2 px-1 text-center font-serif flex flex-col justify-center items-center gap-1.5">
                <span className="text-[10px] text-stone-500 tracking-[0.2em]">主事传子：{familyName}氏 {childName}</span>
                <motion.p
                  initial={{ backgroundPosition: "0% 50%" }}
                  animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                  transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                  style={{
                    backgroundImage: "linear-gradient(to right, #8c641d, #dfb15b, #cc9530, #dfb15b, #8c641d)",
                    backgroundSize: "200% auto",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                  className="text-sm font-semibold tracking-wide leading-relaxed filter drop-shadow-[0_1.5px_4px_rgba(223,177,91,0.45)] drop-shadow-[0_0.5px_1px_rgba(0,0,0,0.8)]"
                >
                  “ {motto} ”
                </motion.p>
              </div>

              {/* Red wax visual label stamp */}
              <div className="flex justify-center">
                <div className="w-9 h-9 rounded-full bg-red-600 border border-red-500 shadow-inner flex items-center justify-center text-[10px] font-serif text-amber-200 font-bold rotate-12 [writing-mode:matrix] opacity-90">
                  祖训
                </div>
              </div>

              <p className="text-[9px] text-stone-500 font-serif leading-relaxed">
                敬启先辈，金字墨香已刻入时间卷轴。愿小传人秉持此风，披星带福，建功实景。
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
