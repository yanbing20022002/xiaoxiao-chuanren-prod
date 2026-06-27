import { getBackendErrorMessage, loginStaff, logoutStaff, validateStaffSession } from "./backend";

export type StaffRole = "npc" | "photographer";

export interface StaffSession {
  role: StaffRole;
  operatorName: string;
  grantedAt: string;
  expiresAt: number;
  sessionToken: string;
}

const STAFF_SESSION_STORAGE_KEY = "xiaoxiao-chuanren-staff-session-v1";
export const STAFF_SESSION_CHANGE_EVENT = "xiaoxiao-chuanren:staff-session-change";

function notifyStaffSessionChanged(role: StaffRole) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(STAFF_SESSION_CHANGE_EVENT, { detail: { role } }));
}

function readAllStaffSessions() {
  if (typeof window === "undefined") return {};

  try {
    return JSON.parse(window.localStorage.getItem(STAFF_SESSION_STORAGE_KEY) ?? "{}") as Partial<Record<StaffRole, StaffSession>>;
  } catch {
    return {};
  }
}

function writeAllStaffSessions(sessions: Partial<Record<StaffRole, StaffSession>>) {
  window.localStorage.setItem(STAFF_SESSION_STORAGE_KEY, JSON.stringify(sessions));
}

export function readStaffSession(role: StaffRole) {
  const sessions = readAllStaffSessions();
  const session = sessions[role] ?? null;
  if (!session) return null;

  if (session.expiresAt <= Date.now()) {
    delete sessions[role];
    writeAllStaffSessions(sessions);
    return null;
  }

  return session;
}

export function writeStaffSession(role: StaffRole, session: StaffSession) {
  const sessions = readAllStaffSessions();
  sessions[role] = session;
  writeAllStaffSessions(sessions);
  notifyStaffSessionChanged(role);
}

export function clearStaffSession(role: StaffRole) {
  const sessions = readAllStaffSessions();
  delete sessions[role];
  writeAllStaffSessions(sessions);
  notifyStaffSessionChanged(role);
}

export async function createStaffSession(role: StaffRole, pin: string, operatorName: string) {
  try {
    const payload = await loginStaff(role, pin, operatorName);
    if (!payload.ok || !payload.session_token || !payload.expires_at) {
      return {
        ok: false,
        message: payload.message || "工作人员登录失败，请稍后重试。",
        session: null as StaffSession | null
      };
    }

    const session: StaffSession = {
      role,
      operatorName: payload.operator_name || operatorName.trim() || `${role.toUpperCase()}工作人员`,
      grantedAt: payload.granted_at || new Date().toISOString(),
      expiresAt: payload.expires_at,
      sessionToken: payload.session_token
    };

    writeStaffSession(role, session);
    return {
      ok: true,
      message: `${session.operatorName} 已通过后端鉴权。`,
      session
    };
  } catch (error) {
    return {
      ok: false,
      message: getBackendErrorMessage(error, "工作人员登录失败，请检查 Supabase 连接。"),
      session: null as StaffSession | null
    };
  }
}

export async function validateStoredStaffSession(role: StaffRole) {
  const session = readStaffSession(role);
  if (!session) return null;

  try {
    const payload = await validateStaffSession(session.sessionToken, role);
    if (!payload.ok || !payload.expires_at) {
      clearStaffSession(role);
      return null;
    }

    const nextSession: StaffSession = {
      ...session,
      operatorName: payload.operator_name || session.operatorName,
      expiresAt: payload.expires_at
    };
    writeStaffSession(role, nextSession);
    return nextSession;
  } catch {
    clearStaffSession(role);
    return null;
  }
}

export async function revokeStaffSession(role: StaffRole) {
  const session = readStaffSession(role);
  if (session?.sessionToken) {
    try {
      await logoutStaff(session.sessionToken);
    } catch {
      // Ignore backend logout failures and clear the local session regardless.
    }
  }
  clearStaffSession(role);
}
