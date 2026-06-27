import { LivePhoto, UserPassport } from "../types";
import { normalizePhone } from "./familyRoster";

export interface PassportRecord {
  passport: UserPassport;
  photos: LivePhoto[];
  updatedAt: number;
}

export type PassportRegistry = Record<string, PassportRecord>;

export const PASSPORT_REGISTRY_STORAGE_KEY = "xiaoxiao-chuanren-passport-registry-v1";
export const LAST_CUSTOMER_PASSPORT_KEY = "xiaoxiao-chuanren-last-customer-v1";
export const LAST_NPC_PASSPORT_KEY = "xiaoxiao-chuanren-last-npc-v1";
export const LAST_PHOTOGRAPHER_PASSPORT_KEY = "xiaoxiao-chuanren-last-photographer-v1";

const SCAN_PREFIX = "XIAOXIAO_PASSPORT:";
const TICKET_PREFIX = "XIAOXIAO_TICKET:";

export function generatePassportId() {
  const randomSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `XC-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;
}

export function createRoleResumeUrl(baseUrl: string, role: "customer" | "npc" | "photographer", passportId: string) {
  const url = new URL(baseUrl);
  url.searchParams.set("role", role);
  url.searchParams.set("passport", passportId);
  return url.toString();
}

export function createNpcScanPayload(ticketToken: string) {
  return `${TICKET_PREFIX}${ticketToken}`;
}

export function createCustomerResumeUrl(baseUrl: string, passportId: string) {
  return createRoleResumeUrl(baseUrl, "customer", passportId);
}

export function createNpcResumeUrl(baseUrl: string, passportId: string) {
  return createRoleResumeUrl(baseUrl, "npc", passportId);
}

export function createPhotographerResumeUrl(baseUrl: string, passportId: string) {
  return createRoleResumeUrl(baseUrl, "photographer", passportId);
}

export function parsePassportIdFromScan(rawValue: string) {
  const trimmed = rawValue.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith(TICKET_PREFIX)) {
    const payload = trimmed.slice(TICKET_PREFIX.length).trim();
    return payload ? `ticket:${payload}` : null;
  }

  if (trimmed.startsWith(SCAN_PREFIX)) {
    return null;
  }

  if (/^XC-[A-Z0-9-]+$/i.test(trimmed)) {
    return `passport:${trimmed.toUpperCase()}`;
  }

  if (/^XCT-[A-Z0-9]+$/i.test(trimmed)) {
    return `ticket:${trimmed.toUpperCase()}`;
  }

  try {
    const normalizedUrl = new URL(trimmed);
    const ticket = normalizedUrl.searchParams.get("ticket");
    if (ticket) {
      return `ticket:${ticket.toUpperCase()}`;
    }
    const passportId = normalizedUrl.searchParams.get("passport");
    if (passportId && /^XC-[A-Z0-9-]+$/i.test(passportId.trim())) {
      return `passport:${passportId.trim().toUpperCase()}`;
    }
    return null;
  } catch {
    return null;
  }
}

export function readPassportRegistry() {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(PASSPORT_REGISTRY_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as PassportRegistry;
  } catch {
    return {};
  }
}

export function writePassportRegistry(registry: PassportRegistry) {
  window.localStorage.setItem(PASSPORT_REGISTRY_STORAGE_KEY, JSON.stringify(registry));
}

export function upsertPassportRecord(passport: UserPassport, photos: LivePhoto[]) {
  if (!passport.passportId) return;

  const registry = readPassportRegistry();
  registry[passport.passportId] = {
    passport,
    photos,
    updatedAt: Date.now()
  };
  writePassportRegistry(registry);
}

export function getPassportRecord(passportId: string) {
  const registry = readPassportRegistry();
  return registry[passportId] ?? null;
}

export function listRecentPassportRecords(limit = 12) {
  return Object.values(readPassportRegistry())
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, limit);
}

export function findPassportRecordByContactPhone(contactPhone: string) {
  const normalized = normalizePhone(contactPhone);
  if (normalized.length !== 11) return null;

  return (
    Object.values(readPassportRegistry())
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .find((record) => normalizePhone(record.passport.contactPhone) === normalized) ?? null
  );
}

export function readStoredPassportId(storageKey: string) {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(storageKey) ?? "";
}

export function writeStoredPassportId(storageKey: string, passportId: string) {
  window.localStorage.setItem(storageKey, passportId);
}
