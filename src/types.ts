/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Core types for "小小封藏传人" Cinematic Game System

export enum LevelStatus {
  LOCKED = "locked",
  ACTIVE = "active",
  COMPLETED = "completed"
}

export interface GameLevel {
  id: string; // "01", "02", "03", "04", "05"
  num: number;
  title: string;
  subtitle: string;
  physicalActivity: string;
  digitalGameplay: string;
  successStandard: string;
  stars: number; // 0 to 5, if completed
  status: LevelStatus;
  parallaxOffset: number; // For 3D Scroll
}

export interface UserPassport {
  childName: string;
  familyName: string;
  customMotto: string;
  avatarStyle: string; // e.g. "汉服青衣", "汉服玄衣", "汉服金羽"
  activated: boolean;
  scoreHistory: { [levelId: string]: number };
  npcLitLevels: string[];
}

export interface LivePhoto {
  id: string;
  imageUrl: string;
  caption: string;
  location: string;
  timestamp: string;
  aiMotto?: string;
  savedToPoster: boolean;
}
