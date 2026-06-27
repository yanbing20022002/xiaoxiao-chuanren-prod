/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChangeEvent, useMemo, useRef, useState } from "react";
import {
  Camera,
  Image as ImageIcon,
  Send,
  Sparkles,
  Check,
  QrCode,
  Upload,
  UserRoundCheck,
  RefreshCcw,
  Search
} from "lucide-react";
import { synth } from "../utils/audio";
import { LivePhoto, UserPassport } from "../types";
import { PassportRecord } from "../utils/passport";
import { maskPhone } from "../utils/customerAccess";

interface PhotographerDashboardProps {
  passport: UserPassport;
  photos: LivePhoto[];
  activePassportId: string;
  recentPassportRecords: PassportRecord[];
  onPhotoUploaded: (photo: LivePhoto) => Promise<{ ok: boolean; message: string }>;
  onScanPassport: (rawValue: string) => Promise<{ ok: boolean; message: string }>;
  onClearSelection: () => void;
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

export default function PhotographerDashboard({
  passport,
  photos,
  activePassportId,
  recentPassportRecords,
  onPhotoUploaded,
  onScanPassport,
  onClearSelection
}: PhotographerDashboardProps) {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [customCaption, setCustomCaption] = useState<string>("");
  const [sentMap, setSentMap] = useState<{ [key: number]: boolean }>({});
  const [scanInput, setScanInput] = useState("");
  const [scanFeedback, setScanFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [uploadLocation, setUploadLocation] = useState<string>("摄影师现场抓拍位");
  const [uploadLabel, setUploadLabel] = useState<string>("现场抓拍");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recentRecords = useMemo(() => recentPassportRecords.slice(0, 8), [recentPassportRecords]);

  const handleManualBind = async (rawValue: string) => {
    if (!rawValue.trim()) {
      setScanFeedback({ ok: false, message: "请先扫码、粘贴专属链接，或输入完整传人护照号。" });
      synth.playSwipe();
      return;
    }

    const result = await onScanPassport(rawValue);
    setScanFeedback(result);
    if (result.ok) {
      setScanInput(rawValue);
      synth.playChime();
    } else {
      synth.playSwipe();
    }
  };

  const handleSendPhoto = async (index: number) => {
    if (!activePassportId) {
      setScanFeedback({ ok: false, message: "请先绑定客户，再上传或回传照片。" });
      synth.playSwipe();
      return;
    }

    const template = PHOTO_TEMPLATES[index];
    
    const photo: LivePhoto = {
      id: `photo_${Date.now()}_${index}`,
      imageUrl: template.url,
      caption: template.caption + (customCaption ? ` - ${customCaption}` : ""),
      location: uploadLocation || template.location,
      timestamp: new Date().toLocaleTimeString("zh-CN", { hour: 'numeric', minute: '2-digit', second: '2-digit' }),
      aiMotto: template.motto,
      savedToPoster: false
    };

    const result = await onPhotoUploaded(photo);
    if (!result.ok) {
      setScanFeedback(result);
      synth.playSwipe();
      return;
    }
    synth.playChime();
    
    setSentMap((prev) => ({ ...prev, [index]: true }));
    setCustomCaption("");

    // Automatically fade checked status back after 2s
    setTimeout(() => {
      setSentMap((prev) => ({ ...prev, [index]: false }));
    }, 2500);
  };

  const handleUploadLocalFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!activePassportId) {
      setScanFeedback({ ok: false, message: "请先绑定客户，再上传本地照片。" });
      synth.playSwipe();
      event.target.value = "";
      return;
    }

    for (const [index, file] of files.entries()) {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(new Error("照片读取失败"));
        reader.readAsDataURL(file);
      });

      const photo: LivePhoto = {
        id: `photo_upload_${Date.now()}_${index}`,
        imageUrl: dataUrl,
        caption: `${uploadLabel || "现场抓拍"}${customCaption ? ` - ${customCaption}` : ""}`,
        location: uploadLocation || "摄影师现场抓拍位",
        timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "numeric", minute: "2-digit", second: "2-digit" }),
        aiMotto: `摄影师现场回传：${passport.familyName || passport.familyLabel || "传人"}家族本次精彩瞬间已同步入卷。`,
        savedToPoster: false
      };
      const result = await onPhotoUploaded(photo);
      if (!result.ok) {
        setScanFeedback(result);
        synth.playSwipe();
        event.target.value = "";
        return;
      }
    }

    setScanFeedback({ ok: true, message: `已向 ${passport.familyLabel || `${passport.familyName}氏${passport.childName}`} 上传 ${files.length} 张现场照片。` });
    synth.playChime();
    event.target.value = "";
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
        <div className="rounded-2xl border border-white/5 bg-black/30 p-5 space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-[0.22em] text-cyan-300/80">Bind Passport</span>
              <h3 className="text-lg font-serif text-white">先锁定客户，再上传照片</h3>
              <p className="text-xs leading-6 text-slate-400 max-w-3xl">
                摄影师可以直接打开客户专属上传网址，也可以扫码客户展示的摄影师二维码，或在此粘贴链接 / 输入护照号后绑定当前客户。
              </p>
            </div>
            {activePassportId && (
              <button
                type="button"
                onClick={() => {
                  onClearSelection();
                  setScanInput("");
                  setScanFeedback(null);
                  synth.playSwipe();
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[11px] tracking-[0.18em] text-stone-300 transition-colors hover:text-white"
              >
                <RefreshCcw className="w-4 h-4" />
                切换客户
              </button>
            )}
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <QrCode className="pointer-events-none absolute left-3 top-3.5 w-4 h-4 text-cyan-400/80" />
                  <input
                    type="text"
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    placeholder="粘贴摄影师专属链接、客户二维码内容，或输入 XC- 护照号"
                    className="w-full rounded-xl border border-white/10 bg-black/25 py-3 pl-10 pr-4 text-sm text-white outline-none transition-colors focus:border-cyan-400/60"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleManualBind(scanInput)}
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-4 py-3 text-xs tracking-[0.18em] text-cyan-300 transition-colors hover:bg-cyan-500/15"
                >
                  <Search className="w-4 h-4" />
                  绑定客户
                </button>
              </div>

              {scanFeedback && (
                <div
                  className={`rounded-xl border px-3 py-3 text-xs leading-5 ${
                    scanFeedback.ok
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-red-500/30 bg-red-500/10 text-red-300"
                  }`}
                >
                  {scanFeedback.message}
                </div>
              )}

              <div className="rounded-xl border border-white/8 bg-black/25 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-stone-400">
                  <UserRoundCheck className="w-4 h-4 text-cyan-300" />
                  当前客户
                </div>
                {activePassportId ? (
                  <div className="mt-3 space-y-2">
                    <p className="text-lg font-serif text-cyan-100">{passport.familyName || passport.familyLabel}氏 {passport.childName || "传人"}</p>
                    <p className="text-[11px] leading-5 text-stone-400">
                      联系人：{passport.contactName || "--"} · 手机号：{maskPhone(passport.contactPhone)}
                    </p>
                    <p className="text-[11px] leading-5 text-stone-500 font-mono break-all">{passport.passportId}</p>
                    <p className="text-[11px] leading-5 text-stone-500">当前已同步 {photos.length} 张照片到该客户长卷。</p>
                  </div>
                ) : (
                  <p className="mt-3 text-xs leading-6 text-stone-500">
                    尚未绑定客户。请使用客户专属摄影师链接，或粘贴二维码内容 / 护照号完成绑定。
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-white/8 bg-black/25 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-stone-400">
                <ImageIcon className="w-4 h-4 text-cyan-300" />
                最近客户
              </div>
              <div className="mt-3 space-y-2">
                {recentRecords.map((record) => (
                  <button
                    key={record.passport.passportId}
                    type="button"
                    onClick={() => handleManualBind(record.passport.passportId)}
                    className="w-full rounded-xl border border-white/8 bg-white/5 px-3 py-3 text-left transition-colors hover:border-cyan-400/30 hover:bg-cyan-500/5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-serif text-stone-100">{record.passport.familyName}氏 {record.passport.childName}</p>
                      <span className="text-[10px] font-mono text-cyan-300">{record.photos.length} 张</span>
                    </div>
                    <p className="mt-1 text-[11px] text-stone-500">{record.passport.familyLabel || "未命名家庭"} · {maskPhone(record.passport.contactPhone)}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/5 bg-black/30 p-5 space-y-3.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-serif tracking-wider text-slate-400">上传现场原图 / 成片</p>
                  <p className="mt-1 text-[11px] leading-5 text-stone-500">支持从手机相册或摄影师设备本地选择图片，实时写入当前客户相片长卷。</p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-4 py-3 text-xs tracking-[0.18em] text-cyan-300 transition-colors hover:bg-cyan-500/15"
                >
                  <Upload className="w-4 h-4" />
                  上传照片
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    void handleUploadLocalFiles(event);
                  }}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="上传标题，例如：封坛定格"
                  value={uploadLabel}
                  onChange={(e) => setUploadLabel(e.target.value)}
                  className="rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-cyan-400/60"
                />
                <input
                  type="text"
                  placeholder="拍摄点位，例如：封坛广场"
                  value={uploadLocation}
                  onChange={(e) => setUploadLocation(e.target.value)}
                  className="rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-cyan-400/60"
                />
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-serif">
              活动现场跟拍摄影师可使用下方预设镜头快速回传，也可直接上传本地真实照片。所有照片都会进入当前家庭的 H5 相片长卷。
            </p>
          </div>

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
