/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { X, Star, Award, Download, Share2, MapPin, Sparkles, Shield, User } from "lucide-react";
import confetti from "canvas-confetti";
import { synth } from "../utils/audio";
import { GameLevel, UserPassport } from "../types";

interface LevelDetailModalProps {
  level: GameLevel;
  stars: number;
  passport: UserPassport;
  onClose: () => void;
}

// 5 unique dynamic SVG medals designed with elite traditional Chinese patterns
function MedalSvg({ levelId, familyName, childName, stars }: { levelId: string; familyName: string; childName: string; stars: number }) {
  const displayName = `${familyName || "李"}门${childName || "玄羽"}`;
  
  // Custom reusable gradients and filters for royal lacquer metallic feelings
  return (
    <div className="relative w-64 h-64 mx-auto drop-shadow-[0_0_25px_rgba(249,115,22,0.35)] hover:scale-105 transition-transform duration-300 select-none">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <radialGradient id="goldGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff3d1" />
            <stop offset="40%" stopColor="#dfb15b" />
            <stop offset="85%" stopColor="#b88c3a" />
            <stop offset="100%" stopColor="#553a0f" />
          </radialGradient>
          <linearGradient id="imperialGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffeaba" />
            <stop offset="50%" stopColor="#dfb15b" />
            <stop offset="100%" stopColor="#8c641d" />
          </linearGradient>
          <linearGradient id="jadeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#eefcf8" />
            <stop offset="40%" stopColor="#1ebd93" />
            <stop offset="100%" stopColor="#073f30" />
          </linearGradient>
          <linearGradient id="vermillionWax" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ff533d" />
            <stop offset="50%" stopColor="#cf2615" />
            <stop offset="100%" stopColor="#7a0d03" />
          </linearGradient>
          <radialGradient id="waterDeep" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#a5f3fc" />
            <stop offset="60%" stopColor="#0891b2" />
            <stop offset="100%" stopColor="#083344" />
          </radialGradient>
          <linearGradient id="woodScents" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#bbf7d0" />
            <stop offset="50%" stopColor="#15803d" />
            <stop offset="100%" stopColor="#14532d" />
          </linearGradient>
          
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. LEVEL ID "01" (Aura Awakening Jade Medal) */}
        {levelId === "01" && (
          <g>
            {/* Ambient Rotational ray backdrop */}
            <circle cx="100" cy="100" r="92" fill="none" stroke="#dfb15b" strokeWidth="1" strokeDasharray="3, 3" className="origin-center animate-[spin_50s_linear_infinite]" />
            {/* Outer Jade Ring */}
            <circle cx="100" cy="100" r="80" fill="url(#jadeGlow)" stroke="#dfb15b" strokeWidth="3" />
            <circle cx="100" cy="100" r="62" fill="none" stroke="#fff" strokeWidth="1" strokeOpacity="0.15" />
            {/* Inner Golden seal core */}
            <circle cx="100" cy="100" r="50" fill="url(#goldGlow)" stroke="#fff" strokeWidth="1.5" />
            
            {/* Traditional Chinese Cloud Swirls paths */}
            <path d="M 68 100 Q 80 85 92 100 Q 100 112 110 100 Q 120 90 132 100" fill="none" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.3" strokeDasharray="1,2" />
            <path d="M 72 115 Q 100 130 128 115" fill="none" stroke="#dfb15b" strokeWidth="1.5" strokeOpacity="0.5" />
            
            {/* Center Symbol character "启" */}
            <text x="100" y="112" fontFamily="serif" fontSize="32" fontWeight="900" fill="#52390b" textAnchor="middle" filter="drop-shadow(0px 1.5px 2px rgba(255,255,255,0.6))">
              启
            </text>
            
            <circle cx="100" cy="100" r="42" fill="none" stroke="#be8d36" strokeWidth="1.5" strokeDasharray="6,4" />
            
            {/* Arching gold labels */}
            <path id="archTextPath-1" d="M 45 155 A 72 72 0 0 1 155 155" fill="none" />
            <text fontSize="7" fontWeight="bold" fill="#fff" letterSpacing="0.2em">
              <textPath href="#archTextPath-1" startOffset="50%" textAnchor="middle">
                {displayName} • 灵气觉醒印信
              </textPath>
            </text>
          </g>
        )}

        {/* 2. LEVEL ID "02" (Divine Spring Purification Compass) */}
        {levelId === "02" && (
          <g>
            {/* Octagonal BaGua Compass Backing */}
            <polygon points="100,10 163,37 190,100 163,163 100,190 37,163 10,100 37,37" fill="url(#waterDeep)" stroke="url(#imperialGold)" strokeWidth="3" />
            <polygon points="100,20 156,43 180,100 156,157 100,180 44,157 20,100 44,43" fill="none" stroke="#fff" strokeWidth="1" strokeOpacity="0.2" />
            
            {/* Glowing circular waves */}
            <circle cx="100" cy="100" r="54" fill="url(#goldGlow)" stroke="#fff" strokeWidth="2.5" />
            
            {/* Aquatic Splash details */}
            <path d="M 70 100 C 70 80, 130 80, 130 100" fill="none" stroke="#0891b2" strokeWidth="2" strokeOpacity="0.4" />
            <path d="M 85 100 C 85 90, 115 90, 115 100" fill="none" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.5" />
            <circle cx="100" cy="65" r="4" fill="#a5f3fc" />
            <circle cx="82" cy="120" r="3" fill="#a5f3fc" />
            <circle cx="118" cy="120" r="3" fill="#a5f3fc" />
            
            {/* Center Symbol character "净" */}
            <text x="100" y="112" fontFamily="serif" fontSize="34" fontWeight="bold" fill="#3f2302" textAnchor="middle">
              净
            </text>
            
            {/* Gold details */}
            <circle cx="100" cy="100" r="46" fill="none" stroke="#cc9530" strokeWidth="1" strokeDasharray="3,3" />

            <path id="archTextPath-2" d="M 35 145 A 65 65 0 0 1 165 145" fill="none" />
            <text fontSize="7" fontWeight="bold" fill="#fff" letterSpacing="0.2em">
              <textPath href="#archTextPath-2" startOffset="50%" textAnchor="middle">
                {displayName} • 灵泉澄净勋印
              </textPath>
            </text>
          </g>
        )}

        {/* 3. LEVEL ID "03" (ShenNong Harvest Gold Seal) */}
        {levelId === "03" && (
          <g>
            <circle cx="100" cy="100" r="95" fill="none" stroke="#eab308" strokeWidth="1.5" strokeDasharray="6,6" className="origin-center animate-[spin_60s_linear_infinite]" />
            {/* Crest design */}
            <circle cx="100" cy="100" r="82" fill="url(#goldGlow)" stroke="url(#imperialGold)" strokeWidth="4" />
            
            {/* Wheat ears elements framing left and right */}
            <path d="M 35 110 Q 20 80 40 50 Q 50 65 35 110" fill="#eab308" fillOpacity="0.35" />
            <path d="M 165 110 Q 180 80 160 50 Q 150 65 165 110" fill="#eab308" fillOpacity="0.35" />
            
            <circle cx="100" cy="100" r="56" fill="#1e1b4b" stroke="url(#imperialGold)" strokeWidth="2.5" />
            
            {/* Radiating sunburst rays */}
            <path d="M 100 52 L 100 46 M 100 148 L 100 154 M 52 100 L 46 100 M 148 100 L 154 100" stroke="#fff" strokeWidth="2" strokeOpacity="0.5" />
            <path d="M 66 66 L 61 61 M 134 134 L 139 139 M 66 134 L 61 139 M 134 66 L 139 61" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.4" />
            
            {/* Center Symbol character "丰" */}
            <text x="100" y="112" fontFamily="serif" fontSize="33" fontWeight="bold" fill="url(#imperialGold)" textAnchor="middle" filter="url(#glow)">
              丰
            </text>

            <path id="archTextPath-3" d="M 40 150 A 65 65 0 0 1 160 150" fill="none" />
            <text fontSize="7.5" fontWeight="bold" fill="#fff" letterSpacing="0.25em">
              <textPath href="#archTextPath-3" startOffset="50%" textAnchor="middle">
                {displayName} • 五谷神农福印
              </textPath>
            </text>
          </g>
        )}

        {/* 4. LEVEL ID "04" (Ethereal Flora Herbal Seal) */}
        {levelId === "04" && (
          <g>
            {/* Lotus/Teardrop petalled ring */}
            <circle cx="100" cy="100" r="88" fill="none" stroke="#22c55e" strokeWidth="2" strokeOpacity="0.3" />
            <circle cx="100" cy="100" r="80" fill="url(#woodScents)" stroke="url(#imperialGold)" strokeWidth="3" />
            
            {/* Golden cloud-leaf details */}
            <circle cx="100" cy="100" r="56" fill="url(#goldGlow)" stroke="#fff" strokeWidth="1.5" />
            
            <path d="M 65 100 Q 82 75 100 100 Q 118 125 135 100" fill="none" stroke="#15803d" strokeWidth="1.5" strokeOpacity="0.3" />
            <path d="M 100 65 Q 120 80 100 100 Q 80 120 100 135" fill="none" stroke="#15803d" strokeWidth="1.5" strokeOpacity="0.3" />

            {/* Center Symbol character "香" */}
            <text x="100" y="112" fontFamily="serif" fontSize="31" fontWeight="bold" fill="#523204" textAnchor="middle">
              香
            </text>
            
            <circle cx="100" cy="100" r="45" fill="none" stroke="#a16207" strokeWidth="1" strokeDasharray="4,2" />

            <path id="archTextPath-4" d="M 40 152 A 65 65 0 0 1 160 152" fill="none" />
            <text fontSize="7" fontWeight="bold" fill="#fff" letterSpacing="0.2em">
              <textPath href="#archTextPath-4" startOffset="50%" textAnchor="middle">
                {displayName} • 百草通玄至宝
              </textPath>
            </text>
          </g>
        )}

        {/* 5. LEVEL ID "05" (Royal Firewax Capping Platinum Seal) */}
        {levelId === "05" && (
          <g>
            {/* Irregular melting fire-wax outer shape (Organic simulation) */}
            <path d="M100,5 C150,5 195,30 195,100 C195,155 155,195 100,195 C45,195 5,150 5,100 C5,30 50,5 100,5 Z" fill="url(#vermillionWax)" stroke="url(#imperialGold)" strokeWidth="3" />
            <path d="M100,12 C145,12 185,35 185,100 C185,150 150,185 100,185 C50,185 12,145 12,100 C12,35 55,12 100,12 Z" fill="none" stroke="#fff" strokeWidth="1" strokeOpacity="0.15" />
            
            {/* Grand Seal heavy core */}
            <circle cx="100" cy="100" r="54" fill="url(#goldGlow)" stroke="url(#vermillionWax)" strokeWidth="4" />
            <circle cx="100" cy="100" r="46" fill="none" stroke="#9a180c" strokeWidth="1.5" strokeDasharray="4,4" />
            
            {/* Dragon/Scroll cloud water stamps */}
            <path d="M 72 85 C 72 70, 128 70, 128 85" fill="none" stroke="#9a0d03" strokeWidth="1.5" strokeOpacity="0.4" />
            <path d="M 72 115 C 72 130, 128 130, 128 115" fill="none" stroke="#9a0d03" strokeWidth="1.5" strokeOpacity="0.4" />

            {/* Vertically Aligned Heavy Characters: "封藏" in center */}
            <text x="100" y="93" fontFamily="serif" fontSize="24" fontWeight="950" fill="#690a02" textAnchor="middle">
              封
            </text>
            <text x="100" y="119" fontFamily="serif" fontSize="24" fontWeight="950" fill="#690a02" textAnchor="middle">
              藏
            </text>

            <path id="archTextPath-5" d="M 32 148 A 68 68 0 0 1 168 148" fill="none" />
            <text fontSize="7" fontWeight="bold" fill="#fff" letterSpacing="0.25em">
              <textPath href="#archTextPath-5" startOffset="50%" textAnchor="middle">
                {displayName} • 皇家封坛大金印
              </textPath>
            </text>
          </g>
        )}
      </svg>
      {/* Dynamic Golden light ray reflection effect */}
      <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-transparent origin-center rotate-45 pointer-events-none mix-blend-overlay" />
    </div>
  );
}

export default function LevelDetailModal({ level, stars, passport, onClose }: LevelDetailModalProps) {
  
  // Custom appraisal database that matches levels and achieves rich noble-Chinese storytelling
  const getNpcAppraisal = (levelId: string, starCount: number) => {
    const fn = passport.familyName || "李";
    const cn = passport.childName || "玄羽";
    
    switch (levelId) {
      case "01":
        if (starCount >= 5) {
          return `「主评NPC·判官司」：${fn}门传子【${cn}】，华袍上身，器度凝山。对宗族金字招牌及古训之敬意，彰显世家涵养，双目澄澈有太真之风。特授满星觉醒大印，家学渊源，来日可期！`;
        } else if (starCount === 4) {
          return `「主评NPC·判官司」：${fn}氏子弟【${cn}】，衣冠楚楚。汉礼端庄，行动规整。虽首秀之余略显羞涩，唯心存敬畏、志向高远。予以四星勋勉，盼在后路中再创英绩！`;
        } else {
          return `「主评NPC·判官司」：【${cn}】尊子已顺利佩带功勋微章、披风服输。大典门开启，授勋三星，期盼往后步步攀登、渐入佳境！`;
        }
      case "02":
        if (starCount >= 5) {
          return `「主评NPC·守泉仙」：灵潭惊涛！【${cn}】身负秘钥，纵身涉险，一气呵成。其不畏清泡漫天，持法器水枪，弹无虚发，涤净四泽之邪祟。身手矫捷，灵动无双，授五星满星圣纪！`;
        } else if (starCount === 4) {
          return `「主评NPC·守泉仙」：涉水破雾，神情勇毅。在秘钥清流中明辨方向。偶有一靶脱空，但不气馁、重整鼓旗。功在不舍，授四星仙资！`;
        } else {
          return `「主评NPC·守泉仙」：勇破迷雾，初心不磨。花费余时稍多，然而恒心如铁、克尽全力。授勋三星，守得云开可见月明！`;
        }
      case "03":
        if (starCount >= 5) {
          return `「主评NPC·农司判官」：辨菽麦、识五谷。传子【${cn}】探摸老芦篓，指尖轻触、脱口即中。敬畏厚土馈赠，心存悲悯不浪。其清正笃实，极具神农丰实德操。合授五星神农福印！`;
        } else if (starCount === 4) {
          return `「主评NPC·农司判官」：能识香谷高粱，粗粮细理。亲尝稻谷之芒，目光专致。对农耕常识对答流利，举止落落大方。授四星五谷丰登标！`;
        } else {
          return `「主评NPC·农司判官」：求知敏健，学而时习。虽对陈皮之原植稍有差错，然一经指点茅塞顿开。孺子可教，授勋三星，多加博求！`;
        }
      case "04":
        if (starCount >= 5) {
          return `「主评NPC·闻香药王」：封眼静思，神接造化。【${cn}】摒弃五色烦扰，唯凭至极嗅觉，于檀皮、松木与糟糟甜香中瞬息点破迷宫，幽微毕现！灵台定力，旷古绝伦，钦授五星草圣尊印！`;
        } else if (starCount === 4) {
          return `「主评NPC·闻香药王」：气沉丹田，闭目专心。在多种天然本草中准确捕捉古松幽凉之韵，心细入微。虽有旁座微乱不为所惑。赐四星清芬金符！`;
        } else {
          return `「主评NPC·闻香药王」：初会心境盲嗅。虽略显浮躁，而后能掩耳调服呼吸、心有所定。赐三星，循此深造，灵台终有一日照耀！`;
        }
      case "05":
        if (starCount >= 5) {
          return `「大典主祭官」：手写家训，金砂泥印，百年不改，一诺千金！家长引笔、传人【${cn}】按红泥熔火漆，仪态尊崇。大印骤落，百年酒窖惊雷震响，声光成阵！五星极阶封藏大勋！`;
        } else if (starCount === 4) {
          return `「大典主祭官」：朱泥落契，印信如山。家风寄语言辞恳切，父子神合。在百年酒坛前落幅稳健。授勋四星，金漆封坛，世代永承！`;
        } else {
          return `「大典主祭官」：家族家训，誓印功成。虽火漆盖模稍有歪斜，然父子齐力心诚，陈酿入库，不堕家风。赐勋三星，传承绵延！`;
        }
      default:
        return `「现场真人NPC评委」：孩子在【${level.title}】的线下场景中表现极佳，星等灿烂！`;
    }
  };

  const handleSimulateSave = () => {
    synth.playChime();
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 },
      colors: ["#dfb15b", "#ef4444", "#ffffff"]
    });
    alert(`【模拟成功】\n「${level.title}」数字勋章大图已通过5G通道重新渲染为 4K 高保真透明PNG，并模拟保存至您的系统相册中！`);
  };

  const handleSimulateShare = () => {
    synth.playGoldSealStamp();
    alert(`【生成朋友圈代码】\n已复制专属文案：\n\n“今日小女/爱子于小小封藏传人实景剧游中，在【${level.title}】斩获最高评定！传承百世家训，落朱火漆。印成！”`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-[#020205]/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-6 select-none"
    >
      {/* Decorative Traditional Chinese Ink Waves background decor */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.06)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-lg bg-black/60 border border-white/10 rounded-[32px] p-6 md:p-8 space-y-6 relative shadow-2xl shadow-orange-500/5 overflow-hidden"
      >
        {/* Ancient border design inside modal */}
        <div className="absolute inset-2 md:inset-3.5 border border-white/5 rounded-[22px] pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/5 border border-white/5 text-slate-400 hover:text-white cursor-pointer hover:bg-white/10 transition-all z-20 outline-none"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1 relative z-10 pt-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-[10px] font-mono tracking-widest uppercase border border-orange-500/20">
            <Award className="w-3.5 h-3.5" />
            <span>完成度：STAGE 0{level.num} COMPLETED</span>
          </span>
          <h2 className="text-xl md:text-2xl font-serif font-bold text-white tracking-widest pt-2">
            「{level.title}」
          </h2>
          <p className="text-[11px] text-slate-400 font-serif">
            {level.subtitle}
          </p>
        </div>

        {/* Digital Medal Central Display */}
        <div className="flex flex-col items-center justify-center relative py-2">
          <MedalSvg 
            levelId={level.id}
            familyName={passport.familyName}
            childName={passport.childName}
            stars={stars}
          />
          <div className="mt-4 flex items-center justify-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < stars 
                    ? "text-orange-400 fill-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]" 
                    : "text-slate-700"
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] text-orange-400/80 font-mono tracking-widest mt-1">
            星级评定：{stars} / 5 盏尊贵世家星灯
          </span>
        </div>

        {/* NPC Review Appraisal Panel */}
        <div className="bg-black/30 p-5 rounded-2xl border border-white/5 relative bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.02)_0%,transparent_100%)]">
          <div className="flex items-center gap-2 text-xs font-serif text-slate-300 font-bold mb-2 pb-1.5 border-b border-white/5">
            <Shield className="w-4 h-4 text-orange-500" />
            <span>现场真人 NPC 秘传评语：</span>
          </div>
          <p className="text-xs md:text-sm font-serif text-slate-200 leading-relaxed italic pr-2">
            “ {getNpcAppraisal(level.id, stars)} ”
          </p>
        </div>

        {/* Footer actions for high-level fidelity */}
        <div className="grid grid-cols-2 gap-3.5 pt-2 relative z-10">
          <button
            onClick={handleSimulateSave}
            className="flex items-center justify-center gap-2 py-3.5 bg-white/5 hover:bg-white/10 active:scale-95 text-slate-200 border border-white/10 rounded-xl text-xs font-serif tracking-widest transition-all cursor-pointer outline-none"
          >
            <Download className="w-4 h-4 text-orange-400" />
            <span>保存高清勋章大图</span>
          </button>

          <button
            onClick={handleSimulateShare}
            className="flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-lg hover:shadow-orange-500/25 active:scale-95 text-white rounded-xl text-xs font-serif tracking-widest transition-all cursor-pointer outline-none font-bold"
          >
            <Share2 className="w-4 h-4" />
            <span>分享宗族传承勋绩</span>
          </button>
        </div>

        {/* Tiny foot note */}
        <div className="text-center">
          <span className="text-[9px] text-slate-500 font-serif">
            提示：大印已烙。此勋记受智慧合同保护，可随个人传记合订归档至百年档案馆。
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
