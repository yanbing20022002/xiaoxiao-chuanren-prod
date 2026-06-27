import { useEffect, useMemo, useRef, useState } from "react";
import { FamilyAccessRecord, FrontDeskCheckInRecord, GameLevel, LivePhoto, UserPassport } from "../types";
import {
  Star,
  CheckCircle,
  Zap,
  QrCode,
  Award,
  ScanLine,
  Camera,
  ShieldAlert,
  RefreshCcw,
  UserRoundCheck,
  FileSpreadsheet,
  Download,
  Upload,
  ScrollText
} from "lucide-react";
import { synth } from "../utils/audio";
import { PassportRecord } from "../utils/passport";
import {
  downloadFamilyRosterTemplateCsv,
  downloadFamilyRosterTemplateXlsx,
  MAX_FAMILY_ROSTER_SIZE,
  parseFamilyRosterFile
} from "../utils/familyRoster";
import { maskPhone } from "../utils/customerAccess";

interface NpcDashboardProps {
  levels: GameLevel[];
  passport: UserPassport;
  photos: LivePhoto[];
  activePassportId: string;
  familyRoster: FamilyAccessRecord[];
  frontDeskCheckInLogs: FrontDeskCheckInRecord[];
  recentPassportRecords: PassportRecord[];
  onUpdateScore: (levelId: string, stars: number) => Promise<{ ok: boolean; message: string }>;
  onImportFamilyRoster: (records: FamilyAccessRecord[]) => Promise<{ ok: boolean; message: string }>;
  onScanPassport: (rawValue: string) => Promise<{ ok: boolean; message: string }>;
  onClearNpcSelection: () => void;
}

export default function NpcDashboard({
  levels,
  passport,
  photos,
  activePassportId,
  familyRoster,
  frontDeskCheckInLogs,
  recentPassportRecords,
  onUpdateScore,
  onImportFamilyRoster,
  onScanPassport,
  onClearNpcSelection
}: NpcDashboardProps) {
  const [selectedLevelId, setSelectedLevelId] = useState<string>("01");
  const [stars, setStars] = useState<number>(5);
  const [scanInput, setScanInput] = useState("");
  const [scanFeedback, setScanFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [importFeedback, setImportFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [importingFileName, setImportingFileName] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraMessage, setCameraMessage] = useState("点击启动摄像头后，对准孩子护照二维码即可自动锁定当前传人。");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const rosterFileInputRef = useRef<HTMLInputElement | null>(null);

  const activeLevel = levels.find((level) => level.id === selectedLevelId) ?? levels[0];
  const nextRequiredLevel = useMemo(
    () => levels.find((level) => !passport.npcLitLevels.includes(level.id)) ?? null,
    [levels, passport.npcLitLevels]
  );
  const checkedInFamilyCount = useMemo(
    () => new Set(frontDeskCheckInLogs.map((log) => log.rosterFamilyId)).size,
    [frontDeskCheckInLogs]
  );
  const recentCheckInLogs = useMemo(() => frontDeskCheckInLogs.slice(0, 8), [frontDeskCheckInLogs]);
  const rosterPreview = useMemo(() => familyRoster.slice(0, 6), [familyRoster]);

  useEffect(() => {
    if (!activePassportId) {
      setSelectedLevelId("01");
      return;
    }

    if (nextRequiredLevel) {
      setSelectedLevelId(nextRequiredLevel.id);
    }
  }, [activePassportId, nextRequiredLevel]);

  useEffect(() => {
    if (!cameraOpen) {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      return;
    }

    const BarcodeDetectorCtor = (window as Window & {
      BarcodeDetector?: new (options?: { formats?: string[] }) => {
        detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
      };
    }).BarcodeDetector;

    if (!navigator.mediaDevices?.getUserMedia || !BarcodeDetectorCtor) {
      setCameraMessage("当前设备浏览器不支持摄像头扫码，请改用扫码枪或粘贴二维码内容。");
      setCameraOpen(false);
      return;
    }

    let cancelled = false;
    const detector = new BarcodeDetectorCtor({ formats: ["qr_code"] });

    const detectFrame = async () => {
      if (cancelled || !videoRef.current) return;

      try {
        const results = await detector.detect(videoRef.current);
        const rawValue = results[0]?.rawValue;
        if (rawValue) {
          const result = await onScanPassport(rawValue);
          setScanFeedback(result);
          if (result.ok) {
            setScanInput(rawValue);
            setCameraMessage("扫码成功，已锁定当前传人。");
            setCameraOpen(false);
            synth.playChime();
            return;
          }
        }
      } catch {
        // Ignore transient detection failures while camera keeps scanning.
      }

      frameRef.current = window.requestAnimationFrame(detectFrame);
    };

    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: { ideal: "environment" }
        },
        audio: false
      })
      .then((stream) => {
        if (cancelled || !videoRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        videoRef.current
          .play()
          .then(() => {
            setCameraMessage("摄像头已启动，请将二维码完整置于取景框内。");
            frameRef.current = window.requestAnimationFrame(detectFrame);
          })
          .catch(() => {
            setCameraMessage("摄像头已授权，但自动播放失败，请尝试重新启动扫码。");
            setCameraOpen(false);
          });
      })
      .catch(() => {
        setCameraMessage("摄像头权限被拒绝或不可用，请改用扫码枪或粘贴二维码内容。");
        setCameraOpen(false);
      });

    return () => {
      cancelled = true;
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [cameraOpen, onScanPassport]);

  const handleManualScan = async (rawValue: string) => {
    if (!rawValue.trim()) {
      setScanFeedback({ ok: false, message: "请先粘贴扫码结果，或输入完整的传人护照号。" });
      return;
    }

    const result = await onScanPassport(rawValue);
    setScanFeedback(result);
    if (result.ok) {
      synth.playChime();
    } else {
      synth.playSwipe();
    }
  };

  const handleSubmitScore = async () => {
    if (!activePassportId) {
      setScanFeedback({ ok: false, message: "请先扫码锁定孩子护照，再执行真人授勋。" });
      synth.playSwipe();
      return;
    }

    const result = await onUpdateScore(selectedLevelId, stars);
    setScanFeedback(result);
    if (result.ok) {
      synth.playChime();
      return;
    }
    synth.playSwipe();
  };

  const handleImportRosterFile = async (file: File) => {
    try {
      const parseResult = await parseFamilyRosterFile(file);
      const result = await onImportFamilyRoster(parseResult.records);
      setImportFeedback(
        result.ok && parseResult.repairedRecordCount > 0
          ? {
              ...result,
              message: `${result.message} 已自动修复 ${parseResult.repairedRecordCount} 条记录中的中文编码异常。`
            }
          : result
      );
      setImportingFileName(file.name);
      if (result.ok) {
        synth.playChime();
      } else {
        synth.playSwipe();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "导入失败，请检查文件格式后重试。";
      setImportFeedback({ ok: false, message });
      setImportingFileName(file.name);
      synth.playSwipe();
    }
  };

  return (
    <div id="npc-dashboard" className="h-full flex flex-col glass-panel text-slate-100 rounded-2xl overflow-hidden shadow-2xl select-none">
      <div className="bg-black/30 px-6 py-4.5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
          <h2 className="text-sm font-serif font-semibold tracking-widest text-white uppercase">
            真人 NPC 评判官控制端
          </h2>
        </div>
        <span className="text-[10px] bg-orange-500/10 text-orange-400 px-2.5 py-1 rounded-full border border-orange-500/20 font-mono">
          Scan → Verify → Light
        </span>
      </div>

      <div className="p-6 flex-1 overflow-y-auto space-y-6">
        <div className="bg-black/20 p-5 rounded-2xl border border-white/5 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Roster Import</span>
              <h3 className="font-serif text-slate-200 text-lg">Excel / CSV 家庭名单导入与前台报到台账</h3>
              <p className="text-xs leading-6 text-slate-400 max-w-3xl">
                支持一次性导入最多 {MAX_FAMILY_ROSTER_SIZE} 个家庭，导入后直接替换当前报名名单。系统会强制校验同一手机号只能对应一个家庭账号，并自动记录每次前台手机号报到。
              </p>
                <p className="text-[11px] leading-5 text-stone-500 max-w-3xl">
                  如果 CSV 来自 Excel 导出，且文件采用 ANSI / GBK 等本地编码，系统会自动尝试修复常见中文乱码；如个别历史数据仍异常，建议重新导出后再次导入覆盖。
                </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.28em] text-stone-500">Roster</p>
                <p className="mt-2 text-lg font-serif text-amber-100">{familyRoster.length}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.28em] text-stone-500">Check-In</p>
                <p className="mt-2 text-lg font-serif text-amber-100">{checkedInFamilyCount}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.28em] text-stone-500">Logs</p>
                <p className="mt-2 text-lg font-serif text-amber-100">{frontDeskCheckInLogs.length}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-3 rounded-2xl border border-white/8 bg-black/25 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-stone-400">
                <FileSpreadsheet className="w-4 h-4 text-orange-400" />
                名单导入
              </div>
              <input
                ref={rosterFileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  void handleImportRosterFile(file);
                  event.currentTarget.value = "";
                }}
              />
              <div className="rounded-xl border border-dashed border-white/10 bg-black/30 p-4">
                <p className="text-xs leading-6 text-stone-400">
                  推荐表头：`家庭名称 / 联系人 / 手机号 / 备注`。也支持 `familyLabel / contactName / contactPhone / note`。
                </p>
                <p className="mt-2 text-[11px] leading-5 text-stone-500">
                  导入规则：超过 {MAX_FAMILY_ROSTER_SIZE} 户会拒绝；手机号不是 11 位或重复手机号会拒绝；导入成功后立刻覆盖当前名单。
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => rosterFileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-xs tracking-[0.18em] text-orange-300 transition-colors hover:bg-orange-500/15"
                  >
                    <Upload className="w-4 h-4" />
                    选择 Excel/CSV 文件
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      downloadFamilyRosterTemplateCsv();
                      synth.playChime();
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-4 py-3 text-xs tracking-[0.16em] text-cyan-200 transition-colors hover:bg-cyan-500/15"
                  >
                    <Download className="w-4 h-4" />
                    下载 UTF-8 模板 CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      downloadFamilyRosterTemplateXlsx();
                      synth.playChime();
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-violet-500/25 bg-violet-500/10 px-4 py-3 text-xs tracking-[0.16em] text-violet-200 transition-colors hover:bg-violet-500/15"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    下载 Excel 模板 .xlsx
                  </button>
                  {importingFileName && (
                    <div className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[11px] text-stone-400">
                      最近导入文件：{importingFileName}
                    </div>
                  )}
                </div>
              </div>

              {importFeedback && (
                <div
                  className={`flex items-start gap-2 rounded-xl border px-3 py-3 text-xs leading-5 ${
                    importFeedback.ok
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-red-500/30 bg-red-500/10 text-red-300"
                  }`}
                >
                  {importFeedback.ok ? <CheckCircle className="mt-0.5 w-4 h-4 shrink-0" /> : <ShieldAlert className="mt-0.5 w-4 h-4 shrink-0" />}
                  <span>{importFeedback.message}</span>
                </div>
              )}

              <div className="rounded-xl border border-white/8 bg-black/30 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-stone-400">
                  <UserRoundCheck className="w-4 h-4 text-orange-400" />
                  当前名单预览
                </div>
                <div className="mt-3 space-y-2">
                  {rosterPreview.length === 0 && (
                    <div className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-xs leading-5 text-stone-500">
                      当前还没有导入家庭名单，请先上传 Excel 或 CSV。
                    </div>
                  )}
                  {rosterPreview.map((record) => (
                    <div key={record.id} className="rounded-xl border border-white/8 bg-white/5 px-3 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-serif text-stone-100">{record.familyLabel}</p>
                        <span className="text-[10px] font-mono text-orange-300">{maskPhone(record.contactPhone)}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-stone-500">
                        联系人：{record.contactName}
                        {record.note ? ` · ${record.note}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/8 bg-black/25 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-stone-400">
                <ScrollText className="w-4 h-4 text-orange-400" />
                前台报到记录
              </div>
              <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
                {recentCheckInLogs.length === 0 && (
                  <div className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-xs leading-5 text-stone-500">
                    还没有前台报到记录。客户使用手机号完成家庭报到后，会自动出现在这里。
                  </div>
                )}
                {recentCheckInLogs.map((log) => (
                  <div key={log.id} className="rounded-xl border border-white/8 bg-white/5 px-3 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-serif text-stone-100">{log.familyLabel}</p>
                      <span
                        className={`rounded-full px-2 py-1 text-[9px] font-mono ${
                          log.status === "resumed"
                            ? "border border-orange-500/25 bg-orange-500/10 text-orange-300"
                            : "border border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                        }`}
                      >
                        {log.status === "resumed" ? "续接账号" : "首次核验"}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-5 text-stone-400">
                      联系人：{log.contactName} · 手机号：{maskPhone(log.contactPhone)}
                    </p>
                    <p className="mt-1 text-[11px] leading-5 text-stone-500">{log.message}</p>
                    <p className="mt-2 text-[10px] font-mono text-stone-600">
                      {new Date(log.checkedInAt).toLocaleString()} {log.passportId ? `· ${log.passportId}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-black/20 p-5 rounded-2xl border border-white/5 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Live Scan Intake</span>
              <h3 className="font-serif text-slate-200 text-lg">先扫码锁定孩子，再点亮对应关卡勋章</h3>
              <p className="text-xs leading-6 text-slate-400 max-w-2xl">
                线下任务完成后，孩子需向真人 NPC 出示自己的传人印信二维码。扫码成功后，本控制台将只对该孩子的当前护照生效。
              </p>
            </div>
            {activePassportId && (
              <button
                onClick={onClearNpcSelection}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] text-stone-300 transition-colors hover:border-white/20 hover:text-white"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                切换核验对象
              </button>
            )}
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-3 rounded-2xl border border-white/8 bg-black/25 p-4">
              <div className="flex gap-2">
                <input
                  value={scanInput}
                  onChange={(event) => setScanInput(event.target.value)}
                  placeholder="粘贴扫码枪结果、二维码链接，或输入传人护照号 XC-..."
                  className="flex-1 rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none placeholder:text-stone-500 focus:border-orange-400/50"
                />
                <button
                  onClick={() => handleManualScan(scanInput)}
                  className="inline-flex items-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-xs tracking-[0.18em] text-orange-300 transition-colors hover:bg-orange-500/15"
                >
                  <QrCode className="w-4 h-4" />
                  核验
                </button>
              </div>

              <div className="rounded-xl border border-white/8 bg-black/30 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-stone-400">
                    <Camera className="w-4 h-4 text-orange-400" />
                    浏览器摄像头扫码
                  </div>
                  <button
                    onClick={() => {
                      setCameraOpen((prev) => !prev);
                      synth.playSwipe();
                    }}
                    className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[10px] tracking-[0.18em] text-orange-300"
                  >
                    {cameraOpen ? "关闭摄像头" : "启动扫码"}
                  </button>
                </div>
                <p className="mt-2 text-[11px] leading-5 text-stone-500">{cameraMessage}</p>
                {cameraOpen && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-orange-500/20 bg-black">
                    <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline autoPlay />
                  </div>
                )}
              </div>

              {scanFeedback && (
                <div
                  className={`flex items-start gap-2 rounded-xl border px-3 py-3 text-xs leading-5 ${
                    scanFeedback.ok
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-red-500/30 bg-red-500/10 text-red-300"
                  }`}
                >
                  {scanFeedback.ok ? <CheckCircle className="mt-0.5 w-4 h-4 shrink-0" /> : <ShieldAlert className="mt-0.5 w-4 h-4 shrink-0" />}
                  <span>{scanFeedback.message}</span>
                </div>
              )}
            </div>

            <div className="space-y-3 rounded-2xl border border-white/8 bg-black/25 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-stone-400">
                <UserRoundCheck className="w-4 h-4 text-orange-400" />
                最近已激活传人
              </div>
              <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {recentPassportRecords.length === 0 && (
                  <div className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-xs leading-5 text-stone-500">
                    还没有已激活的孩子护照。请先在 customer 端完成护照生成。
                  </div>
                )}
                {recentPassportRecords.map((record) => (
                  <button
                    key={record.passport.passportId}
                    onClick={async () => {
                      const result = await onScanPassport(record.passport.passportId);
                      setScanFeedback(result);
                      setScanInput(record.passport.passportId);
                      if (result.ok) {
                        synth.playChime();
                      } else {
                        synth.playSwipe();
                      }
                    }}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                      activePassportId === record.passport.passportId
                        ? "border-orange-500/35 bg-orange-500/10"
                        : "border-white/8 bg-white/5 hover:border-white/15"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-serif text-stone-100">
                        {record.passport.familyName || "未命名"}氏 {record.passport.childName || "传人"}
                      </p>
                      <span className="text-[9px] font-mono text-orange-300">{record.passport.passportId}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-stone-500">
                      已点亮 {record.passport.npcLitLevels.length}/5 · 照片 {record.photos.length} 张
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-black/20 p-5 rounded-2xl border border-white/5 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Passport Locked</span>
              <h3 className="font-serif text-slate-200">
                {activePassportId ? `${passport.familyName}氏世家尊子：` : "等待扫码锁定传人"}
                <span className="text-orange-400 font-bold">{activePassportId ? passport.childName : "未绑定"}</span>
              </h3>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-[10px] border border-orange-500/20">
              <Award className="w-3.5 h-3.5" />
              <span>{passport.activated ? "护照已激活" : "待激活"}</span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <span className="block text-[9px] text-slate-400 mb-0.5">传人护照号</span>
              <span className="text-xs text-orange-400 font-medium font-mono break-all">{activePassportId || "尚未扫码"}</span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <span className="block text-[9px] text-slate-400 mb-0.5">外袍定制款式</span>
              <span className="text-xs text-orange-400 font-medium font-serif">{passport.avatarStyle || "--"}</span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <span className="block text-[9px] text-slate-400 mb-0.5">点亮进度</span>
              <span className="text-xs text-slate-300 font-serif">
                {activePassportId ? `已点亮 ${passport.npcLitLevels.length} / 5` : "等待扫码"}
              </span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <span className="block text-[9px] text-slate-400 mb-0.5">现场相片归档</span>
              <span className="text-xs text-slate-300 font-serif">{activePassportId ? `${photos.length} 张` : "等待扫码"}</span>
            </div>
          </div>

          <div className="rounded-xl border border-white/8 bg-black/25 px-4 py-3 text-xs leading-6 text-slate-400">
            <p>
              <strong className="text-slate-200 font-serif">当前必须核验的下一关：</strong>
              {nextRequiredLevel ? `${nextRequiredLevel.id} ${nextRequiredLevel.title}` : "全部关卡已完成"}
            </p>
            <p>
              <strong className="text-slate-200 font-serif">家训：</strong>
              {passport.customMotto || "封一坛陈酿，守百年家训"}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-serif text-slate-400 tracking-wider">选择线下考核实景环节</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {levels.map((level) => {
              const alreadyLit = passport.npcLitLevels.includes(level.id);
              const isCurrentRequired = nextRequiredLevel?.id === level.id;
              return (
                <button
                  key={level.id}
                  disabled={!activePassportId}
                  onClick={() => {
                    setSelectedLevelId(level.id);
                    synth.playSwipe();
                  }}
                  className={`py-3 px-4 text-left rounded-xl border transition-all flex flex-col justify-between min-h-24 ${
                    selectedLevelId === level.id
                      ? "bg-orange-500/10 border-orange-500 text-orange-400 shadow-md shadow-orange-500/5"
                      : "bg-white/5 border-white/5 hover:border-white/10 text-slate-300"
                  } ${!activePassportId ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="flex justify-between items-center w-full gap-2">
                    <span className="text-[10px] font-mono text-slate-400">Step {level.id}</span>
                    {alreadyLit && <span className="text-[9px] text-emerald-300 font-mono">NPC LIT</span>}
                    {!alreadyLit && isCurrentRequired && <span className="text-[9px] text-amber-300 font-mono">READY</span>}
                  </div>
                  <div className="text-xs font-serif font-bold line-clamp-2 w-full">{level.title}</div>
                  {passport.scoreHistory[level.id] !== undefined && (
                    <div className="pt-2 text-[10px] text-orange-300 font-mono">线上成绩 ★{passport.scoreHistory[level.id]}</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

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

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-serif text-slate-400">点亮星级星等 (NPC星级评判)</label>
            <span className="text-sm font-semibold text-orange-400">{stars} 盏星灯</span>
          </div>

          <div className="flex justify-center items-center gap-2 bg-black/25 p-4 rounded-xl border border-white/5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => {
                  setStars(star);
                  synth.playChime();
                }}
                className={`p-2 transition-transform active:scale-95 ${
                  star <= stars ? "text-orange-400 scale-110" : "text-slate-700 hover:text-slate-600"
                }`}
              >
                <Star className={`w-8 h-8 ${star <= stars ? "fill-orange-400" : ""}`} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-5 bg-black/30 border-t border-white/5 space-y-2">
        <button
          onClick={handleSubmitScore}
          disabled={!activePassportId}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold tracking-widest text-xs uppercase rounded-xl hover:shadow-lg hover:shadow-orange-500/25 active:scale-[0.98] transition-all outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Zap className="w-4 h-4 fill-white" />
          确认授勋，点亮当前关口勋章
        </button>
        <p className="text-[10px] text-center text-slate-500 leading-normal">
          提示：先扫码锁定孩子，再对当前已完成线下互动的关卡执行授勋。5 星会在孩子端触发 2.5 秒金色光柱冲天特效。
        </p>
      </div>
    </div>
  );
}
