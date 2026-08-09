import fs from "fs";
import path from "path";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { HistoryRecord } from "./types";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("America/Toronto");

const HISTORY_FILE = path.resolve(__dirname, "..", "data", "history.json");
const MAX_RECORDS = 30;

function read(): HistoryRecord[] {
  try {
    if (!fs.existsSync(HISTORY_FILE)) return [];
    const raw = fs.readFileSync(HISTORY_FILE, "utf8");
    return JSON.parse(raw) as HistoryRecord[];
  } catch {
    console.error("[history] failed to read history file");
    return [];
  }
}

function write(records: HistoryRecord[]): void {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(records, null, 2), "utf8");
  } catch {
    console.error("[history] failed to write history file");
  }
}

export function append(record: HistoryRecord): void {
  const records = read();

  const existingIndex = records.findIndex((r) => r.date === record.date);
  if (existingIndex !== -1) {
    records[existingIndex] = record;
  } else {
    records.unshift(record);
  }

  while (records.length > MAX_RECORDS) {
    records.pop();
  }

  write(records);
}

export function getLastDays(days = MAX_RECORDS): HistoryRecord[] {
  return read().slice(0, days);
}

export function hasToday(): boolean {
  const today = dayjs().tz("America/Toronto").format("YYYY-MM-DD");
  return read().some((r) => r.date === today);
}

export function getLatest(): HistoryRecord | null {
  const records = read();
  return records.length > 0 ? records[0] : null;
}
