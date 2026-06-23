/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Flame, Play, SkipForward, Volume2, VolumeX } from "lucide-react";
import { synth } from "../utils/audio";

const INTRO_DURATION_MS = 15000;

const FALLBACK_SCENES = [
  {
    title: "一滴金墨入清泉",
    subtitle: "黑金微光在雾气里缓缓扩散，开出第一段封藏仪式的呼吸。"
  },
  {
    title: "奔跑穿过白墙黛瓦",
    subtitle: "孩子在清晨的院落里向前，风、铃与衣袂一起把故事推开。"
  },
  {
    title: "大手叠小手，朱泥成契",
    subtitle: "联结不再只是誓言，而是被看见、被按下、被真正点亮。"
  },
  {
    title: "金印落下，主视觉启幕",
    subtitle: "当封坛完成，请以传人之名进入属于你们的黑金长卷。"
  }
] as const;

interface PrerollIntroProps {
  onComplete: () => void;
  allowSkip?: boolean;
  bgmSrc?: string;
  sceneAssets?: string[];
}

export default function PrerollIntro({
  onComplete,
  allowSkip = true,
  bgmSrc,
  sceneAssets = []
}: PrerollIntroProps) {
  const [isStarted, setIsStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentScene, setCurrentScene] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const scenes = useMemo(
    () =>
      FALLBACK_SCENES.map((scene, index) => ({
        ...scene,
        image: sceneAssets[index] ?? sceneAssets[sceneAssets.length - 1] ?? ""
      })),
    [sceneAssets]
  );

  const finishIntro = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    synth.stopAmbientLoop();
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    if (!isStarted) return;

    const sceneDuration = INTRO_DURATION_MS / scenes.length;
    const startedAt = Date.now();

    if (bgmSrc) {
      const audio = new Audio(bgmSrc);
      audio.loop = true;
      audio.preload = "auto";
      audio.volume = 0.46;
      audio.muted = muted;
      audioRef.current = audio;
      audio.play().catch(() => synth.startAmbientLoop());
    } else {
      synth.startAmbientLoop();
    }

    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const nextProgress = Math.min(elapsed / INTRO_DURATION_MS, 1);
      setProgress(nextProgress);
      setCurrentScene(Math.min(Math.floor(elapsed / sceneDuration), scenes.length - 1));
    }, 100);

    const soundTimers = [
      window.setTimeout(() => synth.playWaterDrop(), 1200),
      window.setTimeout(() => synth.playSwipe(), 5600),
      window.setTimeout(() => synth.playChime(), 10800)
    ];
    const completeTimer = window.setTimeout(finishIntro, INTRO_DURATION_MS);

    return () => {
      window.clearInterval(interval);
      soundTimers.forEach(window.clearTimeout);
      window.clearTimeout(completeTimer);
      if (audioRef.current) {
        audioRef.current.pause();
      }
      synth.stopAmbientLoop();
    };
  }, [bgmSrc, finishIntro, isStarted, muted, scenes.length]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = muted;
    }
    if (muted) {
      synth.stopAmbientLoop();
    } else if (isStarted && !bgmSrc) {
      synth.startAmbientLoop();
    }
  }, [bgmSrc, isStarted, muted]);

  const handleStart = () => {
    setIsStarted(true);
    setMuted(false);
    synth.playChime();
  };

  if (!isStarted) {
    return (
      <div className="absolute inset-0 z-50 overflow-hidden bg-[#040507]/95 text-white">
        {scenes[3]?.image && <img src={scenes[3].image} alt="主视觉开场" className="absolute inset-0 h-full w-full object-cover opacity-35" />}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(244,207,124,0.28),transparent_28%),linear-gradient(180deg,rgba(0,0,0,0.15)_0%,rgba(0,0,0,0.68)_42%,rgba(0,0,0,0.92)_100%)]" />
        <div className="relative flex h-full flex-col items-center justify-center px-8 text-center">
          <div className="rounded-full border border-amber-300/25 bg-black/30 p-5 backdrop-blur-md">
            <Flame className="h-8 w-8 text-amber-300" />
          </div>
          <p className="mt-8 text-[11px] uppercase tracking-[0.45em] text-amber-200/80">Hermes D19 Prelude</p>
          <h1 className="mt-4 text-3xl font-serif tracking-[0.22em] text-white">小小封藏传人</h1>
          <p className="mt-5 max-w-xs text-sm leading-7 text-stone-300">
            点击下方按钮后立即进入 15 秒电影感开场，并同步启动背景音乐接口。
          </p>
          <button
            onClick={handleStart}
            className="mt-10 inline-flex items-center gap-3 rounded-full border border-amber-200/25 bg-gradient-to-r from-[#dca54e] via-[#f2cf8d] to-[#c38b36] px-8 py-4 text-sm font-semibold tracking-[0.24em] text-black shadow-[0_18px_40px_rgba(217,164,79,0.28)] transition-transform hover:scale-[1.02] active:scale-95"
          >
            <Play className="h-4 w-4 fill-current" />
            开启修行
          </button>
        </div>
      </div>
    );
  }

  const activeScene = scenes[currentScene];

  return (
    <div className="absolute inset-0 z-50 overflow-hidden bg-[#050609] text-white">
      {activeScene.image && (
        <AnimatePresence mode="wait">
          <motion.img
            key={activeScene.image}
            src={activeScene.image}
            alt={activeScene.title}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 1.1 }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </AnimatePresence>
      )}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(244,207,124,0.18),transparent_24%),linear-gradient(180deg,rgba(0,0,0,0.18)_0%,rgba(0,0,0,0.55)_40%,rgba(0,0,0,0.92)_100%)]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M0%2020h40M20%200v40%22%20stroke%3D%22rgba(255,255,255,0.04)%22%20stroke-width%3D%221%22/%3E%3C/svg%3E')] opacity-20" />

      <div className="absolute left-5 right-5 top-5 z-20 flex items-center justify-between">
        <button
          onClick={() => setMuted((prev) => !prev)}
          className="rounded-full border border-white/10 bg-black/35 p-2.5 text-stone-200 backdrop-blur-md"
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        {allowSkip && (
          <button
            onClick={finishIntro}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/35 px-3 py-2 text-[10px] uppercase tracking-[0.28em] text-stone-200 backdrop-blur-md"
          >
            跳过
            <SkipForward className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="relative z-10 flex h-full flex-col justify-end px-7 pb-10 pt-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeScene.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.7 }}
            className="rounded-[28px] border border-white/10 bg-black/25 p-6 backdrop-blur-xl"
          >
            <p className="text-[10px] uppercase tracking-[0.4em] text-amber-200/75">Scene {String(currentScene + 1).padStart(2, "0")}</p>
            <h2 className="mt-4 text-2xl font-serif leading-relaxed tracking-[0.16em] text-[#f4dbac]">
              {activeScene.title}
            </h2>
            <p className="mt-4 text-sm leading-7 text-stone-300">{activeScene.subtitle}</p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex items-center gap-3">
          <div className="h-[2px] flex-1 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full bg-gradient-to-r from-[#d8a651] via-[#f7db9e] to-white"
              animate={{ width: `${progress * 100}%` }}
            />
          </div>
          <span className="text-[10px] uppercase tracking-[0.32em] text-stone-400">{Math.round(progress * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
