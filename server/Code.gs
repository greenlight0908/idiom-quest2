/* 사자성어 여행단 - 랭킹 서버 v6 (한자성어/품사 분리 + 학교·캐릭터 + 중복 제거) */
const SHEET_NAME = "기록";
const STATS_SHEET_NAME = "통계";
const HEADERS = ["이름", "시간(초)", "날짜", "캐릭터", "학교", "랭킹종류", "학생명(기준)"];
const MIN_SEC = 20;
const MAX_SEC = 3600;
const GRAMMAR_MIN_SEC = 10;
const GRAMMAR_MAX_SEC = 1200;
const TOKEN_TTL = 3600;
const NEED_COUNT = 15;
const GRAMMAR_NEED_COUNT = 10;

function doGet(e) {
  if (e && e.parameter && e.parameter.action === "stats") return out_(getSurvivalStats_());
  const type = normalizeType_(e && e.parameter && e.parameter.type);
  const rows = getSheet_().getDataRange().getValues().slice(1);
  const list = rows.map(r => ({
    name: String(r[0] || ""), sec: Number(r[1]), date: String(r[2] || ""),
    avatar: String(r[3] || ""), school: String(r[4] || ""),
    type: inferRowType_(r[5], r[0])
  })).filter(r => r.name && r.sec > 0 && r.type === type);
  const byStudent = {};
  list.forEach(row => {
    const key = studentKey_(row.name);
    if (!byStudent[key] || row.sec < byStudent[key].sec) byStudent[key] = row;
  });
  return out_(Object.keys(byStudent).map(key => byStudent[key]).sort((a, b) => a.sec - b.sec).slice(0, 100));
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const cache = CacheService.getScriptCache();

    if (data.action === "start") {
      const token = Utilities.getUuid();
      cache.put("t_" + token, JSON.stringify({ t: Date.now(), soln: [] }), TOKEN_TTL);
      incrementStat_("attempts");
      return out_({ ok: true, token: token });
    }
    if (data.action === "progress") return recordProgress_(cache, "t_", data.token, data.idx, NEED_COUNT);
    if (data.action === "finish") {
      const result = finishToken_(cache, "t_", data, NEED_COUNT, MIN_SEC, MAX_SEC, "idiom");
      if (result.ok) incrementStat_("survivals");
      return out_(result);
    }

    if (data.action === "grammarStart") {
      const token = Utilities.getUuid();
      cache.put("g_" + token, JSON.stringify({ t: Date.now(), soln: [] }), TOKEN_TTL);
      return out_({ ok: true, token: token });
    }
    if (data.action === "grammarProgress") return recordProgress_(cache, "g_", data.token, data.idx, GRAMMAR_NEED_COUNT);
    if (data.action === "grammarFinish") return out_(finishToken_(cache, "g_", data, GRAMMAR_NEED_COUNT, GRAMMAR_MIN_SEC, GRAMMAR_MAX_SEC, "grammar"));

    return out_({ ok: false, reason: "unknown_action" });
  } catch (err) {
    return out_({ ok: false, reason: "error", message: String(err && err.message || err) });
  }
}

function recordProgress_(cache, prefix, tokenValue, indexValue, needCount) {
  const token = String(tokenValue || ""), idx = Number(indexValue);
  const raw = cache.get(prefix + token);
  if (!raw) return out_({ ok: false, reason: "no_token" });
  if (!(idx >= 0 && idx < needCount)) return out_({ ok: false, reason: "bad_idx" });
  const rec = JSON.parse(raw);
  if (rec.soln.indexOf(idx) === -1) rec.soln.push(idx);
  cache.put(prefix + token, JSON.stringify(rec), TOKEN_TTL);
  return out_({ ok: true, count: rec.soln.length });
}

function finishToken_(cache, prefix, data, needCount, minSec, maxSec, type) {
  const token = String(data.token || "");
  const name = String(data.name || "").slice(0, 40).trim();
  const baseName = String(data.baseName || "").slice(0, 12).trim();
  if (!name || !token || !baseName) return { ok: false, reason: "bad_input" };
  const raw = cache.get(prefix + token);
  if (!raw) return { ok: false, reason: "no_token" };
  cache.remove(prefix + token);
  const rec = JSON.parse(raw), solved = rec.soln.length;
  if (solved < needCount) return { ok: false, reason: "not_solved", solved: solved };
  const sec = Math.round((Date.now() - Number(rec.t)) / 1000);
  if (!(sec >= minSec) || sec > maxSec) return { ok: false, reason: "bad_time", sec: sec };
  const avatar = normalizeAvatar_(data.avatar), school = normalizeSchool_(data.school, avatar);
  const saved = upsertRecord_(name, sec, avatar, school, type, baseName);
  return { ok: true, sec: saved.sec, updated: saved.updated };
}

function upsertRecord_(name, sec, avatar, school, type, baseName) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = getSheet_(), values = sh.getDataRange().getValues();
    const key = studentKey_(baseName);
    for (let i = 1; i < values.length; i++) {
      const rowType = inferRowType_(values[i][5], values[i][0]);
      const rowKey = studentKey_(values[i][6] || values[i][0]);
      if (rowType !== type || rowKey !== key) continue;
      const oldSec = Number(values[i][1]) || Number.MAX_SAFE_INTEGER;
      if (sec < oldSec) {
        sh.getRange(i + 1, 1, 1, HEADERS.length).setValues([[name, sec, new Date(), avatar, school, type, baseName]]);
        return { sec: sec, updated: true };
      }
      return { sec: oldSec, updated: false };
    }
    sh.appendRow([name, sec, new Date(), avatar, school, type, baseName]);
    return { sec: sec, updated: true };
  } finally {
    lock.releaseLock();
  }
}

function normalizeType_(value) { return String(value || "idiom").toLowerCase() === "grammar" ? "grammar" : "idiom"; }
function inferRowType_(storedType, name) {
  if (String(storedType || "").trim()) return normalizeType_(storedType);
  return String(name || "").replace(/\s+/g, "").indexOf("품사를이해한") === 0 ? "grammar" : "idiom";
}
function normalizeAvatar_(value) {
  const v = String(value || "");
  return /^(dongsan|hwasung)-(boy|girl)$/.test(v) ? v : "";
}
function normalizeSchool_(value, avatar) {
  const v = String(value || "");
  if (v === "dongsan" || v === "hwasung") return v;
  return avatar.indexOf("hwasung-") === 0 ? "hwasung" : avatar.indexOf("dongsan-") === 0 ? "dongsan" : "";
}
function studentKey_(value) {
  let text = String(value || "").normalize("NFC").replace(/\s+/g, "");
  text = text.replace(/^(?:집에가려다실패한|귀가에실패한|품사를이해한|고양이|꺼삐딸리마스터|꺼삐딸리|사자성어대장군|대장군)/, "");
  text = text.replace(/^[가-힣]{3}의?제자/, "").replace(/^[·:：-]+/, "");
  const hangul = Array.from(text).filter(ch => /[가-힣]/.test(ch));
  return hangul.length >= 3 ? hangul.slice(-3).join("") : text.toLowerCase();
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  return sh;
}

function getStatsSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(STATS_SHEET_NAME);
  if (!sh) {
    const recordCount = Math.max(0, getSheet_().getLastRow() - 1);
    sh = ss.insertSheet(STATS_SHEET_NAME);
    sh.getRange(1, 1, 4, 2).setValues([["항목", "값"], ["attempts", recordCount], ["survivals", recordCount], ["since", new Date()]]);
  }
  return sh;
}

function incrementStat_(key) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = getStatsSheet_(), values = sh.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][0]) === key) {
        sh.getRange(i + 1, 2).setValue((Number(values[i][1]) || 0) + 1);
        return;
      }
    }
    sh.appendRow([key, 1]);
  } finally { lock.releaseLock(); }
}

function getSurvivalStats_() {
  const values = getStatsSheet_().getDataRange().getValues().slice(1), stats = {};
  values.forEach(r => stats[String(r[0])] = r[1]);
  const attempts = Math.max(0, Number(stats.attempts) || 0), survivals = Math.max(0, Number(stats.survivals) || 0);
  return { ok: true, attempts: attempts, survivals: survivals, rate: attempts ? Math.round(survivals / attempts * 100) : 0, since: stats.since ? String(stats.since) : "" };
}

function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function cleanupAndReseed() {
  const sh = getSheet_();
  sh.clear();sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sh.appendRow(["정규영", 60, new Date(), "dongsan-boy", "dongsan", "idiom", "정규영"]);
  const stats = getStatsSheet_();stats.clear();stats.getRange(1, 1, 4, 2).setValues([["항목", "값"], ["attempts", 1], ["survivals", 1], ["since", new Date()]]);
  return "done";
}

function showSheetUrl() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();Logger.log(ss.getUrl());Logger.log(ss.getName());return ss.getUrl();
}
