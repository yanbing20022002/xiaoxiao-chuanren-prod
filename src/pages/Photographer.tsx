import PhotographerDashboard from "../components/PhotographerDashboard";
import StaffAccessGate from "../components/StaffAccessGate";
import { LivePhoto, UserPassport } from "../types";
import { PassportRecord } from "../utils/passport";

interface PhotographerPageProps {
  passport: UserPassport;
  photos: LivePhoto[];
  sceneAssets: string[];
  activePassportId: string;
  recentPassportRecords: PassportRecord[];
  onPhotoUploaded: (photo: LivePhoto) => Promise<{ ok: boolean; message: string }>;
  onScanPassport: (rawValue: string) => Promise<{ ok: boolean; message: string }>;
  onClearNpcSelection: () => void;
}

export default function PhotographerPage({
  passport,
  photos,
  sceneAssets,
  activePassportId,
  recentPassportRecords,
  onPhotoUploaded,
  onScanPassport,
  onClearNpcSelection
}: PhotographerPageProps) {
  return (
    <StaffAccessGate
      role="photographer"
      title="摄影师上传控制台门禁"
      description="当前终端可以绑定客户并写入现场照片，必须先通过工作人员 PIN 校验。这样即使客户被别人拍到二维码，也无法直接进入摄影师后台上传任意内容。"
      accentClassName="text-cyan-300"
      hintLabel="Photographer Access Gate"
    >
      <div className="relative min-h-screen overflow-hidden bg-[#050609] text-white">
        <img src={sceneAssets[1]} alt="摄影师上传背景" className="absolute inset-0 h-full w-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(4,8,12,0.92)_0%,rgba(6,12,16,0.94)_42%,rgba(0,0,0,0.98)_100%)]" />
        <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-8">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-300/80">Photographer Upload Console</p>
            <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-3xl font-serif tracking-[0.18em] text-white">摄影师实时上传控制台</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-300">
                  当前页面仅负责绑定客户并上传现场跟拍照片。摄影师可通过客户专属二维码、专属上传网址或后台最近档案快速进入对应家庭的照片长卷。
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-stone-500">Photographer</p>
                  <p className="mt-2 font-serif text-lg text-cyan-100">{activePassportId ? "已锁定客户" : "待绑定客户"}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-stone-500">Photos</p>
                  <p className="mt-2 font-serif text-lg text-cyan-100">{photos.length}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-stone-500">Recent Files</p>
                  <p className="mt-2 font-serif text-lg text-cyan-100">{recentPassportRecords.length}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <PhotographerDashboard
              passport={passport}
              photos={photos}
              activePassportId={activePassportId}
              recentPassportRecords={recentPassportRecords}
              onPhotoUploaded={onPhotoUploaded}
              onScanPassport={onScanPassport}
              onClearSelection={onClearNpcSelection}
            />
          </div>
        </div>
      </div>
    </StaffAccessGate>
  );
}
