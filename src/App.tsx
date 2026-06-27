/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  FamilyAccessRecord,
  FrontDeskCheckInRecord,
  GameLevel,
  LivePhoto,
  LevelStatus,
  UserPassport,
  VerifiedFamilySession
} from "./types";
import {
  buildVerifiedFamilySessionFromPassport,
  clearVerifiedFamilySession,
  readVerifiedFamilySession,
  writeVerifiedFamilySession
} from "./utils/customerAccess";
import {
  awardPassportLevel,
  checkInFamilyByPhone,
  fetchCustomerPassportState,
  fetchStaffDashboardSnapshot,
  fetchStaffPassportState,
  getBackendErrorMessage,
  importRoster,
  issuePassportScanTicket,
  resolvePassportScanTicket,
  saveCustomerPassport,
  uploadPassportPhoto
} from "./utils/backend";
import { PassportRecord, LAST_CUSTOMER_PASSPORT_KEY, LAST_NPC_PASSPORT_KEY, LAST_PHOTOGRAPHER_PASSPORT_KEY, createCustomerResumeUrl, createNpcScanPayload, generatePassportId, getPassportRecord, listRecentPassportRecords, parsePassportIdFromScan, readStoredPassportId, upsertPassportRecord, writeStoredPassportId } from "./utils/passport";
import { readStaffSession, STAFF_SESSION_CHANGE_EVENT } from "./utils/staffAccess";
import { createNpcResumeUrl, createPhotographerResumeUrl } from "./utils/passport";

const CustomerPage = lazy(() => import("./pages/Customer"));
const NpcPage = lazy(() => import("./pages/Npc"));
const PhotographerPage = lazy(() => import("./pages/Photographer"));

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
  passportId: "",
  rosterFamilyId: "",
  familyLabel: "",
  contactName: "",
  contactPhone: "",
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

type RoleMode = "customer" | "npc" | "photographer" | "default";
type StaffRole = "npc" | "photographer";
type TriggerStamp = { passportId: string; levelId: string; stars: number; timestamp: number } | null;

function getRoleFromSearch(search: string): RoleMode {
  const role = new URLSearchParams(search).get("role");
  if (role === "customer" || role === "npc" || role === "photographer") return role;
  return "default";
}

function getPassportIdFromSearch(search: string) {
  return new URLSearchParams(search).get("passport") ?? "";
}

function replaceRouteState(role: RoleMode, passportId = "") {
  const url = new URL(window.location.href);
  url.searchParams.set("role", role);
  if (passportId) {
    url.searchParams.set("passport", passportId);
  } else {
    url.searchParams.delete("passport");
  }
  window.history.replaceState({}, "", `${url.pathname}${url.search}`);
}

function buildPassportFromVerifiedFamily(verifiedFamily: VerifiedFamilySession | null): UserPassport {
  if (!verifiedFamily) return INITIAL_PASSPORT;

  return {
    ...INITIAL_PASSPORT,
    rosterFamilyId: verifiedFamily.rosterFamilyId,
    familyLabel: verifiedFamily.familyLabel,
    contactName: verifiedFamily.contactName,
    contactPhone: verifiedFamily.contactPhone
  };
}

function getStaffStorageKey(role: StaffRole) {
  return role === "npc" ? LAST_NPC_PASSPORT_KEY : LAST_PHOTOGRAPHER_PASSPORT_KEY;
}

function hasPassportChanged(a: UserPassport, b: UserPassport) {
  return JSON.stringify(a) !== JSON.stringify(b);
}

function havePhotosChanged(a: LivePhoto[], b: LivePhoto[]) {
  return JSON.stringify(a) !== JSON.stringify(b);
}

export default function App() {
  const [role, setRole] = useState<RoleMode>(() => getRoleFromSearch(window.location.search));
  const [hasCompletedIntro, setHasCompletedIntro] = useState(false);
  const [verifiedFamily, setVerifiedFamily] = useState<VerifiedFamilySession | null>(() => {
    const currentRole = getRoleFromSearch(window.location.search);
    if (currentRole !== "customer") return null;
    return readVerifiedFamilySession();
  });
  const [activePassportId, setActivePassportId] = useState<string>(() => {
    const searchPassportId = getPassportIdFromSearch(window.location.search);
    if (searchPassportId) return searchPassportId;

    const currentRole = getRoleFromSearch(window.location.search);
    if (currentRole === "customer") return readStoredPassportId(LAST_CUSTOMER_PASSPORT_KEY);
    if (currentRole === "npc") return readStoredPassportId(LAST_NPC_PASSPORT_KEY);
    if (currentRole === "photographer") return readStoredPassportId(LAST_PHOTOGRAPHER_PASSPORT_KEY);
    return "";
  });
  const [passport, setPassport] = useState<UserPassport>(() => {
    if (activePassportId) {
      return getPassportRecord(activePassportId)?.passport ?? INITIAL_PASSPORT;
    }
    return buildPassportFromVerifiedFamily(readVerifiedFamilySession());
  });
  const [photos, setPhotos] = useState<LivePhoto[]>(() => (activePassportId ? getPassportRecord(activePassportId)?.photos ?? [] : []));
  const [lastTriggeredStamp, setLastTriggeredStamp] = useState<TriggerStamp>(null);
  const [passportScanPayload, setPassportScanPayload] = useState("");
  const [familyRoster, setFamilyRoster] = useState<FamilyAccessRecord[]>([]);
  const [frontDeskCheckInLogs, setFrontDeskCheckInLogs] = useState<FrontDeskCheckInRecord[]>([]);
  const [recentPassportRecords, setRecentPassportRecords] = useState<PassportRecord[]>(() => listRecentPassportRecords());

  const cachePassportRecord = (nextPassport: UserPassport, nextPhotos: LivePhoto[]) => {
    if (!nextPassport.passportId) return;
    upsertPassportRecord(nextPassport, nextPhotos);
    setRecentPassportRecords(listRecentPassportRecords());
  };

  const applyPassportState = (nextPassport: UserPassport, nextPhotos: LivePhoto[], shouldTrigger = false) => {
    if (shouldTrigger) {
      const newLevelId = nextPassport.npcLitLevels.find((levelId) => !passport.npcLitLevels.includes(levelId));
      if (newLevelId) {
        setLastTriggeredStamp({
          passportId: nextPassport.passportId,
          levelId: newLevelId,
          stars: nextPassport.scoreHistory[newLevelId] ?? 0,
          timestamp: Date.now()
        });
      }
    }

    setPassport(nextPassport);
    setPhotos(nextPhotos);
    cachePassportRecord(nextPassport, nextPhotos);
  };

  const hydratePassportByRole = async (targetRole: RoleMode, passportId: string) => {
    if (!passportId) {
      const storedVerifiedFamily = targetRole === "customer" ? readVerifiedFamilySession() : null;
      setVerifiedFamily(storedVerifiedFamily);
      setPassport(buildPassportFromVerifiedFamily(storedVerifiedFamily));
      setPhotos([]);
      return;
    }

    try {
      if (targetRole === "customer") {
        const result = await fetchCustomerPassportState(passportId);
        if (result.ok && result.passport) {
          applyPassportState(result.passport, result.photos ?? []);
          setVerifiedFamily(buildVerifiedFamilySessionFromPassport(result.passport));
        }
        return;
      }

      if (targetRole === "npc" || targetRole === "photographer") {
        const staffSession = readStaffSession(targetRole);
        if (!staffSession) {
          const cachedRecord = getPassportRecord(passportId);
          if (cachedRecord) {
            setPassport(cachedRecord.passport);
            setPhotos(cachedRecord.photos);
          }
          return;
        }

        const result = await fetchStaffPassportState(staffSession.sessionToken, targetRole, passportId);
        if (result.ok && result.passport) {
          applyPassportState(result.passport, result.photos ?? []);
        }
      }
    } catch {
      const cachedRecord = getPassportRecord(passportId);
      if (cachedRecord) {
        setPassport(cachedRecord.passport);
        setPhotos(cachedRecord.photos);
      }
    }
  };

  const refreshStaffSnapshot = async (staffRole: StaffRole) => {
    const session = readStaffSession(staffRole);
    if (!session) return;

    try {
      const snapshot = await fetchStaffDashboardSnapshot(session.sessionToken, staffRole);
      if (!snapshot.ok) return;

      setFamilyRoster(snapshot.familyRoster ?? []);
      setFrontDeskCheckInLogs(snapshot.frontDeskCheckInLogs ?? []);
      setRecentPassportRecords(snapshot.recentPassportRecords ?? []);
      (snapshot.recentPassportRecords ?? []).forEach((record) => cachePassportRecord(record.passport, record.photos));
    } catch {
      // Ignore transient snapshot failures.
    }
  };

  const persistCustomerPassport = async (nextPassport: UserPassport) => {
    if (!nextPassport.passportId || !nextPassport.rosterFamilyId || !nextPassport.contactPhone) return;

    try {
      const result = await saveCustomerPassport(nextPassport);
      if (result.ok && result.passport) {
        setPassport(result.passport);
        cachePassportRecord(result.passport, photos);
      }
    } catch {
      // Keep local state as fallback when remote persistence is temporarily unavailable.
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const nextRole = getRoleFromSearch(window.location.search);
      const searchPassportId = getPassportIdFromSearch(window.location.search);
      setRole(nextRole);
      setActivePassportId(searchPassportId);
      void hydratePassportByRole(nextRole, searchPassportId);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    void hydratePassportByRole(role, activePassportId);
    if (role === "npc" || role === "photographer") {
      void refreshStaffSnapshot(role);
    }
  }, [role, activePassportId]);

  useEffect(() => {
    const handleStaffSessionChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ role?: StaffRole }>).detail;
      if (!detail?.role || detail.role !== role) return;

      void refreshStaffSnapshot(detail.role);
      if (activePassportId) {
        void hydratePassportByRole(detail.role, activePassportId);
      }
    };

    window.addEventListener(STAFF_SESSION_CHANGE_EVENT, handleStaffSessionChanged as EventListener);
    return () => window.removeEventListener(STAFF_SESSION_CHANGE_EVENT, handleStaffSessionChanged as EventListener);
  }, [role, activePassportId]);

  useEffect(() => {
    if (role !== "customer") return;

    const nextVerifiedFamily = buildVerifiedFamilySessionFromPassport(passport) ?? verifiedFamily;
    if (nextVerifiedFamily) {
      writeVerifiedFamilySession(nextVerifiedFamily);
      return;
    }

    clearVerifiedFamilySession();
  }, [passport, role, verifiedFamily]);

  useEffect(() => {
    if (role !== "customer" || !passport.passportId || !passport.contactPhone || !passport.activated) {
      setPassportScanPayload("");
      return;
    }

    let cancelled = false;

    const refreshTicket = async () => {
      try {
        const result = await issuePassportScanTicket(passport.passportId, passport.contactPhone);
        if (!cancelled && result.ok && result.ticket_token) {
          setPassportScanPayload(createNpcScanPayload(result.ticket_token));
        }
      } catch {
        if (!cancelled) {
          setPassportScanPayload("");
        }
      }
    };

    void refreshTicket();
    const intervalId = window.setInterval(() => {
      void refreshTicket();
    }, 45000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [role, passport.passportId, passport.contactPhone, passport.activated]);

  useEffect(() => {
    if (role === "customer" && passport.passportId) {
      writeStoredPassportId(LAST_CUSTOMER_PASSPORT_KEY, passport.passportId);
      if (activePassportId !== passport.passportId) {
        setActivePassportId(passport.passportId);
      }
      replaceRouteState("customer", passport.passportId);
      return;
    }

    if (role === "npc" && activePassportId) {
      writeStoredPassportId(LAST_NPC_PASSPORT_KEY, activePassportId);
      replaceRouteState("npc", activePassportId);
      return;
    }

    if (role === "photographer" && activePassportId) {
      writeStoredPassportId(LAST_PHOTOGRAPHER_PASSPORT_KEY, activePassportId);
      replaceRouteState("photographer", activePassportId);
    }
  }, [activePassportId, passport.passportId, role]);

  useEffect(() => {
    if (role !== "customer" || !passport.passportId) return;

    const intervalId = window.setInterval(() => {
      void fetchCustomerPassportState(passport.passportId)
        .then((result) => {
          if (!result.ok || !result.passport) return;
          if (!hasPassportChanged(passport, result.passport) || !havePhotosChanged(photos, result.photos ?? [])) {
            if (!hasPassportChanged(passport, result.passport) && !havePhotosChanged(photos, result.photos ?? [])) {
              return;
            }
          }
          applyPassportState(result.passport, result.photos ?? [], true);
        })
        .catch(() => {
          // Ignore polling hiccups.
        });
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [role, passport, photos]);

  const sceneAssets = useMemo(() => [SCENE_ASSETS.ink, SCENE_ASSETS.run, SCENE_ASSETS.union, SCENE_ASSETS.finale], []);

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
    setPassport((prev) => {
      const shouldGeneratePassportId = Boolean(updatedFields.activated || updatedFields.passportId || prev.passportId);
      const nextPassport = {
        ...prev,
        ...updatedFields,
        passportId: updatedFields.passportId || prev.passportId || (shouldGeneratePassportId ? generatePassportId() : ""),
        scoreHistory: updatedFields.scoreHistory ?? prev.scoreHistory,
        npcLitLevels: updatedFields.npcLitLevels ?? prev.npcLitLevels
      };
      cachePassportRecord(nextPassport, photos);
      void persistCustomerPassport(nextPassport);
      return nextPassport;
    });
  };

  const handleNpcScoreLevel = async (levelId: string, stars: number) => {
    if (!passport.passportId || role !== "npc") {
      return {
        ok: false,
        message: "请先绑定孩子护照，再执行真人授勋。"
      };
    }

    const session = readStaffSession("npc");
    if (!session) {
      return {
        ok: false,
        message: "工作人员会话已失效，请重新登录 NPC 后台。"
      };
    }

    try {
      const result = await awardPassportLevel(session.sessionToken, passport.passportId, levelId, stars);
      if (!result.ok || !result.passport) {
        return {
          ok: false,
          message: result.message || "远端授勋失败，请稍后重试。"
        };
      }

      const trigger = {
        passportId: result.passport.passportId,
        levelId,
        stars,
        timestamp: Date.now()
      };
      setLastTriggeredStamp(trigger);
      applyPassportState(result.passport, photos);
      await refreshStaffSnapshot("npc");

      return {
        ok: true,
        message: `已完成 ${levelId} 关现场授勋。孩子端将收到最新勋章状态并刷新下一关。`
      };
    } catch (error) {
      return {
        ok: false,
        message: getBackendErrorMessage(error, "远端授勋失败，请检查 Supabase 连接。")
      };
    }
  };

  const handlePhotoUploaded = async (photo: LivePhoto) => {
    if (!passport.passportId || role !== "photographer") {
      return {
        ok: false,
        message: "请先绑定客户，再上传照片。"
      };
    }

    const session = readStaffSession("photographer");
    if (!session) {
      return {
        ok: false,
        message: "摄影师会话已失效，请重新登录。"
      };
    }

    try {
      const result = await uploadPassportPhoto(session.sessionToken, passport.passportId, photo);
      if (!result.ok) {
        return {
          ok: false,
          message: result.message || "远端照片上传失败。"
        };
      }

      const nextPhotos = [photo, ...photos];
      setPhotos(nextPhotos);
      cachePassportRecord(passport, nextPhotos);
      await refreshStaffSnapshot("photographer");

      return {
        ok: true,
        message: "照片已写入云端档案，并同步到客户长卷。"
      };
    } catch (error) {
      return {
        ok: false,
        message: getBackendErrorMessage(error, "远端照片上传失败，请稍后重试。")
      };
    }
  };

  const handleClearScore = () => {
    setPassport((prev) => ({
      ...INITIAL_PASSPORT,
      passportId: prev.passportId,
      rosterFamilyId: prev.rosterFamilyId,
      familyLabel: prev.familyLabel,
      contactName: prev.contactName,
      contactPhone: prev.contactPhone,
      childName: prev.childName,
      familyName: prev.familyName,
      customMotto: prev.customMotto,
      avatarStyle: prev.avatarStyle,
      activated: prev.activated
    }));
    setPhotos([]);
    setLastTriggeredStamp(null);
  };

  const handleVerifyCustomerAccess = async (rawPhone: string) => {
    try {
      const result = await checkInFamilyByPhone(rawPhone);
      if (!result.ok || !result.family) {
        return {
          ok: false,
          message: result.message || "该手机号不在本场家庭团报名名单中。"
        };
      }

      const nextVerifiedFamily: VerifiedFamilySession = {
        rosterFamilyId: result.family.id,
        familyLabel: result.family.familyLabel,
        contactName: result.family.contactName,
        contactPhone: result.family.contactPhone,
        verifiedAt: new Date().toISOString()
      };

      setVerifiedFamily(nextVerifiedFamily);
      writeVerifiedFamilySession(nextVerifiedFamily);
      await refreshStaffSnapshot("npc");

      if (result.passport?.passportId) {
        const passportState = await fetchCustomerPassportState(result.passport.passportId);
        if (passportState.ok && passportState.passport) {
          setActivePassportId(passportState.passport.passportId);
          applyPassportState(passportState.passport, passportState.photos ?? []);
          replaceRouteState("customer", passportState.passport.passportId);
        }

        return {
          ok: true,
          message: `${result.family.familyLabel} 已报到，系统识别到该手机号已有家庭账号，现已直接续接原护照。`
        };
      }

      setActivePassportId("");
      setPassport(buildPassportFromVerifiedFamily(nextVerifiedFamily));
      setPhotos([]);
      replaceRouteState("customer");

      return {
        ok: true,
        message: `${result.family.familyLabel} 已完成报到核验，请继续激活孩子的传人护照。`
      };
    } catch (error) {
      return {
        ok: false,
        message: getBackendErrorMessage(error, "手机号核验失败，请检查 Supabase 连接。")
      };
    }
  };

  const handleClearCustomerAccess = () => {
    setVerifiedFamily(null);
    clearVerifiedFamilySession();
    writeStoredPassportId(LAST_CUSTOMER_PASSPORT_KEY, "");
    setActivePassportId("");
    setPassport(INITIAL_PASSPORT);
    setPhotos([]);
    setLastTriggeredStamp(null);
    setHasCompletedIntro(false);
    replaceRouteState("customer");
  };

  const handleRestartCustomerActivation = () => {
    setLastTriggeredStamp(null);
    handleUpdatePassport({
      activated: false
    });
  };

  const handleImportFamilyRoster = async (records: FamilyAccessRecord[]) => {
    const session = readStaffSession("npc");
    if (!session) {
      return {
        ok: false,
        message: "工作人员会话已失效，请重新登录 NPC 后台。"
      };
    }

    try {
      const result = await importRoster(session.sessionToken, records);
      if (!result.ok) {
        return {
          ok: false,
          message: result.message || "导入失败，请稍后重试。"
        };
      }

      await refreshStaffSnapshot("npc");
      return {
        ok: true,
        message: `已导入 ${records.length} 个家庭名单，新的报到手机号白名单已同步到 Supabase。`
      };
    } catch (error) {
      return {
        ok: false,
        message: getBackendErrorMessage(error, "名单导入失败，请检查 Supabase 连接。")
      };
    }
  };

  const handleScanPassport = async (rawValue: string) => {
    const parsedScanValue = parsePassportIdFromScan(rawValue);
    if (!parsedScanValue) {
      return {
        ok: false,
        message: "未识别到有效传人印信，请重新扫码或粘贴完整护照码。"
      };
    }

    if (role !== "npc" && role !== "photographer") {
      return {
        ok: false,
        message: "当前终端不支持后台扫码。"
      };
    }

    const session = readStaffSession(role);
    if (!session) {
      return {
        ok: false,
        message: "工作人员会话已失效，请重新登录。"
      };
    }

    try {
      let resolvedPassportId = "";

      if (parsedScanValue.startsWith("ticket:")) {
        const ticketToken = parsedScanValue.slice("ticket:".length);
        const ticketResult = await resolvePassportScanTicket(session.sessionToken, role, ticketToken);
        if (!ticketResult.ok || !ticketResult.passport_id) {
          return {
            ok: false,
            message: ticketResult.message || "授权码无效，请让客户刷新二维码后重试。"
          };
        }
        resolvedPassportId = ticketResult.passport_id;
      } else if (parsedScanValue.startsWith("passport:")) {
        resolvedPassportId = parsedScanValue.slice("passport:".length);
      }

      if (!resolvedPassportId) {
        return {
          ok: false,
          message: "未解析出有效传人档案，请重新扫码。"
        };
      }

      const result = await fetchStaffPassportState(session.sessionToken, role, resolvedPassportId);
      if (!result.ok || !result.passport) {
        return {
          ok: false,
          message: result.message || "未找到该传人档案，请确认孩子已经先在客户端完成护照激活。"
        };
      }

      setActivePassportId(resolvedPassportId);
      applyPassportState(result.passport, result.photos ?? []);
      writeStoredPassportId(getStaffStorageKey(role), resolvedPassportId);
      replaceRouteState(role, resolvedPassportId);

      return {
        ok: true,
        message: `已锁定 ${result.passport.familyName || "未命名"}氏${result.passport.childName || "传人"} 的现场核验流程。`
      };
    } catch (error) {
      return {
        ok: false,
        message: getBackendErrorMessage(error, "扫码绑定失败，请稍后重试。")
      };
    }
  };

  const handleClearNpcSelection = () => {
    setActivePassportId("");
    setPassport(INITIAL_PASSPORT);
    setPhotos([]);
    if (role === "npc" || role === "photographer") {
      replaceRouteState(role);
      writeStoredPassportId(getStaffStorageKey(role), "");
    }
  };

  const routeBaseUrl = useMemo(() => `${window.location.origin}${window.location.pathname}`, []);
  const customerResumeUrl = useMemo(() => (passport.passportId ? createCustomerResumeUrl(routeBaseUrl, passport.passportId) : ""), [passport.passportId, routeBaseUrl]);
  const npcResumeUrl = useMemo(() => (passport.passportId ? createNpcResumeUrl(routeBaseUrl, passport.passportId) : ""), [passport.passportId, routeBaseUrl]);
  const photographerResumeUrl = useMemo(
    () => (passport.passportId ? createPhotographerResumeUrl(routeBaseUrl, passport.passportId) : ""),
    [passport.passportId, routeBaseUrl]
  );

  const sharedProps = {
    levels,
    passport,
    photos,
    lastTriggeredStamp,
    sceneAssets,
    hasCompletedIntro,
    bgmSrc: INTRO_BGM_URL,
    activePassportId,
    verifiedFamily,
    familyRoster,
    frontDeskCheckInLogs,
    passportScanPayload,
    customerResumeUrl,
    npcResumeUrl,
    photographerResumeUrl,
    recentPassportRecords,
    onUpdatePassport: handleUpdatePassport,
    onClearScore: handleClearScore,
    onPhotoUploaded: handlePhotoUploaded,
    onUpdateScore: handleNpcScoreLevel,
    onVerifyCustomerAccess: handleVerifyCustomerAccess,
    onClearCustomerAccess: handleClearCustomerAccess,
    onRestartCustomerActivation: handleRestartCustomerActivation,
    onImportFamilyRoster: handleImportFamilyRoster,
    onIntroComplete: () => setHasCompletedIntro(true),
    onScanPassport: handleScanPassport,
    onClearNpcSelection: handleClearNpcSelection
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

  if (role === "photographer") {
    return (
      <Suspense fallback={loadingShell}>
        <PhotographerPage {...sharedProps} />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-[#050609] text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(240,196,116,0.18),transparent_35%),linear-gradient(160deg,#050609_0%,#0c1018_45%,#040404_100%)]" />
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-5xl rounded-[32px] border border-white/10 bg-white/6 backdrop-blur-2xl shadow-[0_24px_120px_rgba(0,0,0,0.45)] overflow-hidden">
          <div className="grid gap-px bg-white/8 md:grid-cols-3">
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
            <a href="?role=photographer" className="group relative min-h-[520px] overflow-hidden bg-[#090b10] p-8">
              <img src={SCENE_ASSETS.run} alt="photographer terminal" className="absolute inset-0 h-full w-full object-cover opacity-35 transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/45 to-black/85" />
              <div className="relative flex h-full flex-col justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-300/80">Photographer Upload</p>
                  <h2 className="mt-4 text-3xl font-serif tracking-[0.18em] text-white">摄影师随拍上传端</h2>
                  <p className="mt-4 max-w-sm text-sm leading-7 text-stone-300">
                    摄影师可扫码锁定客户、上传现场照片并实时同步到客户相片长卷，避免和 NPC 评分后台混用。
                  </p>
                </div>
                <div className="inline-flex w-fit items-center rounded-full border border-cyan-300/30 bg-black/35 px-5 py-3 text-xs uppercase tracking-[0.28em] text-cyan-100">
                  进入 photographer 端
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
