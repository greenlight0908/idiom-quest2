/* 사자성어 여행단 - 통합 랭킹 서버 v4 (랭킹 + 전체 생환률) */
const SHEET_NAME = "기록";
const STATS_SHEET_NAME = "통계";
const MIN_SEC = 20;
const MAX_SEC = 3600;
const TOKEN_TTL = 3600;
const NEED_COUNT = 15;

/* ── 조회 (GET) ── */
function doGet(e) {
  if (e && e.parameter && e.parameter.action === "stats") {
    return out_(getSurvivalStats_());
  }

  const sh = getSheet_();
  const rows = sh.getDataRange().getValues().slice(1);
  const list = rows
    .map(r => ({ name: String(r[0]), sec: Number(r[1]), date: String(r[2]) }))
    .filter(r => r.name && r.sec > 0)
    .sort((a, b) => a.sec - b.sec)
    .slice(0, 100);
  return out_(list);
}

/* ── 기록 (POST) ── */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const cache = CacheService.getScriptCache();

    /* 1) 한자성어 나라 도전 → 전체 도전 수 증가 + 토큰 발급 */
    if (data.action === "start") {
      const token = Utilities.getUuid();
      const rec = { t: Date.now(), soln: [] };
      cache.put("t_" + token, JSON.stringify(rec), TOKEN_TTL);
      incrementStat_("attempts");
      return out_({ ok: true, token: token });
    }

    /* 2) 문제 맞힘 → 진행기록 */
    if (data.action === "progress") {
      const token = String(data.token || "");
      const idx = Number(data.idx);
      const raw = cache.get("t_" + token);
      if (!raw) return out_({ ok: false, reason: "no_token" });
      if (!(idx >= 0 && idx < NEED_COUNT)) return out_({ ok: false, reason: "bad_idx" });
      const rec = JSON.parse(raw);
      if (rec.soln.indexOf(idx) === -1) rec.soln.push(idx);
      cache.put("t_" + token, JSON.stringify(rec), TOKEN_TTL);
      return out_({ ok: true, count: rec.soln.length });
    }

    /* 3) 생환 제출 → 검증 후 전체 생환 수 증가 */
    if (data.action === "finish") {
      const token = String(data.token || "");
      const name = String(data.name || "").slice(0, 12).trim();
      if (!name || !token) return out_({ ok: false, reason: "bad_input" });

      const raw = cache.get("t_" + token);
      if (!raw) return out_({ ok: false, reason: "no_token" });
      cache.remove("t_" + token);

      const rec = JSON.parse(raw);
      const solved = rec.soln.length;
      if (solved < NEED_COUNT) return out_({ ok: false, reason: "not_solved", solved: solved });

      const sec = Math.round((Date.now() - Number(rec.t)) / 1000);
      if (!(sec >= MIN_SEC) || sec > MAX_SEC) return out_({ ok: false, reason: "bad_time", sec: sec });

      getSheet_().appendRow([name, sec, new Date()]);
      incrementStat_("survivals");
      return out_({ ok: true, sec: sec });
    }

    return out_({ ok: false, reason: "unknown_action" });
  } catch (err) {
    return out_({ ok: false, reason: "error" });
  }
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(["이름", "시간(초)", "날짜"]);
  }
  return sh;
}

function getStatsSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(STATS_SHEET_NAME);
  if (!sh) {
    const recordCount = Math.max(0, getSheet_().getLastRow() - 1);
    sh = ss.insertSheet(STATS_SHEET_NAME);
    sh.getRange(1, 1, 4, 2).setValues([
      ["항목", "값"],
      ["attempts", recordCount],
      ["survivals", recordCount],
      ["since", new Date()]
    ]);
  }
  return sh;
}

function incrementStat_(key) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = getStatsSheet_();
    const values = sh.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][0]) === key) {
        sh.getRange(i + 1, 2).setValue((Number(values[i][1]) || 0) + 1);
        return;
      }
    }
    sh.appendRow([key, 1]);
  } finally {
    lock.releaseLock();
  }
}

function getSurvivalStats_() {
  const sh = getStatsSheet_();
  const values = sh.getDataRange().getValues().slice(1);
  const stats = {};
  values.forEach(r => stats[String(r[0])] = r[1]);
  const attempts = Math.max(0, Number(stats.attempts) || 0);
  const survivals = Math.max(0, Number(stats.survivals) || 0);
  const rate = attempts ? Math.round(survivals / attempts * 100) : 0;
  return {
    ok: true,
    attempts: attempts,
    survivals: survivals,
    rate: rate,
    since: stats.since ? String(stats.since) : ""
  };
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}

/* 관리용: 비정상 기록 청소 + 시드 재설정 */
function cleanupAndReseed() {
  const sh = getSheet_();
  sh.clear();
  sh.appendRow(["이름", "시간(초)", "날짜"]);
  sh.appendRow(["정규영", 60, new Date()]);
  const stats = getStatsSheet_();
  stats.clear();
  stats.getRange(1, 1, 4, 2).setValues([
    ["항목", "값"],
    ["attempts", 1],
    ["survivals", 1],
    ["since", new Date()]
  ]);
  return "done";
}

function showSheetUrl() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Logger.log(ss.getUrl());
  Logger.log(ss.getName());
  return ss.getUrl();
}
