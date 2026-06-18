/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { Award, Zap, Star, ShieldAlert, Sparkles, Smile } from "lucide-react";
import { synth } from "../utils/audio";

interface LeaderboardRankProps {
  childName: string;
  familyName: string;
  avatarStyle: string;
  scoreHistory: { [levelId: string]: number };
}

interface SimulatedKid {
  name: string;
  avatar: string;
  score: number;
  isUser?: boolean;
}

const SHANG_KIDS: SimulatedKid[] = [
  { name: "赵门沐辰", avatar: "汉服玄衣", score: 23 },
  { name: "钱门梓轩", avatar: "汉服赤袍", score: 21 },
  { name: "孙门雨泽", avatar: "汉服金羽", score: 19 },
  { name: "周门若云", avatar: "汉服青衣", score: 17 },
  { name: "吴门诗涵", avatar: "汉服青衣", score: 12 },
];

export default function LeaderboardRank({
  childName,
  familyName,
  avatarStyle,
  scoreHistory,
}: LeaderboardRankProps) {
  // Sum up user's stars
  const userStars = Object.values(scoreHistory).reduce((sum, s) => sum + s, 0);
  const userScore = userStars * 5; // Scaling factor for game flavor

  const userDisplayName = familyName && childName ? `${familyName}门${childName}` : "待注册传人";

  // Synthesize leaderboard list
  const fullList: SimulatedKid[] = [
    ...SHANG_KIDS,
    {
      name: userDisplayName,
      avatar: avatarStyle,
      score: userScore,
      isUser: true,
    },
  ];

  // Sort list descending
  const sortedList = [...fullList].sort((a, b) => b.score - a.score);
  const userRank = sortedList.findIndex((k) => k.isUser) + 1;

  // Evening script role priority list
  const getRoleForRank = (rank: number) => {
    switch (rank) {
      case 1:
        return "时间灵官 (主位大主角)";
      case 2:
        return "封藏大掌柜 (二序高主角)";
      case 3:
        return "灵泉守护神 (前排要角)";
      case 4:
        return "百草小药圣 (特色主配)";
      default:
        return "六粮丰收仙童 (经典配角)";
    }
  };

  return (
    <div className="w-full bg-stone-950/80 rounded-2xl p-4 border border-orange-900/35 space-y-4 select-none text-left">
      <div className="space-y-1.5 pb-2.5 border-b border-stone-900 flex justify-between items-end">
        <div>
          <span className="text-[9px] tracking-widest text-[#dfb15b] uppercase font-mono block">Real-time Cultivation Leaderboard</span>
          <h4 className="text-sm font-serif font-bold text-slate-100 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-orange-400" />
            <span>【本场传子·修为风云榜】</span>
          </h4>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
          <span className="text-[8px] text-stone-500 font-mono tracking-wide uppercase">LIVE UPDATED</span>
        </div>
      </div>

      {/* Brief explanation */}
      <p className="text-[10px] text-stone-400 font-serif leading-relaxed">
        🥇 <strong>晚宴选角权：</strong>总积分排名前列的孩子，有权优先选择晚宴舞台短剧<strong>《时光的礼物》</strong>中的核心主角配演，星级越多，角色特权越大！
      </p>

      {/* Leaderboard Stack */}
      <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
        {sortedList.map((k, index) => {
          const rankNo = index + 1;
          const isUserObj = k.isUser;
          
          return (
            <div
              key={k.name}
              className={`flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs ${
                isUserObj
                  ? "bg-gradient-to-r from-amber-500/15 to-orange-500/5 border-orange-500 shadow-md shadow-orange-500/5"
                  : "bg-stone-900/40 border-stone-900 text-stone-400"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-[120px]">
                {/* Ranking digit */}
                <div className={`w-4.5 h-4.5 rounded-full text-center flex items-center justify-center font-mono text-[9.5px] font-bold ${
                  rankNo === 1 
                    ? "bg-amber-500 text-black" 
                    : rankNo === 2 
                    ? "bg-stone-400 text-black" 
                    : rankNo === 3 
                    ? "bg-amber-800 text-stone-100" 
                    : "bg-stone-950 text-stone-500 border border-stone-800"
                }`}>
                  {rankNo}
                </div>

                <div className="space-y-0.5">
                  <div className={`font-serif font-semibold text-[11px] ${isUserObj ? "text-orange-400 font-bold" : "text-stone-300"}`}>
                    {k.name} {isUserObj && <span className="text-[8px] bg-orange-500/10 text-orange-400 px-1 border border-orange-500/20 rounded scale-90 ml-0.5">我</span>}
                  </div>
                  <div className="text-[8px] text-stone-500 font-serif">{k.avatar}</div>
                </div>
              </div>

              {/* Evening Stage selection priority */}
              <div className="text-[9.5px] font-serif text-slate-400 max-w-[120px] truncate text-right">
                {getRoleForRank(rankNo).split(" (")[0]}
              </div>

              {/* Score stars */}
              <div className="font-mono text-[10.5px] text-[#dfb15b] font-bold tracking-tight text-right flex items-center gap-0.5 select-none">
                <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                <span>{k.score}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* User's Current Privilege Card */}
      {familyName && childName ? (
        <div className="p-3 bg-stone-900/60 rounded-xl border border-stone-850 flex items-start gap-2.5 justify-between">
          <div className="space-y-1">
            <span className="block text-[8px] text-stone-500 font-serif">您当前晚宴选角特权：</span>
            <div className="text-[10px] text-stone-200 font-serif leading-relaxed">
              排名第 <span className="text-orange-400 font-bold font-mono text-xs">#{userRank}</span>，享有 <strong className="text-orange-400">{getRoleForRank(userRank)}</strong> 改选权！
            </div>
          </div>
          <div className="p-1 px-2.5 bg-[#dfb15b]/5 text-[#dfb15b] border border-[#dfb15b]/10 rounded-lg text-[9px] font-serif text-center shrink-0">
            星级：{userStars || 0}★
          </div>
        </div>
      ) : (
        <div className="text-[9.5px] text-stone-500 italic text-center font-serif">
          * 请先注册激活您的传人护照以查看修为选角排名
        </div>
      )}
    </div>
  );
}
