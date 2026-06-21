/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 战略重构版：CEO - Hermes - 2026-06-21
 */

import { useState, useEffect } from "react";
import { GameLevel, UserPassport, LivePhoto, LevelStatus } from "./types";
import PrerollIntro from "./components/PrerollIntro";
import ParallaxScrollH5 from "./components/ParallaxScrollH5";
import NpcDashboard from "./components/NpcDashboard";
import PhotographerDashboard from "./components/PhotographerDashboard";

// 这是一个极其简易的路由系统，不需要外部依赖，确保秒开且不报错
export default function App() {
  const [route, setRoute] = useState<string>("simulator");

  // 1. 自动检测 URL 路径
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes("/customer")) setRoute("customer");
    else if (path.includes("/npc")) setRoute("npc");
    else if (path.includes("/photographer")) setRoute("photographer");
    else setRoute("simulator"); // 默认展示 CEO 模拟器
  }, []);

  // 状态共享 (实战建议上迁至 Supabase)
  const [levels, setLevels] = useState<GameLevel[]>(INITIAL_LEVELS);
  const [passport, setPassport] = useState<UserPassport>(INITIAL_PASSPORT);
  const [photos, setPhotos] = useState<LivePhoto[]>([]);

  // 核心渲染分流
  if (route === "customer") {
    return <CustomerView passport={passport} levels={levels} />;
  }
  
  if (route === "npc") {
    return <NpcDashboard levels={levels} passport={passport} onUpdateScore={(id, stars) => {}} />;
  }

  // 默认返回原来的那种全能版（方便老严测试全貌）
  return (
    <div className="simulator-fullscreen">
       {/* 之前的 App 代码内容... */}
    </div>
  );
}

// 模拟 INITIAL_LEVELS 等常量...
const INITIAL_LEVELS = [...]; 
const INITIAL_PASSPORT = {...};
