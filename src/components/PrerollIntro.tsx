/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Volume2, VolumeX, SkipForward, Play, Flame, Sparkles } from "lucide-react";
import { synth } from "../utils/audio";

const CINEMATIC_PICS = [
  'https://v3b.fal.media/files/b/0a9e9a3f/1GZK1w6ryqWunIEqMd5ia_Od8D2ejG.png',
  'https://v3b.fal.media/files/b/0a9e9a40/gRaQduUenzWMQrwcBi73c_1N8lXZiL.png',
  'https://v3b.fal.media/files/b/0a9e9a40/O6k3naEgAN7yGkiAa9zPy_Gs3qRp0a.png',
  'https://vip.123pan.cn/1825227364/main_visual.png'
];

interface PrerollIntroProps {
  onComplete: () => void;
}

export default function PrerollIntro({ onComplete }: PrerollIntroProps) {
  const [currentScene, setCurrentScene] = useState<number>(0);
  const [muted, setMuted] = useState<boolean>(true);
  const [isStarted, setIsStarted] = useState<boolean>(false);

  // Auto progression of cinematic scenes
  useEffect(() => {
    if (!isStarted) return;
    
    // 🔈 物理注入 BGM 播放器：采用更高的 DOM 优先级通过 Audio 对象播放
    const audio = new Audio("https://cdn.pixabay.com/audio/2023/04/26/audio_f55f269a84.mp3");
    audio.loop = true;
    audio.volume = 0.6;
    
    if (!muted) {
      audio.play().catch(err => {
         console.warn("BGM Play failed, waiting for user interaction:", err);
      });
    }

      const timers = [
        setTimeout(() => { setCurrentScene(1); if(!muted) synth.playWaterDrop(); }, 3500),
        setTimeout(() => { setCurrentScene(2); if(!muted) synth.playSwipe(); }, 7500),
        setTimeout(() => { setCurrentScene(3); if(!muted) synth.playChime(); }, 11500),
      ];

    return () => {
      timers.forEach(clearTimeout);
      audio.pause(); 
    };
  }, [isStarted, muted]);

  const toggleSound = () => {
    const nextMute = !muted;
    setMuted(nextMute);
    if (!nextMute) {
      synth.playChime();
    }
  };

  const handleStartIntro = () => {
    setIsStarted(true);
    setMuted(false);
    synth.playChime();
  };

  const skipIntro = () => {
    synth.playSwipe();
    onComplete();
  };

  if (!isStarted) {
    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#020205]/95 backdrop-blur-xl text-[#eee] p-6 text-center select-none overflow-hidden">
        {/* Decorative Golden Ink Rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.1)_0%,transparent_70%)] rounded-full blur-3xl pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2 }}
          className="relative z-10 space-y-8"
        >
          <div className="flex justify-center">
            <span className="w-16 h-16 rounded-full border border-orange-500/30 flex items-center justify-center text-orange-400 bg-orange-500/5 shadow-lg shadow-orange-500/5 animate-pulse">
              <Flame className="w-7 h-7" />
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-serif tracking-[0.25em] text-white">小小封藏传人</h1>
            <p className="text-xs tracking-[0.4em] text-orange-400 font-mono uppercase">Interactive Cinematic Journey</p>
          </div>

          <p className="text-slate-400 font-serif text-sm px-6 max-w-xs mx-auto leading-relaxed">
            建议开启声音，体验东方水墨与百年陈酿的电影级声画旅程
          </p>

          <div className="pt-6">
            <button
              onClick={handleStartIntro}
              className="px-8 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold tracking-widest text-xs uppercase rounded-full shadow-lg shadow-orange-500/20 hover:shadow-orange-500/45 active:scale-95 transition-all outline-none cursor-pointer"
            >
              踏浪入卷 • 开启体验
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-50 bg-[#09090b] text-[#dfb15b] overflow-hidden select-none flex flex-col justify-between p-6">
      
      {/* Sound & Skip Controllers */}
      <div className="absolute top-6 left-6 right-6 z-50 flex items-center justify-between">
        <button
          onClick={toggleSound}
          className="p-2.5 rounded-full bg-black/40 border border-[#dfb15b]/20 text-[#dfb15b] backdrop-blur-md active:scale-90 transition-all outline-none"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          onClick={skipIntro}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 border border-[#dfb15b]/20 text-xs tracking-wider text-stone-300 font-mono backdrop-blur-md active:scale-90 transition-all outline-none"
        >
          跳过预告 <SkipForward className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Cinematic Content Carousel */}
      <div className="flex-1 flex items-center justify-center relative">
        <AnimatePresence mode="wait">
          
          {/* Scene 1: Gold Ink Splash (0-3.5s) */}
          {currentScene === 0 && (
            <motion.div
              key="scene0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
            >
              {/* Dynamic Abstract Ink Background */}
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
                <div 
                   className="absolute inset-0 bg-cover bg-center opacity-60 scale-110 transition-transform duration-[4000ms]"
                   style={{ backgroundImage: `url(${CINEMATIC_PICS[0]})` }}
                />
                <motion.div
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1.8, opacity: [0.1, 0.3, 0] }}
                  transition={{ duration: 3.5 }}
                  className="w-full h-full bg-gradient-to-r from-[#dfb15b]/20 via-transparent to-transparent blur-2xl"
                />
              </div>

              <div className="relative z-10 space-y-6">
                <motion.div
                  initial={{ letterSpacing: "0.15em", y: 15, opacity: 0 }}
                  animate={{ letterSpacing: "0.45em", y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 2 }}
                  className="text-stone-300 font-serif text-sm tracking-widest leading-loose"
                >
                  金 墨 晕 染
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 1.5 }}
                  className="text-2xl font-serif text-[#dfb15b] tracking-[0.2em] font-medium"
                >
                  时间 的 旅程 自此 开启
                </motion.h2>
              </div>
            </motion.div>
          )}

          {/* Scene 2: Hanfu Journey to Water Town (3.5s-7.5s) */}
          {currentScene === 1 && (
            <motion.div
              key="scene1"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
            >
              <div 
                  className="absolute inset-0 bg-cover bg-center opacity-60 scale-110"
                  style={{ backgroundImage: `url(${CINEMATIC_PICS[1]})` }}
               />
              {/* Misty Oriental Landscape Background */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#141416]/80 via-transparent to-[#121214]/80 opacity-50" />
              <div className="absolute inset-0 flex items-end justify-center pb-24 overflow-hidden opacity-30">
                {/* Silhouette Mountains */}
                <svg className="w-full h-40 text-stone-800" viewBox="0 0 1440 200" fill="currentColor">
                  <path d="M0,120 L150,70 L340,150 L560,90 L790,170 C840,130 920,80 1010,120 L1200,60 L1440,160 L1440,200 L0,200 Z" />
                </svg>
                {/* Soft Clouds Floating */}
                <motion.div
                  animate={{ x: [-80, 80] }}
                  transition={{ repeat: Infinity, repeatType: "mirror", duration: 12, ease: "linear" }}
                  className="absolute bottom-20 left-12 w-48 h-10 bg-white/5 rounded-full filter blur-xl"
                />
              </div>

              <div className="relative z-10 space-y-6 max-w-xs">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1 }}
                  className="inline-block px-3 py-1 bg-[#dfb15b]/10 rounded border border-[#dfb15b]/20 text-[10px] tracking-widest uppercase text-stone-300"
                >
                  灵山大川 • 白墙黛瓦
                </motion.div>
                <h3 className="text-xl font-serif tracking-widest text-[#dfb15b] leading-relaxed">
                  幼羽轻拂尘网尽
                  <br />
                  <span className="text-stone-300">携子寻迹入幽潭</span>
                </h3>
                <p className="text-xs text-stone-400 font-serif font-light tracking-wide leading-relaxed">
                  跨越千山，孩子换上古风罗衫，踏出身份苏醒的第一部篇章
                </p>
              </div>
            </motion.div>
          )}

          {/* Scene 3: Hand Seal and Candle Firewax (7.5s-11.5s) */}
          {currentScene === 2 && (
            <motion.div
              key="scene2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
            >
              <div 
                  className="absolute inset-0 bg-cover bg-center opacity-60 scale-110"
                  style={{ backgroundImage: `url(${CINEMATIC_PICS[2]})` }}
               />
              {/* Fire Wax Melter Simulated Glow */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <motion.div
                  animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.35, 0.15] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="w-72 h-72 rounded-full bg-[#df805b]/15 blur-3xl"
                />
              </div>

              <div className="relative z-10 space-y-6 max-w-xs">
                <div className="flex justify-center">
                  <span className="w-12 h-12 rounded-full flex items-center justify-center bg-[#df5b5b]/10 text-[#df5b5b] border border-[#df5b5b]/20 shadow-inner">
                    <Flame className="w-6 h-6 animate-pulse" />
                  </span>
                </div>
                <h3 className="text-xl font-serif tracking-widest text-stone-200 leading-relaxed">
                  大手叠小手，朱泥印契约
                </h3>
                <p className="text-xs text-stone-400 font-serif font-light tracking-wide leading-relaxed">
                  在烈火淬炼的红色漆瓦上，封藏下父子一世相守的家训家风
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <span className="w-1.5 h-1.5 bg-[#dfb15b] rounded-full animate-ping" />
                  <span className="text-[10px] text-[#dfb15b]/80 font-mono tracking-widest uppercase">
                    封藏大典模拟中...
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Scene 4: Fixed Banner Custom Quote (11.5s-15s+) */}
          {currentScene === 3 && (
            <motion.div
              key="scene3"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
            >
              <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${CINEMATIC_PICS[3]})` }}
               />
              <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none bg-black/40">
                <span className="text-[12rem] font-serif text-[#dfb15b] select-none uppercase tracking-tighter">
                  封
                </span>
              </div>

              <div className="relative z-10 space-y-12 max-w-sm">
                
                {/* Brand calligraphy */}
                <div className="space-y-4">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="h-[1px] bg-gradient-to-r from-transparent via-[#dfb15b]/40 to-transparent w-36 mx-auto"
                  />
                  
                  <motion.h2
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 1.2 }}
                    className="text-3xl font-serif text-[#dfb15b] tracking-[0.35em] leading-loose font-bold"
                  >
                    一封家训
                    <br />
                    守护百年
                  </motion.h2>

                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="h-[1px] bg-gradient-to-r from-transparent via-[#dfb15b]/40 to-transparent w-36 mx-auto"
                  />
                </div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5, duration: 1 }}
                  className="text-xs text-stone-400 font-serif leading-relaxed px-4 tracking-wider"
                >
                  传承，不仅是一注佳香，更是世代家训风骨在时光里的封藏与绽放。
                </motion.p>

                {/* Confirm Call to Action */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2, duration: 1 }}
                  className="pt-4"
                >
                  <button
                    onClick={skipIntro}
                    className="flex items-center gap-2 mx-auto px-7 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold tracking-widest text-xs uppercase rounded-full shadow-lg hover:shadow-orange-500/25 transition-all outline-none cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-white animate-spin" />
                    开启传人勋章
                  </button>
                </motion.div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Slide dots tracking */}
      <div className="flex justify-center gap-2 pb-4 z-40">
        {[0, 1, 2, 3].map((idx) => (
          <span
            key={idx}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              currentScene === idx ? "w-6 bg-[#dfb15b]" : "w-1.5 bg-stone-700"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
