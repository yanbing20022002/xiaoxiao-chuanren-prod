/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { GameLevel, UserPassport, LivePhoto, LevelStatus } from "./types";
import PrerollIntro from "./components/PrerollIntro";
import ParallaxScrollH5 from "./components/ParallaxScrollH5";
import NpcDashboard from "./components/NpcDashboard";
import PhotographerDashboard from "./components/PhotographerDashboard";
import LevelDetailModal from "./components/LevelDetailModal";
import { 
  Sparkles, ShieldCheck, Cpu, Terminal, Zap, Info, 
  RefreshCcw, Volume2, HelpCircle, Flame, Eye
} from "lucide-react";
import { synth } from "./utils/audio";

// Initializing the 5 offline physical tasks specified in the CEO bottom-line (底案)
const INITIAL_LEVELS: GameLevel[] = [
  {
    id: "01",
    num: 1,
    title: "身份觉醒 (Awakening)",
    subtitle: "领取传人护照、换上皇家古风斗篷、佩戴功勋徽章。",
    physicalActivity: "现场签到处：挑选属于孩子性格色彩的汉服斗篷，拍摄传人定帧登记照。",
    digitalGameplay: "【觉醒动画】水墨滴入画面，根据输入的家族姓氏与名字实时激活传人背景与云端护照。",
    successStandard: "特制斗篷着装合格、打卡上传照片即激活 1 星灵气准入勋章。",
    stars: 0,
    status: LevelStatus.ACTIVE,
    parallaxOffset: 0
  },
  {
    id: "02",
    num: 2,
    title: "天酿广场-灵泉守护战 (Pure Springs)",
    subtitle: "在水雾气泡池中限时捞取五色灵石，并用高压水枪击落移动的浊气标靶。",
    physicalActivity: "现场天酿湖：身披斗篷穿戴护目镜进行打点，投掷浮网捞取五色夜光石，使用实物体感水枪除浊。",
    digitalGameplay: "【双阶保卫战】线上限时捕捞五色宝石泡泡，并在下一阶段使用手指触控水枪准星击中飘荡的浊魔标靶。",
    successStandard: "小于15秒内抓满8个彩色灵气泡泡，且15s内击中5个怪雾，即可收获5星卓越功勋。",
    stars: 0,
    status: LevelStatus.LOCKED,
    parallaxOffset: 120
  },
  {
    id: "03",
    num: 3,
    title: "泰安作坊-六粮鱼庆丰收 (Grains Search)",
    subtitle: "泰安作坊：在碧波作坊池塘中，快速捕捞印有不同谷物名状的六粮好运神鱼！",
    physicalActivity: "现场丰收浅水滩：挽起裤管用竹网捞鱼，说出鱼腹贴着的谷物名称：高粱、稻谷、小麦等以认领岁粮袋。",
    digitalGameplay: "【鱼跃丰饶画】线上捕捞池塘中环游滑溜的六粮谷物神鱼。收获满筐后在古书账本落印认领丰收星力。",
    successStandard: "捕满8条印有五谷名称的特种好运神鱼并准确辨析谷物品种特性考评5星好成绩。",
    stars: 0,
    status: LevelStatus.LOCKED,
    parallaxOffset: 240
  },
  {
    id: "04",
    num: 4,
    title: "自然闻香识 (Blind Smelling)",
    subtitle: "蒙眼在本草陈列中通过超凡嗅觉识别高粱香、陈皮香、松木熟气。",
    physicalActivity: "蒙眼互动香阁：通过盲嗅，在20种汉方草本与陈化糟香中辨识主要发酵原料组合。",
    digitalGameplay: "【气味拼图】H5展示云蒙迷雾森林，根据线下盲嗅出的气味点亮对应的本草香料图案。",
    successStandard: "盲嗅在10秒内精准说出3种以上自然植物发酵原味组合获 5 星极高段位考评。",
    stars: 0,
    status: LevelStatus.LOCKED,
    parallaxOffset: 360
  },
  {
    id: "05",
    num: 5,
    title: "封藏大典 (Grand Seal)",
    subtitle: "百年地下酒窖：写家训寄语、在酒坛盖朱泥手印、熔合火漆成约。",
    physicalActivity: "终极封藏堂：家长携子书写家训卷轴，按红泥掌印，在百年坛口注入火漆，盖皇家大金印。",
    digitalGameplay: "【契约落成】点击点亮。屏幕模拟火漆溶化、巨印震落炸开声光电金粉，生成专属数字酒坛。",
    successStandard: "NPC现场评估亲子封盖仪式专注度、家风家训精神投入及火漆契约落成度评5星。",
    stars: 0,
    status: LevelStatus.LOCKED,
    parallaxOffset: 480
  }
];

const INITIAL_PASSPORT: UserPassport = {
  childName: "",
  familyName: "",
  customMotto: "",
  avatarStyle: "汉服青衣",
  activated: false,
  scoreHistory: {}
};

export default function App() {
  const [hasCompletedIntro, setHasCompletedIntro] = useState<boolean>(false);
  const [levels, setLevels] = useState<GameLevel[]>(INITIAL_LEVELS);
  const [passport, setPassport] = useState<UserPassport>(INITIAL_PASSPORT);
  const [photos, setPhotos] = useState<LivePhoto[]>([]);
  const [activeConsoleTab, setActiveConsoleTab] = useState<"npc" | "photo" | "logs">("npc");
  const [selectedCompletedLevel, setSelectedCompletedLevel] = useState<GameLevel | null>(null);
  
  // High-performance real-time virtual trigger event queue
  const [lastTriggeredStamp, setLastTriggeredStamp] = useState<{
    levelId: string;
    stars: number;
    timestamp: number;
  } | null>(null);

  const [socketLogs, setSocketLogs] = useState<Array<{ time: string; msg: string; type: "info" | "success" | "warning" }>>([
    { time: new Date().toLocaleTimeString(), msg: "智能信道初始化成功。监听WebSocket端口：3000", type: "info" },
    { time: new Date().toLocaleTimeString(), msg: "等待孩子端护照号唤醒...", type: "warning" }
  ]);

  const addLog = (msg: string, type: "info" | "success" | "warning" = "info") => {
    setSocketLogs((prev) => [
      { time: new Date().toLocaleTimeString(), msg, type },
      ...prev.slice(0, 18) // Cap logs
    ]);
  };

  // Callback: User edits passport details (awakening)
  const handleUpdatePassport = (updatedFields: Partial<UserPassport>) => {
    const nextPassport = { ...passport, ...updatedFields };
    setPassport(nextPassport);

    if (updatedFields.activated) {
      addLog(`[护照登录] 传人注册成功: ${nextPassport.familyName}氏世家子弟【${nextPassport.childName}】激活 ${nextPassport.avatarStyle}`, "success");
      // Advance first level status
      updateLevelStatuses(nextPassport.scoreHistory);
    }
  };

  // Helper: Computes who is locked vs completed
  const updateLevelStatuses = (history: { [levelId: string]: number }) => {
    setLevels((current) =>
      current.map((lvl) => {
        const isCompleted = history[lvl.id] !== undefined;
        let status = LevelStatus.LOCKED;
        
        if (isCompleted) {
          status = LevelStatus.COMPLETED;
        } else {
          // If previous is completed, this one is active (or if it's the very first level)
          const prevIdNum = parseInt(lvl.id) - 1;
          const prevIdStr = prevIdNum > 0 ? `0${prevIdNum}` : null;
          
          if (!prevIdStr || history[prevIdStr] !== undefined) {
            status = LevelStatus.ACTIVE;
          }
        }
        
        return { ...lvl, status };
      })
    );
  };

  // Callback: Live real-time NPC scoring trigger
  const handleNpcScoreLevel = (levelId: string, stars: number) => {
    const targetLevel = levels.find((l) => l.id === levelId);
    if (!targetLevel) return;

    addLog(`[真人NPC交互] 正在提交授勋信道: 关卡 ${levelId} "${targetLevel.title}" -> ${stars} 星等`, "info");
    
    // 1. Instantly trigger state change 
    const updatedHistory = { ...passport.scoreHistory, [levelId]: stars };
    
    // Simulate instantaneous WebSocket transmission loop in < 150ms
    setTimeout(() => {
      setPassport((prev) => ({
        ...prev,
        scoreHistory: updatedHistory
      }));
      
      updateLevelStatuses(updatedHistory);
      
      // Update WebSocket virtual channel metrics
      setLastTriggeredStamp({ levelId, stars, timestamp: Date.now() });

      addLog(`[WebSocket推送] 星级评级打包传送成功！孩子端已渲染金色大印击落特效 (延时: 45ms)`, "success");
    }, 150);
  };

  // Callback: Dynamic photo upload
  const handlePhotoUploaded = (photo: LivePhoto) => {
    setPhotos((prev) => [photo, ...prev]);
    addLog(`[跟拍相片回传] 相机 (A7M4-5G) 捕获一帧 ${photo.caption}。坐标: ${photo.location}。照片长卷已更新！`, "success");
  };

  const handleClearScore = () => {
    setPassport(INITIAL_PASSPORT);
    setLevels(INITIAL_LEVELS);
    setPhotos([]);
    setLastTriggeredStamp(null);
    addLog("[重置系统] 所有传人历史数据、照片长卷及授勋进度清除成功。", "warning");
  };

  return (
    <div className="min-h-screen bg-[#020205] text-[#f8fafc] flex flex-col justify-between font-sans selection:bg-orange-500/30 select-none overflow-x-hidden relative">
      
      {/* Absolute Decorative Ambient Background Gradients for physical feeling (Frosted Glass Theme) */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#0a0a1a] via-[#020205] to-[#1a1005] opacity-90 pointer-events-none" />
      <div className="absolute top-10 left-10 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Main Top Brand Banner Bar (Frosted Glass style) */}
      <header className="relative z-20 flex flex-col md:flex-row items-center justify-between gap-4 px-8 py-5 border-b border-white/5 bg-black/30 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-black shadow-lg shadow-orange-500/20">
            <Flame className="w-5 h-5 fill-black animate-pulse" />
          </span>
          <div>
            <h1 className="text-lg font-serif font-semibold tracking-[0.25em] text-white">「小小封藏传人」实景剧游系统</h1>
            <p className="text-[10px] text-orange-400 font-mono tracking-widest uppercase font-light">Director's Cinematic Sandbox Console</p>
          </div>
        </div>

        {/* Global audit credentials */}
        <div className="flex items-center gap-4 text-xs font-serif bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm">
          <div className="flex items-center gap-1.5 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-orange-500" />
            <span>CEO 体验版：</span>
            <span className="text-emerald-400 font-mono text-[10px]">STABLE_BUILD_V4.2.0</span>
          </div>
        </div>
      </header>

      {/* Workspace Body Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch z-10 overflow-hidden">
        
        {/* COMPONENT 1: THE ACTIVE PHONE SIMULATOR H5 VIEW (Cols 5) */}
        <div className="lg:col-span-5 flex flex-col justify-center items-center relative">
          
          {/* Mobile phone bezel shadow styling */}
          <div className="relative w-full max-w-[412px]">
            
            {/* Outer golden rim shadow and speakers */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-32 h-4.5 bg-stone-900 rounded-b-2xl z-40 flex items-center justify-around px-4 border border-stone-800">
              <span className="w-12 h-1 bg-black rounded-full" />
              <span className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
            </div>

            {/* Cinematic Pre-roll Movie Intro Cover Overlay */}
            {!hasCompletedIntro ? (
              <div className="absolute inset-0 z-50 rounded-[32px] overflow-hidden">
                <PrerollIntro onComplete={() => {
                  setHasCompletedIntro(true); 
                  addLog("电影级15s预告片播映结束。孩子端激活，加载「时间长卷」", "success");
                }} />
              </div>
            ) : null}

            {/* Inner responsive H5 client core viewport */}
            <ParallaxScrollH5 
              levels={levels}
              passport={passport}
              photos={photos}
              onUpdatePassport={handleUpdatePassport}
              onClearScore={handleClearScore}
              lastTriggeredStamp={lastTriggeredStamp}
              onCompletedLevelClick={(lvl) => {
                setSelectedCompletedLevel(lvl);
                synth.playChime();
              }}
            />

          </div>

          {/* Quick guide under phone */}
          <div className="text-center mt-3 max-w-[340px]">
            <p className="text-[11px] text-slate-400 font-serif leading-relaxed">
              * 提示：上方模拟了在手机端（或护照手环）呈现的界面。
              {!hasCompletedIntro 
                ? "请先点击【踏浪入卷】观看15s金墨晕染的视听过场。" 
                : "现在您可以在右方模拟NPC刷卡点亮与摄影老师拍照了！"
              }
            </p>
          </div>

        </div>

        {/* COMPONENT 2: THE COORDINATOR INTERACTION CONTROL CONSOLE (Cols 7) */}
        <div className="lg:col-span-7 flex flex-col gap-5 justify-between">
          
          {/* Console top tabs using Frosted Glass */}
          <div className="glass-pill p-1.5 rounded-2xl flex gap-2 shrink-0">
            <button
              onClick={() => { setActiveConsoleTab("npc"); synth.playSwipe(); }}
              className={`flex-1 py-3 rounded-xl text-xs tracking-wider transition-all font-serif flex items-center justify-center gap-2 outline-none ${
                activeConsoleTab === "npc"
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold font-serif shadow-lg shadow-orange-500/25"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>真人 NPC 授勋控制舱</span>
            </button>

            <button
              onClick={() => { setActiveConsoleTab("photo"); synth.playSwipe(); }}
              className={`flex-1 py-3 rounded-xl text-xs tracking-wider transition-all font-serif flex items-center justify-center gap-2 outline-none ${
                activeConsoleTab === "photo"
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold font-serif shadow-lg shadow-orange-500/25"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>摄影师跟拍传输端</span>
            </button>

            <button
              onClick={() => { setActiveConsoleTab("logs"); synth.playSwipe(); }}
              className={`flex-1 py-3 rounded-xl text-xs tracking-wider transition-all font-serif flex items-center justify-center gap-2 outline-none ${
                activeConsoleTab === "logs"
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold font-serif shadow-lg shadow-orange-500/25"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>智能云传输网关监控</span>
            </button>
          </div>

          {/* Active controller body */}
          <div className="flex-1 min-h-[460px]">
            {activeConsoleTab === "npc" && (
              <NpcDashboard 
                levels={levels}
                passport={passport}
                onUpdateScore={handleNpcScoreLevel}
              />
            )}

            {activeConsoleTab === "photo" && (
              <PhotographerDashboard 
                onPhotoUploaded={handlePhotoUploaded}
              />
            )}

            {activeConsoleTab === "logs" && (
              <div className="glass-panel rounded-2xl h-full p-6 font-mono text-xs flex flex-col shadow-2xl relative select-none">
                
                {/* Header dashboard info */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-ping" />
                    <span className="text-slate-300 font-bold uppercase tracking-wider text-[11px]">WebSocket Raw Signal Terminal</span>
                  </div>
                  <button
                    onClick={() => {
                      setSocketLogs([
                        { time: new Date().toLocaleTimeString(), msg: "WebSocket传输日志重置成功。", type: "info" }
                      ]);
                      synth.playSwipe();
                    }}
                    className="text-slate-500 hover:text-orange-400 flex items-center gap-1 text-[10px] transition-colors"
                  >
                    <RefreshCcw className="w-3 h-3" />
                    <span>清空信道</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 mt-4 pr-2">
                  {socketLogs.map((log, i) => (
                    <div 
                      key={i} 
                      className={`ps-3.5 border-l-2 py-1 flex items-start justify-between text-[11px] font-mono gap-4 leading-relaxed ${
                        log.type === "success" 
                          ? "border-emerald-500 text-emerald-400/90" 
                          : log.type === "warning"
                          ? "border-orange-500 text-orange-400/80"
                          : "border-blue-500 text-slate-400/90"
                      }`}
                    >
                      <div>
                        <span className="text-slate-600 mr-2">[{log.time}]</span>
                        <span>{log.msg}</span>
                      </div>
                      
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-white/5 border border-white/5 rounded shrink-0 text-slate-500">
                        {log.type}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footnote details */}
                <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10 flex gap-3 items-start text-[10px] text-slate-400 font-serif leading-relaxed">
                  <Info className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <p>
                    这里展示的是仿真 WebSocket 信道传输信号。在真实 2天1夜 线下实景区中，当跟配相机拍下照片或评判官大印触下瞬间，系统利用 WebSocket 向在场的孩子手环屏幕推送最新状态。推送延时常年控制在 150 毫秒至 1.5 秒内，最大化保证实景沉浸感。
                  </p>
                </div>

              </div>
            )}
          </div>

        </div>

      </main>

      {/* Corporate design block footer */}
      <footer className="bg-black/40 border-t border-white/5 px-6 py-5 text-center text-[11px] text-slate-500 font-serif shrink-0">
        <p>「小小封藏传人」实景剧游数智H5配套系统 • 电影级封藏手泽契约落成</p>
        <p className="mt-1.5 font-mono text-[9px] text-slate-600 uppercase tracking-widest">
          Confidential for Internal Audits Only • Copyright © 2026 Hermes Club. All rights reserved.
        </p>
      </footer>

      {/* Completed Level Detail Overlay Modal */}
      {selectedCompletedLevel && (
        <LevelDetailModal
          level={selectedCompletedLevel}
          stars={passport.scoreHistory[selectedCompletedLevel.id] || 5}
          passport={passport}
          onClose={() => {
            setSelectedCompletedLevel(null);
            synth.playSwipe();
          }}
        />
      )}

    </div>
  );
}
