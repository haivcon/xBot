import path from "node:path";
import fs from "node:fs";
import { DATA_DIR } from "@/lib/dataDir.js";

export const DB_DIR = path.join(DATA_DIR, "db");
export const DATA_FILE = path.join(DB_DIR, "data.sqlite");
export const BACKUPS_DIR = path.join(DB_DIR, "backups");
export const TENANTS_DIR = path.join(DATA_DIR, "tenants");

function assertTenantId(tenantId) {
  const normalized = String(tenantId || "");
  if (!/^\d{1,24}$/.test(normalized)) throw new Error("Invalid tenant ID");
  return normalized;
}

export function getTenantDbDir(tenantId) {
  return path.join(TENANTS_DIR, assertTenantId(tenantId), "db");
}

export function getTenantDataFile(tenantId) {
  return path.join(getTenantDbDir(tenantId), "data.sqlite");
}

export function getTenantBackupsDir(tenantId) {
  return path.join(getTenantDbDir(tenantId), "backups");
}
export const LEGACY_FILES = {
  main: path.join(DATA_DIR, "db.json"),
  usage: path.join(DATA_DIR, "usage.json"),
  disabled: path.join(DATA_DIR, "disabledModels.json"),
  details: path.join(DATA_DIR, "request-details.json"),
};
export function ensureDirs() {
  for (const dir of [DATA_DIR, DB_DIR, BACKUPS_DIR]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
}

export function ensureTenantDirs(tenantId) {
  const tenantDbDir = getTenantDbDir(tenantId);
  const tenantBackupsDir = getTenantBackupsDir(tenantId);
  for (const dir of [DATA_DIR, TENANTS_DIR, tenantDbDir, tenantBackupsDir]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
}
