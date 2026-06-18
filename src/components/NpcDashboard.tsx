/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { GameLevel, UserPassport } from "../types";
import { Star, ShieldAlert, CheckCircle, Zap, QrCode, Award, Scan } from "lucide-react";
import { synth } from "../utils/audio";

interface NpcDashboardProps {
  levels: GameLevel[];
  passport: UserPassport;
  onUpdateScore: (levelId: string, stars: number) => void;
}

export default function NpcDashboard({ levels, passport, onUpdateScore }: NpcDashboardProps) {
  const [selectedLevelId, setSelectedLevelId] = useState<string>("01");
  const [stars, setStars] = useState<number>(5);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanSuccess, setScanSuccess] = useState<boolean>(false);

  const activeLevel = levels.find((l) => l.id === selectedLevelId);

  const handleSimulateScan = () => {
    setIsScanning(true);
    setScanSuccess(false);
    synth.playSwipe();

    setTimeout(() => {
      setIsScanning(false);
      setScanSuccess(true);
      synth.playChime();
    }, 1500);
  };

  const handleSubmitScore = () => {
    onUpdateScore(selectedLevelId, stars);
    setScanSuccess(false);
    // Audio is handled in App.tsx / stamp trigger, but let's give initial feedback haptic beep
    synth.playChime();
  };

  return (
    <div id="npc-dashboard" className="h-full flex flex-col glass-panel text-slate-100 rounded-2xl overflow-hidden shadow-2xl select-none">
      
      {/* Wooden lacquer board style header */}
      <div className="bg-black/30 px-6 py-4.5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
          <h2 className="text-sm font-serif font-semibold tracking-widest text-white uppercase">
            真人 NPC 评判官控制端
          </h2>
        </div>
        <span className="text-[10px] bg-orange-500/10 text-orange-400 px-2.5 py-1 rounded-full border border-orange-500/20 font-mono">
          人在回路 • H-I-L
        </span>
      </div>

      <div className="p-6 flex-1 overflow-y-auto space-y-6">
        
        {/* Child Passport Detector Section */}
        <div className="bg-black/20 p-5 rounded-2xl border border-white/5 space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Passport Detected</span>
              <h3 className="font-serif text-slate-200">
                {passport.familyName ? `${passport.familyName}氏世家尊子：` : "待登记："}
                <span className="text-orange-400 font-bold">{passport.childName || "玄羽"}</span>
              </h3>
            </div>
            
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-[10px] border border-orange-500/20">
              <Award className="w-3.5 h-3.5" />
              <span>传人激活</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <span className="block text-[9px] text-slate-400 mb-0.5">外袍定制款式</span>
              <span className="text-xs text-orange-400 font-medium font-serif">{passport.avatarStyle}</span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <span className="block text-[9px] text-slate-400 mb-0.5">家族传言金句</span>
              <span className="text-xs text-slate-300 font-serif truncate block max-w-[120px]">{passport.customMotto || "封一坛陈酿，守百年家训"}</span>
            </div>
          </div>

          {/* Trigger Scan Animation */}
          <div className="pt-2">
            {!scanSuccess ? (
              <button
                onClick={handleSimulateScan}
                disabled={isScanning}
                className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500/10 hover:bg-orange-500/15 text-orange-400 border border-orange-500/30 rounded-xl text-xs tracking-wider transition-all"
              >
                {isScanning ? (
                  <>
                    <Scan className="w-4 h-4 animate-spin" />
                    <span>红外红外扫描中...</span>
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4" />
                    <span>扫一扫 孩子护照二维码</span>
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center justify-between p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs">
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle className="w-4 h-4" />
                  <span>护照核验成功 • 允许授勋</span>
                </div>
                <button 
                  onClick={() => setScanSuccess(false)}
                  className="text-[10px] font-mono underline opacity-80 hover:opacity-100"
                >
                  重置
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Level Grading Selector */}
        <div className="space-y-3">
          <label className="block text-xs font-serif text-slate-400 tracking-wider">
            选择线下考核实景环节
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {levels.map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => {
                  setSelectedLevelId(lvl.id);
                  synth.playSwipe();
                }}
                className={`py-3 px-4 text-left rounded-xl border transition-all flex flex-col justify-between h-20 ${
                  selectedLevelId === lvl.id
                    ? "bg-orange-500/10 border-orange-500 text-orange-400 shadow-md shadow-orange-500/5"
                    : "bg-white/5 border-white/5 hover:border-white/10 text-slate-300"
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="text-[10px] font-mono text-slate-400">Step {lvl.id}</span>
                  {passport.scoreHistory[lvl.id] !== undefined && (
                    <span className="flex items-center text-[9px] text-orange-400 font-bold">
                      ★{passport.scoreHistory[lvl.id]}
                    </span>
                  )}
                </div>
                <div className="text-xs font-serif font-bold truncate w-full">{lvl.title}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Level detailed specs */}
        {activeLevel && (
          <div className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-3">
            <h4 className="text-xs font-serif font-semibold text-orange-400 border-b border-white/5 pb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
              考核标准：{activeLevel.title}
            </h4>

            <div className="space-y-2 text-xs leading-relaxed text-slate-400">
              <p>
                <strong className="text-slate-300 font-serif">● 线下活动：</strong>
                {activeLevel.physicalActivity}
              </p>
              <p>
                <strong className="text-slate-300 font-serif">● 线上游戏：</strong>
                {activeLevel.digitalGameplay}
              </p>
              <p>
                <strong className="text-slate-300 font-serif">● 五星标准：</strong>
                <span className="text-orange-400/80">{activeLevel.successStandard}</span>
              </p>
            </div>
          </div>
        )}

        {/* Scoring control (1 to 5 stars) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-serif text-slate-400">点亮星级星等 (NPC星级评判)</label>
            <span className="text-sm font-semibold text-orange-400">{stars} 盏星灯</span>
          </div>

          <div className="flex justify-center items-center gap-2 bg-black/25 p-4 rounded-xl border border-white/5">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStars(s);
                  synth.playChime();
                }}
                className={`p-2 transition-transform active:scale-95 ${
                  s <= stars ? "text-orange-400 scale-110" : "text-slate-700 hover:text-slate-600"
                }`}
              >
                <Star className={`w-8 h-8 ${s <= stars ? "fill-orange-400" : ""}`} />
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Confirmation controller */}
      <div className="p-5 bg-black/30 border-t border-white/5 space-y-2">
        <button
          onClick={handleSubmitScore}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold tracking-widest text-xs uppercase rounded-xl hover:shadow-lg hover:shadow-orange-500/25 active:scale-[0.98] transition-all outline-none cursor-pointer"
        >
          <Zap className="w-4 h-4 fill-white" />
          确认授勋，点亮大印落落!
        </button>
        <p className="text-[10px] text-center text-slate-500 leading-normal">
          提示：NPC确认授勋后，孩子侧屏幕将在 0.5 秒内触发金色火漆大印震落及声光特效。
        </p>
      </div>

    </div>
  );
}
