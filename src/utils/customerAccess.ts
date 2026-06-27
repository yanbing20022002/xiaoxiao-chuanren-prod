import { FamilyAccessRecord, UserPassport, VerifiedFamilySession } from "../types";
import { readFamilyRoster, normalizePhone } from "./familyRoster";
import { repairMojibakeText } from "./textEncoding";

export const VERIFIED_FAMILY_STORAGE_KEY = "xiaoxiao-chuanren-verified-family-v1";

export function maskPhone(value: string) {
  const normalized = normalizePhone(value);
  if (normalized.length !== 11) return normalized;
  return `${normalized.slice(0, 3)}****${normalized.slice(-4)}`;
}

export function findFamilyAccessRecordByPhone(rawPhone: string) {
  const normalized = normalizePhone(rawPhone);
  if (normalized.length !== 11) return null;

  return readFamilyRoster().find((record) => normalizePhone(record.contactPhone) === normalized) ?? null;
}

export function createVerifiedFamilySession(record: FamilyAccessRecord): VerifiedFamilySession {
  return {
    rosterFamilyId: record.id,
    familyLabel: repairMojibakeText(record.familyLabel),
    contactName: repairMojibakeText(record.contactName),
    contactPhone: normalizePhone(record.contactPhone),
    verifiedAt: new Date().toISOString()
  };
}

export function buildVerifiedFamilySessionFromPassport(passport: UserPassport): VerifiedFamilySession | null {
  if (!passport.rosterFamilyId || !passport.contactPhone) return null;

  return {
    rosterFamilyId: passport.rosterFamilyId,
    familyLabel: repairMojibakeText(passport.familyLabel),
    contactName: repairMojibakeText(passport.contactName),
    contactPhone: normalizePhone(passport.contactPhone),
    verifiedAt: new Date().toISOString()
  };
}

export function readVerifiedFamilySession() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(VERIFIED_FAMILY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as VerifiedFamilySession;
    return {
      ...parsed,
      familyLabel: repairMojibakeText(parsed.familyLabel),
      contactName: repairMojibakeText(parsed.contactName)
    };
  } catch {
    return null;
  }
}

export function writeVerifiedFamilySession(session: VerifiedFamilySession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(VERIFIED_FAMILY_STORAGE_KEY, JSON.stringify(session));
}

export function clearVerifiedFamilySession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(VERIFIED_FAMILY_STORAGE_KEY);
}
