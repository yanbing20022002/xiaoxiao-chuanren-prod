import { useState } from "react";
import LevelDetailModal from "../components/LevelDetailModal";
import ParallaxScrollH5 from "../components/ParallaxScrollH5";
import PrerollIntro from "../components/PrerollIntro";
import { GameLevel, LivePhoto, UserPassport, VerifiedFamilySession } from "../types";

interface CustomerPageProps {
  levels: GameLevel[];
  passport: UserPassport;
  photos: LivePhoto[];
  lastTriggeredStamp: { levelId: string; stars: number; timestamp: number } | null;
  sceneAssets: string[];
  hasCompletedIntro: boolean;
  bgmSrc?: string;
  verifiedFamily: VerifiedFamilySession | null;
  passportScanPayload: string;
  customerResumeUrl: string;
  npcResumeUrl: string;
  photographerResumeUrl: string;
  onUpdatePassport: (updated: Partial<UserPassport>) => void;
  onClearScore: () => void;
  onVerifyCustomerAccess: (phone: string) => Promise<{ ok: boolean; message: string }>;
  onClearCustomerAccess: () => void;
  onRestartCustomerActivation: () => void;
  onIntroComplete: () => void;
}

export default function CustomerPage({
  levels,
  passport,
  photos,
  lastTriggeredStamp,
  sceneAssets,
  hasCompletedIntro,
  bgmSrc,
  verifiedFamily,
  passportScanPayload,
  customerResumeUrl,
  npcResumeUrl,
  photographerResumeUrl,
  onUpdatePassport,
  onClearScore,
  onVerifyCustomerAccess,
  onClearCustomerAccess,
  onRestartCustomerActivation,
  onIntroComplete
}: CustomerPageProps) {
  const [selectedCompletedLevel, setSelectedCompletedLevel] = useState<GameLevel | null>(null);
  const hasCustomerAccess = Boolean(verifiedFamily?.contactPhone || passport.contactPhone || passport.activated);

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      <img src={sceneAssets[3]} alt="主视觉背景" className="absolute inset-0 h-full w-full object-cover opacity-25" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(246,211,138,0.2),transparent_30%),linear-gradient(180deg,rgba(4,5,8,0.3)_0%,rgba(4,5,8,0.9)_100%)]" />
      <div className="relative z-10 h-screen w-screen">
        <div className="relative mx-auto h-full max-w-[440px] overflow-hidden">
          {hasCustomerAccess && !hasCompletedIntro && (
            <PrerollIntro
              onComplete={onIntroComplete}
              allowSkip={false}
              bgmSrc={bgmSrc}
              sceneAssets={sceneAssets}
            />
          )}
          <ParallaxScrollH5
            levels={levels}
            passport={passport}
            photos={photos}
            onUpdatePassport={onUpdatePassport}
            onClearScore={onClearScore}
            lastTriggeredStamp={lastTriggeredStamp}
            onCompletedLevelClick={(level) => setSelectedCompletedLevel(level)}
            allowDebugControls={false}
            sceneAssets={sceneAssets}
            verifiedFamily={verifiedFamily}
            passportScanPayload={passportScanPayload}
            customerResumeUrl={customerResumeUrl}
            npcResumeUrl={npcResumeUrl}
            photographerResumeUrl={photographerResumeUrl}
            onVerifyCustomerAccess={onVerifyCustomerAccess}
            onClearCustomerAccess={onClearCustomerAccess}
            onRestartCustomerActivation={onRestartCustomerActivation}
          />
          {selectedCompletedLevel && (
            <LevelDetailModal
              level={selectedCompletedLevel}
              stars={passport.scoreHistory[selectedCompletedLevel.id] || 5}
              passport={passport}
              onClose={() => setSelectedCompletedLevel(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
