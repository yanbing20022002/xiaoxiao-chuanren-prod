/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { GameLevel, LivePhoto, LevelStatus, UserPassport } from "./types";

const CustomerPage = lazy(() => import("./pages/Customer"));
const NpcPage = lazy(() => import("./pages/Npc"));

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
  scoreHistory: {},
  npcLitLevels: []
};

const SCENE_ASSETS = {
  ink: "/assets/intro/ink.png",
  run: "/assets/intro/run.png",
  union: "/assets/intro/union.png",
  finale: "/assets/intro/finale.png"
} as const;

const INTRO_BGM_URL = "/assets/audio/intro-bgm.mp3";

type RoleMode = "customer" | "npc" | "default";
type TriggerStamp = { levelId: string; stars: number; timestamp: number } | null;

const SHARED_STATE_STORAGE_KEY = "xiaoxiao-chuanren-shared-state-v1";
const TRIGGER_STORAGE_KEY = "xiaoxiao-chuanren-trigger-stamp-v1";

function getRoleFromSearch(search: string): RoleMode {
  const role = new URLSearchParams(search).get("role");
  if (role === "customer" || role === "npc") return role;
  return "default";
}

function readSharedState() {
  try {
    const raw = window.localStorage.getItem(SHARED_STATE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { passport?: UserPassport; photos?: LivePhoto[] };
  } catch {
    return null;
  }
}

function writeTriggerStamp(trigger: TriggerStamp) {
  if (!trigger) return;
  window.localStorage.setItem(TRIGGER_STORAGE_KEY, JSON.stringify(trigger));
}

export default function App() {
  const [role, setRole] = useState<RoleMode>(() => getRoleFromSearch(window.location.search));
  const [hasCompletedIntro, setHasCompletedIntro] = useState(false);
  const [passport, setPassport] = useState<UserPassport>(() => readSharedState()?.passport ?? INITIAL_PASSPORT);
  const [photos, setPhotos] = useState<LivePhoto[]>(() => readSharedState()?.photos ?? []);
  const [lastTriggeredStamp, setLastTriggeredStamp] = useState<TriggerStamp>(null);

  useEffect(() => {
    const handlePopState = () => setRole(getRoleFromSearch(window.location.search));
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      SHARED_STATE_STORAGE_KEY,
      JSON.stringify({
        passport,
        photos
      })
    );
  }, [passport, photos]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === SHARED_STATE_STORAGE_KEY && event.newValue) {
        try {
          const nextState = JSON.parse(event.newValue) as { passport?: UserPassport; photos?: LivePhoto[] };
          if (nextState.passport) {
            setPassport(nextState.passport);
          }
          if (nextState.photos) {
            setPhotos(nextState.photos);
          }
        } catch {
          // Ignore malformed storage payloads.
        }
      }

      if (event.key === TRIGGER_STORAGE_KEY && event.newValue) {
        try {
          const nextTrigger = JSON.parse(event.newValue) as TriggerStamp;
          if (nextTrigger) {
            setLastTriggeredStamp(nextTrigger);
          }
        } catch {
          // Ignore malformed trigger payloads.
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const sceneAssets = useMemo(
    () => [SCENE_ASSETS.ink, SCENE_ASSETS.run, SCENE_ASSETS.union, SCENE_ASSETS.finale],
    []
  );

  const levels = useMemo<GameLevel[]>(
    () =>
      INITIAL_LEVELS.map((lvl, index) => {
        const isNpcLit = passport.npcLitLevels.includes(lvl.id);
        const previousLevelId = index > 0 ? INITIAL_LEVELS[index - 1].id : null;
        const isUnlocked =
          passport.activated &&
          (index === 0 || (previousLevelId !== null && passport.npcLitLevels.includes(previousLevelId)));

        let status = LevelStatus.LOCKED;
        if (isNpcLit) {
          status = LevelStatus.COMPLETED;
        } else if (isUnlocked) {
          status = LevelStatus.ACTIVE;
        }

        return {
          ...lvl,
          stars: passport.scoreHistory[lvl.id] ?? 0,
          status
        };
      }),
    [passport]
  );

  const handleUpdatePassport = (updatedFields: Partial<UserPassport>) => {
    setPassport((prev) => ({
      ...prev,
      ...updatedFields,
      scoreHistory: updatedFields.scoreHistory ?? prev.scoreHistory,
      npcLitLevels: updatedFields.npcLitLevels ?? prev.npcLitLevels
    }));
  };

  const handleNpcScoreLevel = (levelId: string, stars: number) => {
    window.setTimeout(() => {
      const trigger = { levelId, stars, timestamp: Date.now() };
      setPassport((prev) => ({
        ...prev,
        scoreHistory: { ...prev.scoreHistory, [levelId]: stars },
        npcLitLevels: prev.npcLitLevels.includes(levelId)
          ? prev.npcLitLevels
          : [...prev.npcLitLevels, levelId].sort((a, b) => Number(a) - Number(b))
      }));
      setLastTriggeredStamp(trigger);
      writeTriggerStamp(trigger);
    }, 150);
  };

  const handlePhotoUploaded = (photo: LivePhoto) => {
    setPhotos((prev) => [photo, ...prev]);
  };

  const handleClearScore = () => {
    setPassport(INITIAL_PASSPORT);
    setPhotos([]);
    setLastTriggeredStamp(null);
  };

  const sharedProps = {
    levels,
    passport,
    photos,
    lastTriggeredStamp,
    sceneAssets,
    hasCompletedIntro,
    bgmSrc: INTRO_BGM_URL,
    onUpdatePassport: handleUpdatePassport,
    onClearScore: handleClearScore,
    onPhotoUploaded: handlePhotoUploaded,
    onUpdateScore: handleNpcScoreLevel,
    onIntroComplete: () => setHasCompletedIntro(true)
  };

  const loadingShell = (
    <div className="min-h-screen bg-[#050609] flex items-center justify-center text-stone-400 font-serif tracking-[0.3em] uppercase">
      Loading Ritual...
    </div>
  );

  if (role === "customer") {
    return (
      <Suspense fallback={loadingShell}>
        <CustomerPage {...sharedProps} />
      </Suspense>
    );
  }

  if (role === "npc") {
    return (
      <Suspense fallback={loadingShell}>
        <NpcPage {...sharedProps} />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-[#050609] text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(240,196,116,0.18),transparent_35%),linear-gradient(160deg,#050609_0%,#0c1018_45%,#040404_100%)]" />
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-5xl rounded-[32px] border border-white/10 bg-white/6 backdrop-blur-2xl shadow-[0_24px_120px_rgba(0,0,0,0.45)] overflow-hidden">
          <div className="grid gap-px bg-white/8 md:grid-cols-2">
            <a href="?role=customer" className="group relative min-h-[520px] overflow-hidden bg-[#090b10] p-8">
              <img src={SCENE_ASSETS.finale} alt="customer terminal" className="absolute inset-0 h-full w-full object-cover opacity-45 transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/45 to-black/80" />
              <div className="relative flex h-full flex-col justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.35em] text-amber-300/80">Customer Terminal</p>
                  <h1 className="mt-4 text-3xl font-serif tracking-[0.18em] text-white">沉浸式传人长卷</h1>
                  <p className="mt-4 max-w-sm text-sm leading-7 text-stone-300">
                    仅加载孩子端 H5、开场电影与封藏长卷，不挂载 NPC 按钮，不展示任何后台控制结构。
                  </p>
                </div>
                <div className="inline-flex w-fit items-center rounded-full border border-amber-300/30 bg-black/35 px-5 py-3 text-xs uppercase tracking-[0.28em] text-amber-100">
                  进入 customer 端
                </div>
              </div>
            </a>
            <a href="?role=npc" className="group relative min-h-[520px] overflow-hidden bg-[#090b10] p-8">
              <img src={SCENE_ASSETS.union} alt="npc terminal" className="absolute inset-0 h-full w-full object-cover opacity-35 transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black/85" />
              <div className="relative flex h-full flex-col justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.35em] text-red-300/80">Npc Console</p>
                  <h2 className="mt-4 text-3xl font-serif tracking-[0.18em] text-white">真人评分控制台</h2>
                  <p className="mt-4 max-w-sm text-sm leading-7 text-stone-300">
                    仅加载 NPC 核验与点亮界面，专注线下评分，不再携带客户长卷与沉浸式前台结构。
                  </p>
                </div>
                <div className="inline-flex w-fit items-center rounded-full border border-red-300/30 bg-black/35 px-5 py-3 text-xs uppercase tracking-[0.28em] text-red-100">
                  进入 npc 端
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
