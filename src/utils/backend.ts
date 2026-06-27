import { FamilyAccessRecord, FrontDeskCheckInRecord, LivePhoto, UserPassport } from "../types";
import { PassportRecord } from "./passport";
import { supabase } from "../lib/supabase";
import { repairMojibakeText } from "./textEncoding";

export interface OperationResult {
  ok: boolean;
  message: string;
}

interface BackendStaffSessionPayload extends OperationResult {
  role?: "npc" | "photographer" | "admin";
  operator_name?: string;
  session_token?: string;
  granted_at?: string;
  expires_at?: number;
}

interface BackendPassportStatePayload extends OperationResult {
  passport?: Record<string, unknown>;
  photos?: Array<Record<string, unknown>>;
}

interface BackendScanTicketPayload extends OperationResult {
  ticket_token?: string;
  passport_id?: string;
  expires_at?: number;
}

interface BackendCheckInPayload extends OperationResult {
  status?: "verified" | "resumed";
  family?: Record<string, unknown>;
  passport?: Record<string, unknown> | null;
}

interface BackendDashboardSnapshot extends OperationResult {
  family_roster?: Array<Record<string, unknown>>;
  frontdesk_checkins?: Array<Record<string, unknown>>;
  recent_passports?: Array<{
    passport?: Record<string, unknown>;
    photos?: Array<Record<string, unknown>>;
    updatedAt?: number;
  }>;
}

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function normalizeScoreHistory(value: unknown) {
  if (!value || typeof value !== "object") return {};
  return Object.entries(value as Record<string, unknown>).reduce<Record<string, number>>((acc, [key, entry]) => {
    const nextValue = Number(entry);
    if (Number.isFinite(nextValue)) {
      acc[key] = nextValue;
    }
    return acc;
  }, {});
}

function mapPassport(raw: Record<string, unknown> | null | undefined): UserPassport {
  if (!raw) {
    return {
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
  }

  return {
    passportId: String(raw.passport_id ?? raw.passportId ?? ""),
    rosterFamilyId: String(raw.roster_family_id ?? raw.rosterFamilyId ?? ""),
    familyLabel: repairMojibakeText(String(raw.family_label ?? raw.familyLabel ?? "")),
    contactName: repairMojibakeText(String(raw.contact_name ?? raw.contactName ?? "")),
    contactPhone: String(raw.contact_phone ?? raw.contactPhone ?? ""),
    childName: repairMojibakeText(String(raw.child_name ?? raw.childName ?? "")),
    familyName: repairMojibakeText(String(raw.family_name ?? raw.familyName ?? "")),
    customMotto: repairMojibakeText(String(raw.custom_motto ?? raw.customMotto ?? "")),
    avatarStyle: String(raw.avatar_style ?? raw.avatarStyle ?? "汉服青衣"),
    activated: Boolean(raw.activated),
    scoreHistory: normalizeScoreHistory(raw.score_history ?? raw.scoreHistory),
    npcLitLevels: Array.isArray(raw.npc_lit_levels ?? raw.npcLitLevels)
      ? (raw.npc_lit_levels ?? raw.npcLitLevels).map((item) => String(item))
      : []
  };
}

function mapPhoto(raw: Record<string, unknown>): LivePhoto {
  return {
    id: String(raw.id ?? ""),
    imageUrl: String(raw.imageUrl ?? raw.image_url ?? ""),
    caption: String(raw.caption ?? ""),
    location: String(raw.location ?? ""),
    timestamp: String(raw.timestamp ?? raw.timestamp_text ?? ""),
    aiMotto: raw.aiMotto ? String(raw.aiMotto) : raw.ai_motto ? String(raw.ai_motto) : undefined,
    savedToPoster: Boolean(raw.savedToPoster ?? raw.saved_to_poster)
  };
}

function mapFamily(raw: Record<string, unknown>): FamilyAccessRecord {
  return {
    id: String(raw.id ?? ""),
    familyLabel: repairMojibakeText(String(raw.familyLabel ?? raw.family_label ?? "")),
    contactName: repairMojibakeText(String(raw.contactName ?? raw.contact_name ?? "")),
    contactPhone: String(raw.contactPhone ?? raw.contact_phone ?? ""),
    note: repairMojibakeText(String(raw.note ?? "")),
    importedAt: String(raw.importedAt ?? raw.imported_at ?? "")
  };
}

function mapCheckin(raw: Record<string, unknown>): FrontDeskCheckInRecord {
  return {
    id: String(raw.id ?? ""),
    rosterFamilyId: String(raw.rosterFamilyId ?? raw.roster_family_id ?? ""),
    familyLabel: repairMojibakeText(String(raw.familyLabel ?? raw.family_label ?? "")),
    contactName: repairMojibakeText(String(raw.contactName ?? raw.contact_name ?? "")),
    contactPhone: String(raw.contactPhone ?? raw.contact_phone ?? ""),
    passportId: String(raw.passportId ?? raw.passport_id ?? ""),
    status: (raw.status === "resumed" ? "resumed" : "verified") as "verified" | "resumed",
    message: repairMojibakeText(String(raw.message ?? "")),
    checkedInAt: String(raw.checkedInAt ?? raw.checked_in_at ?? "")
  };
}

function mapPassportRecord(raw: { passport?: Record<string, unknown>; photos?: Array<Record<string, unknown>>; updatedAt?: number }): PassportRecord {
  return {
    passport: mapPassport(raw.passport),
    photos: Array.isArray(raw.photos) ? raw.photos.map(mapPhoto) : [],
    updatedAt: Number(raw.updatedAt ?? Date.now())
  };
}

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) {
    throw new Error(error.message);
  }
  return data as T;
}

export async function loginStaff(role: "npc" | "photographer", pin: string, operatorName: string) {
  const payload = await rpc<BackendStaffSessionPayload>("login_staff", {
    p_role: role,
    p_pin: pin,
    p_operator_name: operatorName
  });

  return payload;
}

export async function validateStaffSession(sessionToken: string, role: "npc" | "photographer") {
  const payload = await rpc<BackendStaffSessionPayload>("validate_staff_session", {
    p_session_token: sessionToken,
    p_role: role
  });

  return payload;
}

export async function logoutStaff(sessionToken: string) {
  await rpc<boolean>("logout_staff", {
    p_session_token: sessionToken
  });
}

export async function importRoster(sessionToken: string, records: FamilyAccessRecord[]) {
  const payload = await rpc<OperationResult & { count?: number }>("import_family_roster", {
    p_session_token: sessionToken,
    p_records: records.map((record) => ({
      id: record.id,
      family_label: record.familyLabel,
      contact_name: record.contactName,
      contact_phone: record.contactPhone,
      note: record.note ?? "",
      imported_at: record.importedAt ?? ""
    }))
  });

  return payload;
}

export async function checkInFamilyByPhone(rawPhone: string) {
  const payload = await rpc<BackendCheckInPayload>("check_in_family", {
    p_phone: rawPhone
  });

  return {
    ...payload,
    family: payload.family ? mapFamily(payload.family) : null,
    passport: payload.passport ? mapPassport(payload.passport) : null
  };
}

export async function saveCustomerPassport(passport: UserPassport) {
  const payload = await rpc<BackendPassportStatePayload>("upsert_customer_passport", {
    p_roster_family_id: passport.rosterFamilyId,
    p_contact_phone: passport.contactPhone,
    p_passport_id: passport.passportId,
    p_child_name: passport.childName,
    p_family_name: passport.familyName,
    p_custom_motto: passport.customMotto,
    p_avatar_style: passport.avatarStyle,
    p_activated: passport.activated,
    p_score_history: passport.scoreHistory,
    p_npc_lit_levels: passport.npcLitLevels
  });

  return {
    ...payload,
    passport: payload.passport ? mapPassport(payload.passport) : null
  };
}

export async function fetchCustomerPassportState(passportId: string) {
  const payload = await rpc<BackendPassportStatePayload>("get_customer_passport_state", {
    p_passport_id: passportId
  });

  return {
    ...payload,
    passport: payload.passport ? mapPassport(payload.passport) : null,
    photos: Array.isArray(payload.photos) ? payload.photos.map(mapPhoto) : []
  };
}

export async function fetchStaffDashboardSnapshot(sessionToken: string, role: "npc" | "photographer") {
  const payload = await rpc<BackendDashboardSnapshot>("get_staff_dashboard_snapshot", {
    p_session_token: sessionToken,
    p_role: role
  });

  return {
    ...payload,
    familyRoster: Array.isArray(payload.family_roster) ? payload.family_roster.map(mapFamily) : [],
    frontDeskCheckInLogs: Array.isArray(payload.frontdesk_checkins) ? payload.frontdesk_checkins.map(mapCheckin) : [],
    recentPassportRecords: Array.isArray(payload.recent_passports) ? payload.recent_passports.map(mapPassportRecord) : []
  };
}

export async function fetchStaffPassportState(sessionToken: string, role: "npc" | "photographer", passportId: string) {
  const payload = await rpc<BackendPassportStatePayload>("get_staff_passport_state", {
    p_session_token: sessionToken,
    p_role: role,
    p_passport_id: passportId
  });

  return {
    ...payload,
    passport: payload.passport ? mapPassport(payload.passport) : null,
    photos: Array.isArray(payload.photos) ? payload.photos.map(mapPhoto) : []
  };
}

export async function issuePassportScanTicket(passportId: string, contactPhone: string) {
  const payload = await rpc<BackendScanTicketPayload>("issue_passport_scan_ticket", {
    p_passport_id: passportId,
    p_contact_phone: contactPhone,
    p_purpose: "staff_bind"
  });

  return payload;
}

export async function resolvePassportScanTicket(sessionToken: string, role: "npc" | "photographer", ticketToken: string) {
  const payload = await rpc<BackendScanTicketPayload>("resolve_passport_scan_ticket", {
    p_session_token: sessionToken,
    p_role: role,
    p_ticket_token: ticketToken
  });

  return payload;
}

export async function awardPassportLevel(sessionToken: string, passportId: string, levelId: string, stars: number) {
  const payload = await rpc<BackendPassportStatePayload>("award_passport_level", {
    p_session_token: sessionToken,
    p_passport_id: passportId,
    p_level_id: levelId,
    p_stars: stars
  });

  return {
    ...payload,
    passport: payload.passport ? mapPassport(payload.passport) : null
  };
}

export async function uploadPassportPhoto(sessionToken: string, passportId: string, photo: LivePhoto) {
  const payload = await rpc<OperationResult>("upload_passport_photo", {
    p_session_token: sessionToken,
    p_passport_id: passportId,
    p_photo: photo
  });

  return payload;
}

export function getBackendErrorMessage(error: unknown, fallback: string) {
  return toErrorMessage(error, fallback);
}
