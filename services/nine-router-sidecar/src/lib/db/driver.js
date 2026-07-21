import { createRequire } from "node:module";
import { ensureTenantDirs, getTenantDataFile } from "./paths.js";

const require = createRequire(import.meta.url);
const { getTenantId } = require("../../../tenant-context.cjs");

// Use global to survive Next.js dev hot-reload (module state resets on reload).
if (!global._tenantDbAdapters) global._tenantDbAdapters = new Map();
const states = global._tenantDbAdapters;

function getState(tenantId) {
  if (!states.has(tenantId)) {
    states.set(tenantId, { instance: null, initPromise: null, logged: false });
  }
  return states.get(tenantId);
}

async function tryBunSqlite(dataFile) {
  // Bun runtime only — built-in, no install needed
  if (!process.versions.bun) return null;
  try {
    const { createBunSqliteAdapter } = await import("./adapters/bunSqliteAdapter.js");
    return await createBunSqliteAdapter(dataFile);
  } catch (e) {
    console.warn(`[DB] bun:sqlite unavailable: ${e.message}`);
    return null;
  }
}

async function tryBetterSqlite(dataFile) {
  // Skip on Bun — better-sqlite3 native bindings unsupported
  if (process.versions.bun) return null;
  try {
    const { createBetterSqliteAdapter } = await import("./adapters/betterSqliteAdapter.js");
    return createBetterSqliteAdapter(dataFile);
  } catch (e) {
    console.warn(`[DB] better-sqlite3 unavailable: ${e.message}`);
    return null;
  }
}

async function tryNodeSqlite(dataFile) {
  // Built-in since Node 22.5.0 — no install needed. Skip under Bun (no node:sqlite).
  if (process.versions.bun) return null;
  const [maj, min] = process.versions.node.split(".").map(Number);
  if (maj < 22 || (maj === 22 && min < 5)) return null;
  try {
    const { createNodeSqliteAdapter } = await import("./adapters/nodeSqliteAdapter.js");
    return await createNodeSqliteAdapter(dataFile);
  } catch (e) {
    console.warn(`[DB] node:sqlite unavailable: ${e.message}`);
    return null;
  }
}

async function trySqlJs(dataFile) {
  try {
    const { createSqlJsAdapter } = await import("./adapters/sqljsAdapter.js");
    return await createSqlJsAdapter(dataFile);
  } catch (e) {
    console.warn(`[DB] sql.js unavailable: ${e.message}`);
    return null;
  }
}

async function initAdapter(tenantId, state) {
  ensureTenantDirs(tenantId);
  const dataFile = getTenantDataFile(tenantId);
  // Order per runtime:
  //   Bun:  bun:sqlite → sql.js
  //   Node: better-sqlite3 → node:sqlite (≥22.5) → sql.js
  let adapter = await tryBunSqlite(dataFile);
  if (!adapter) adapter = await tryBetterSqlite(dataFile);
  if (!adapter) adapter = await tryNodeSqlite(dataFile);
  if (!adapter) adapter = await trySqlJs(dataFile);
  if (!adapter) throw new Error("[DB] No SQLite driver available (bun/better/node/sql.js all failed)");

  if (!state.logged) {
    console.log(`[DB] Driver: ${adapter.driver} | tenant: ${tenantId}`);
    state.logged = true;
  }

  const { runMigrationOnce } = await import("./migrate.js");
  await runMigrationOnce(adapter);
  return adapter;
}

export async function getAdapter() {
  const tenantId = getTenantId();
  const state = getState(tenantId);
  if (state.instance) return state.instance;
  if (!state.initPromise) {
    state.initPromise = initAdapter(tenantId, state)
      .then((adapter) => {
        state.instance = adapter;
        return adapter;
      })
      .catch((error) => {
        state.initPromise = null;
        throw error;
      });
  }
  return state.initPromise;
}

export function getAdapterSync() {
  const tenantId = getTenantId();
  const state = getState(tenantId);
  if (!state.instance) throw new Error("[DB] tenant adapter not initialized — await getAdapter() first");
  return state.instance;
}
