/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Info, BookOpen, Wind, Search, CheckCircle2 } from "lucide-react";
import { synth } from "../utils/audio";

interface Herb {
  name: string;
  category: "grain" | "herb" | "flower" | "wood";
  aroma: string;
  lore: string;
  heritagePct: number;
}

const BO_HERBS: Herb[] = [
  { name: "红甸高粱", category: "grain", aroma: "甜香浓郁、温润糟甜", lore: "封藏酿造之骨干。含丰富单宁，高温蒸煮发出特写迷人的粮甜之香。", heritagePct: 95 },
  { name: "白皮糯米", category: "grain", aroma: "软糯纯粹、香气柔顺", lore: "成酒甜净醇厚之源。黏性极佳，在微孔发酵中转化为甘洌蜜意的酒体。", heritagePct: 88 },
  { name: "泰安麦穗", category: "grain", aroma: "麦焦纯香、底味浑厚", lore: "大曲发酵承载体。培养出万种奇妙微生物，奠定百草底气与骨架。", heritagePct: 90 },
  { name: "百脉灵泉水", category: "wood", aroma: "幽冷清冽、甘口无沙", lore: "泉水出太真灵谷，含有天然丰富微量元素，是酿酒血脉生命体。", heritagePct: 100 },
  { name: "川崃人参", category: "herb", aroma: "参苦温阳、药香甘苦", lore: "取药珍之气入曲。醇香深稳，在陈年封藏中产生丰盈的老药酒韵味。", heritagePct: 85 },
  { name: "香阁新陈皮", category: "herb", aroma: "苦橘甘清、草本新凉", lore: "化浊理气。经百年木桶陈化，散出丝丝甜橘苦辛的独创幽雅香气。", heritagePct: 80 },
  { name: "终南野菊花", category: "flower", aroma: "芬芳寒馥、清雅出尘", lore: "九月山寒，采霜菊之冠。酒醅入窖时配比微量，出酒带清冷花韵。", heritagePct: 75 },
  { name: "云岭古苍松", category: "wood", aroma: "松胶柏叶、深邃冷寂", lore: "香冠森林。取鲜嫩针叶熏蒸，能中和酒醅杂味，现出风起古殿的幽冷高旷之感。", heritagePct: 82 },
];

export default function BotanicalLibrary() {
  const [selectedHerb, setSelectedHerb] = useState<Herb | null>(BO_HERBS[0]);
  const [filter, setFilter] = useState<"all" | "grain" | "herb" | "wood">("all");

  const filteredHerbs = BO_HERBS.filter(
    (h) => filter === "all" || h.category === filter
  );

  const selectHerb = (h: Herb) => {
    synth.playSwipe();
    setSelectedHerb(h);
  };

  return (
    <div className="w-full bg-stone-950/85 rounded-2xl p-4 border border-amber-900/40 space-y-4 select-none">
      
      <div className="space-y-1 text-center">
        <span className="text-[9px] tracking-widest text-[#dfb15b] uppercase font-mono block">Offline Trial Assistance</span>
        <h4 className="text-sm font-serif font-bold text-slate-100 flex items-center justify-center gap-1.5">
          <BookOpen className="w-4 h-4 text-orange-400" />
          <span>20+天然本草与酿酒原料云图谱</span>
        </h4>
        <p className="text-[10px] text-stone-400 font-serif leading-relaxed px-2">
          现场正进行线下【气味拼图】盲嗅竞技！这里为您提供酿酒经典作物品鉴，助您在现场10秒辨出3种草本组合，赢取满星！
        </p>
      </div>

      {/* Categories filters */}
      <div className="flex gap-1.5 justify-center py-1 border-t border-b border-stone-900">
        {[
          { id: "all", label: "全部原料" },
          { id: "grain", label: "五谷六粮" },
          { id: "herb", label: "汉方本草" },
          { id: "wood", label: "灵泉灵柏" },
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => { setFilter(btn.id as any); synth.playSwipe(); }}
            className={`px-2.5 py-1 rounded text-[9px] font-serif transition-colors cursor-pointer outline-none ${
              filter === btn.id
                ? "bg-[#dfb15b]/20 text-[#dfb15b] border border-[#dfb15b]/40"
                : "bg-stone-900 text-stone-500 hover:text-stone-300"
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Grid listing */}
      <div className="grid grid-cols-4 gap-1.5">
        {filteredHerbs.map((h) => (
          <button
            key={h.name}
            onClick={() => selectHerb(h)}
            className={`py-2 rounded-lg border flex flex-col items-center justify-center text-center gap-1 transition-all outline-none cursor-pointer ${
              selectedHerb?.name === h.name
                ? "bg-amber-500/10 border-orange-500 scale-105"
                : "bg-stone-950 border-stone-900 hover:border-stone-800"
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${
              h.category === "grain" ? "bg-amber-500" : h.category === "herb" ? "bg-emerald-500" : "bg-cyan-500"
            }`} />
            <span className="text-[9.5px] font-serif font-bold text-stone-200 truncate max-w-[55px]">
              {h.name.slice(2)}
            </span>
          </button>
        ))}
      </div>

      {/* Details reader panel */}
      <AnimatePresence mode="wait">
        {selectedHerb && (
          <motion.div
            key={selectedHerb.name}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-black/30 p-3.5 rounded-xl border border-white/5 space-y-2 text-left"
          >
            <div className="flex justify-between items-center pb-1.5 border-b border-stone-900/60 text-[10px]">
              <div className="flex items-center gap-1 font-serif text-slate-200 font-bold">
                <Wind className="w-3.5 h-3.5 text-orange-500" />
                <span>{selectedHerb.name}</span>
              </div>
              <span className="text-orange-400 font-mono scale-90">宿灵值 {selectedHerb.heritagePct}%</span>
            </div>

            <p className="text-[10px] text-[#dfb15b] font-serif leading-relaxed">
              <strong>气味感知：</strong>“ {selectedHerb.aroma} ”
            </p>
            <p className="text-[10px] text-stone-400 font-serif leading-relaxed">
              <strong>传承本草经：</strong>{selectedHerb.lore}
            </p>

            <div className="bg-[#dfb15b]/5 p-2 rounded text-[8.5px] text-stone-500 font-serif leading-relaxed flex items-start gap-1 justify-between">
              <span>💡 竞赛秘诀：现场主理NPC给您盲嗅瓶前，请调平呼吸，若闻出“{selectedHerb.aroma.split("、")[0]}”，即为【{selectedHerb.name}】！</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-stone-900/40 p-2.5 rounded-xl border border-stone-850 text-center">
        <span className="text-[8.5px] text-stone-500 font-serif">
          🌾 线下气味拼图共含本草24科，请在现场药王香阁内完成。
        </span>
      </div>

    </div>
  );
}
