/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Camera, Image as ImageIcon, Send, Sparkles, Check } from "lucide-react";
import { synth } from "../utils/audio";
import { LivePhoto } from "../types";

interface PhotographerDashboardProps {
  onPhotoUploaded: (photo: LivePhoto) => void;
}

// Cinematic template photos representing traditional ritual and children's adventures
const PHOTO_TEMPLATES = [
  {
    caption: "#01 觉醒披风",
    location: "泰安院落 • 誓言台",
    url: "https://images.unsplash.com/photo-1519074069444-1ba4e66631d4?q=80&w=600&auto=format&fit=crop",
    motto: "王门秀木，有栋之姿。今日换装，觉醒百年风骨。"
  },
  {
    caption: "#02 灵泉汲水",
    location: "泰安水系 • 泡泡仙潭",
    url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=600&auto=format&fit=crop",
    motto: "上善若水，润泽灵心。清澈泉流，见证赤子初心。"
  },
  {
    caption: "#03 五谷辨粮",
    location: "神农百草 • 碧波鱼篓",
    url: "https://images.unsplash.com/photo-1574321024216-652a485c2bad?q=80&w=600&auto=format&fit=crop",
    motto: "知一粒之辛，种福泽之根。辨麦穗五谷，承稼穑之志。"
  },
  {
    caption: "#04 盲嗅百草",
    location: "本草香阁 • 嗅觉探秘",
    url: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600&auto=format&fit=crop",
    motto: "闻香识岁，陈皮高粱。纳天地之纯，澄内心之滤。"
  },
  {
    caption: "#05 火漆合印",
    location: "百年酒窖 • 大典礼堂",
    url: "https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?q=80&w=600&auto=format&fit=crop",
    motto: "红泥之约，火漆为盟。酒香渐醇，家风绵延百代。"
  },
  {
    caption: "#06 传人英姿",
    location: "白墙黛瓦 • 江南古楼",
    url: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=600&auto=format&fit=crop",
    motto: "青丝高束，衣袂飘扬。立志封藏，成就不世清流。"
  }
];

export default function PhotographerDashboard({ onPhotoUploaded }: PhotographerDashboardProps) {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [customCaption, setCustomCaption] = useState<string>("");
  const [sentMap, setSentMap] = useState<{ [key: number]: boolean }>({});

  const handleSendPhoto = (index: number) => {
    const template = PHOTO_TEMPLATES[index];
    
    const photo: LivePhoto = {
      id: `photo_${Date.now()}_${index}`,
      imageUrl: template.url,
      caption: template.caption + (customCaption ? ` - ${customCaption}` : ""),
      location: template.location,
      timestamp: new Date().toLocaleTimeString("zh-CN", { hour: 'numeric', minute: '2-digit', second: '2-digit' }),
      aiMotto: template.motto,
      savedToPoster: false
    };

    synth.playChime();
    onPhotoUploaded(photo);
    
    setSentMap((prev) => ({ ...prev, [index]: true }));
    setCustomCaption("");

    // Automatically fade checked status back after 2s
    setTimeout(() => {
      setSentMap((prev) => ({ ...prev, [index]: false }));
    }, 2500);
  };

  return (
    <div id="photographer-dashboard" className="h-full flex flex-col glass-panel text-slate-100 rounded-2xl overflow-hidden shadow-2xl select-none">
      
      {/* Cinematic camera style top header */}
      <div className="bg-black/30 px-6 py-4.5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <h2 className="text-sm font-serif font-semibold tracking-widest text-white flex items-center gap-2">
            <Camera className="w-4 h-4 text-cyan-400" />
            专业随行摄影端 (5G无线同步)
          </h2>
        </div>
        <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2.5 py-1 rounded-full border border-cyan-500/20 font-mono">
          WiFi 6 • LIVE
        </span>
      </div>

      <div className="p-6 flex-1 overflow-y-auto space-y-5">
        
        <p className="text-xs text-slate-400 leading-relaxed font-serif">
          活动现场跟拍摄影师采用 5G 相机实时上传精彩镜头。点击以下任何一张精选拍摄位，模拟瞬间将照片无线回传到该家庭的 H5 旅照长卷中。
        </p>

        {/* Cinematic Grid selection */}
        <div className="grid grid-cols-2 gap-4">
          {PHOTO_TEMPLATES.map((tpl, i) => (
            <div
              key={i}
              className={`relative rounded-xl overflow-hidden border bg-black/20 flex flex-col justify-between transition-all ${
                selectedIdx === i 
                  ? "border-cyan-400/80 ring-1 ring-cyan-400/30" 
                  : "border-white/5 hover:border-white/10"
              }`}
            >
              {/* Photo Frame */}
              <div 
                className="h-28 bg-cover bg-center relative cursor-pointer group"
                onClick={() => {
                  setSelectedIdx(i);
                  synth.playSwipe();
                }}
              >
                <img
                  src={tpl.url}
                  alt={tpl.caption}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                
                {/* Visual Location Overlay */}
                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/70 text-[8px] font-mono tracking-wider text-slate-300">
                  {tpl.location}
                </span>

                {selectedIdx === i && (
                  <span className="absolute top-1 left-1 px-2 py-0.5 rounded-md bg-cyan-400 text-black text-[8px] font-bold tracking-wider">
                    SELECTED
                  </span>
                )}
              </div>

              {/* Caption & Send */}
              <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-[11px] font-bold font-serif text-slate-200">{tpl.caption}</h3>
                  <p className="text-[9px] text-slate-500 font-mono truncate">{tpl.motto}</p>
                </div>

                <button
                  onClick={() => handleSendPhoto(i)}
                  className={`w-full py-2 rounded-lg flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider font-semibold transition-all cursor-pointer ${
                    sentMap[i]
                      ? "bg-emerald-500 text-black"
                      : "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20"
                  }`}
                >
                  {sentMap[i] ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>已成功传输</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>送入 H5 长卷</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Custom Caption modifier card */}
        <div className="bg-black/30 p-5 rounded-2xl border border-white/5 space-y-3.5">
          <label className="text-[11px] font-serif tracking-wider text-slate-400 block">
            附带现场摄影备注 (可留空)：
          </label>
          <input
            type="text"
            placeholder="例如: 玄羽跟爸爸一同按泥印，笑得十分灿烂..."
            value={customCaption}
            onChange={(e) => setCustomCaption(e.target.value)}
            className="w-full glass-input text-slate-200 text-xs rounded-xl px-4 py-2.5 outline-none focus:border-cyan-400/80 transition-all font-serif"
          />

          <div className="bg-cyan-500/5 p-3.5 rounded-xl border border-cyan-500/10 flex gap-2.5 items-start text-[10px] text-cyan-400/80 leading-normal">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-orange-400" />
            <span>
              传输照片时，H5 系统的 AI 模块将结合孩子名称与该打卡位置，自动渲染古风赞颂箴言，极易激发家长在朋友圈社交分享的意图。
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
