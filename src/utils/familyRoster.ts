import * as XLSX from "xlsx";
import { FAMILY_ROSTER } from "../data/familyRoster";
import { FamilyAccessRecord, FrontDeskCheckInRecord } from "../types";
import { looksLikeMojibake, repairMojibakeText } from "./textEncoding";

export const FAMILY_ROSTER_STORAGE_KEY = "xiaoxiao-chuanren-family-roster-v1";
export const FRONT_DESK_CHECKIN_LOG_STORAGE_KEY = "xiaoxiao-chuanren-front-desk-checkins-v1";
export const MAX_FAMILY_ROSTER_SIZE = 100;
const MAX_CHECKIN_LOGS = 200;

export interface ParseFamilyRosterResult {
  records: FamilyAccessRecord[];
  repairedRecordCount: number;
}

const ID_KEYS = ["id", "编号", "家庭id", "家庭编号", "familyid"];
const FAMILY_LABEL_KEYS = ["familylabel", "家庭名称", "家庭名", "家庭", "团单家庭", "family"];
const CONTACT_NAME_KEYS = ["contactname", "联系人", "家长姓名", "联系人姓名", "parentname"];
const CONTACT_PHONE_KEYS = ["contactphone", "手机号", "联系电话", "电话", "手机", "phone", "mobile"];
const NOTE_KEYS = ["note", "备注", "同行人数", "说明"];

export function normalizePhone(value: string) {
  return value.replace(/\D/g, "").slice(-11);
}

function readJsonStorage<T>(storageKey: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJsonStorage<T>(storageKey: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(value));
}

export function readFamilyRoster() {
  return readJsonStorage<FamilyAccessRecord[]>(FAMILY_ROSTER_STORAGE_KEY, FAMILY_ROSTER);
}

export function writeFamilyRoster(records: FamilyAccessRecord[]) {
  writeJsonStorage(FAMILY_ROSTER_STORAGE_KEY, records);
}

export function readFrontDeskCheckInLogs() {
  return readJsonStorage<FrontDeskCheckInRecord[]>(FRONT_DESK_CHECKIN_LOG_STORAGE_KEY, []);
}

export function appendFrontDeskCheckInLog(record: FrontDeskCheckInRecord) {
  const nextLogs = [record, ...readFrontDeskCheckInLogs()].slice(0, MAX_CHECKIN_LOGS);
  writeJsonStorage(FRONT_DESK_CHECKIN_LOG_STORAGE_KEY, nextLogs);
  return nextLogs;
}

function normalizeHeaderKey(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[_-]/g, "");
}

function findValueByKeys(row: Record<string, unknown>, keys: string[]) {
  for (const [rawKey, rawValue] of Object.entries(row)) {
    const normalizedKey = normalizeHeaderKey(rawKey);
    if (keys.includes(normalizedKey)) {
      return String(rawValue ?? "").trim();
    }
  }

  return "";
}

function createFamilyId(index: number) {
  return `FAM-${String(index + 1).padStart(3, "0")}`;
}

function buildSuspiciousEncodingPreview(records: FamilyAccessRecord[]) {
  const suspiciousRows = records
    .map((record, index) => ({
      index,
      familyLabel: record.familyLabel.trim(),
      contactName: record.contactName.trim()
    }))
    .filter(({ familyLabel, contactName }) => looksLikeMojibake(familyLabel) || looksLikeMojibake(contactName))
    .slice(0, 3);

  if (suspiciousRows.length === 0) {
    return "";
  }

  return suspiciousRows
    .map(({ index, familyLabel, contactName }) => `第 ${index + 2} 行：${familyLabel || "未识别家庭"} / ${contactName || "未识别联系人"}`)
    .join("；");
}

function appendEncodingHint(message: string, records: FamilyAccessRecord[]) {
  const preview = buildSuspiciousEncodingPreview(records);
  if (!preview) {
    return message;
  }

  return `${message} 检测到疑似编码异常样例：${preview}。建议优先将源文件另存为 UTF-8 CSV 后重新导入。`;
}

function normalizeImportedRoster(records: FamilyAccessRecord[]): ParseFamilyRosterResult {
  let repairedRecordCount = 0;
  const normalizedRecords = records.map((record, index) => {
    const familyLabel = repairMojibakeText(record.familyLabel);
    const contactName = repairMojibakeText(record.contactName);
    const note = repairMojibakeText(record.note?.trim() || "");

    if (
      familyLabel !== record.familyLabel.trim() ||
      contactName !== record.contactName.trim() ||
      note !== (record.note?.trim() || "")
    ) {
      repairedRecordCount += 1;
    }

    return {
      id: record.id || createFamilyId(index),
      familyLabel,
      contactName,
      contactPhone: normalizePhone(record.contactPhone),
      note,
      importedAt: record.importedAt || new Date().toISOString()
    };
  });

  if (normalizedRecords.length === 0) {
    throw new Error("导入文件中没有识别到任何家庭记录，请检查表头是否包含家庭名称、联系人、手机号。");
  }

  if (normalizedRecords.length > MAX_FAMILY_ROSTER_SIZE) {
    throw new Error(`单次最多只允许导入 ${MAX_FAMILY_ROSTER_SIZE} 个家庭，请拆分后重新导入。`);
  }

  const invalidRows = normalizedRecords
    .map((record, index) => ({ index, record }))
    .filter(({ record }) => !record.familyLabel || !record.contactName || record.contactPhone.length !== 11);

  if (invalidRows.length > 0) {
    const preview = invalidRows
      .slice(0, 3)
      .map(({ index, record }) => `第 ${index + 2} 行：${record.familyLabel || "未填家庭"} / ${record.contactName || "未填联系人"} / ${record.contactPhone || "手机号无效"}`)
      .join("；");
    throw new Error(`导入失败，存在缺少字段或手机号无效的记录。${preview}`);
  }

  const duplicatePhones = new Map<string, number[]>();
  normalizedRecords.forEach((record, index) => {
    const positions = duplicatePhones.get(record.contactPhone) ?? [];
    positions.push(index + 2);
    duplicatePhones.set(record.contactPhone, positions);
  });

  const duplicatedEntries = Array.from(duplicatePhones.entries()).filter(([, positions]) => positions.length > 1);
  if (duplicatedEntries.length > 0) {
    const preview = duplicatedEntries
      .slice(0, 3)
      .map(([phone, positions]) => `${phone} 出现在第 ${positions.join("、")} 行`)
      .join("；");
    throw new Error(`同一手机号仅允许一个家庭账号，导入文件存在重复手机号：${preview}`);
  }

  return {
    records: normalizedRecords,
    repairedRecordCount
  };
}

export async function parseFamilyRosterFile(file: File) {
  const fileName = file.name.toLowerCase();
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, {
    type: "array",
    raw: false
  });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error("导入文件中没有工作表，请重新选择 Excel 或 CSV 文件。");
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
    raw: false
  });

  if (rows.length === 0) {
    throw new Error(fileName.endsWith(".csv") ? "CSV 文件为空，请检查内容后重试。" : "Excel 文件为空，请检查内容后重试。");
  }

  const importedAt = new Date().toISOString();
  const records = rows
    .map((row, index) => ({
      id: findValueByKeys(row, ID_KEYS) || createFamilyId(index),
      familyLabel: findValueByKeys(row, FAMILY_LABEL_KEYS),
      contactName: findValueByKeys(row, CONTACT_NAME_KEYS),
      contactPhone: findValueByKeys(row, CONTACT_PHONE_KEYS),
      note: findValueByKeys(row, NOTE_KEYS),
      importedAt
    }))
    .filter((record) => record.familyLabel || record.contactName || record.contactPhone);

  try {
    return normalizeImportedRoster(records);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(appendEncodingHint(error.message, records));
    }

    throw error;
  }
}

export function importFamilyRoster(records: FamilyAccessRecord[]) {
  const normalizedResult = normalizeImportedRoster(records);
  writeFamilyRoster(normalizedResult.records);
  return normalizedResult.records;
}

function escapeCsvCell(value: string) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export function downloadFamilyRosterTemplateCsv() {
  if (typeof window === "undefined") return;

  const rows = [
    ["家庭名称", "联系人", "手机号", "备注"],
    ["李女士家庭", "李女士", "13800010001", "验收测试家庭"],
    ["王先生家庭", "王先生", "13800010002", "正式团名单示例"]
  ];

  const csvContent = rows
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
    .join("\r\n");

  // Prefix UTF-8 BOM so Excel opens Chinese text with the correct encoding.
  const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = window.document.createElement("a");

  link.href = url;
  link.download = "family-roster-template-utf8.csv";
  window.document.body.appendChild(link);
  link.click();
  window.document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export function downloadFamilyRosterTemplateXlsx() {
  const rows = [
    ["家庭名称", "联系人", "手机号", "备注"],
    ["李女士家庭", "李女士", "13800010001", "验收测试家庭"],
    ["王先生家庭", "王先生", "13800010002", "正式团名单示例"]
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "家庭名单模板");
  XLSX.writeFile(workbook, "family-roster-template.xlsx");
}
