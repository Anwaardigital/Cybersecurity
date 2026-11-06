// CyberSec Hub Exams — pure logic (no DOM). Used by exam.js in the browser
// and by verify_exams.js in node. No localStorage access here; the caller
// passes a plain state object.
var EXAM_LIB = (function () {
  var KEY = "hubExamsV1";
  var PASS_MCQ = 12; // 12/20 = 60%
  var PASS_TERMINAL = 3; // 3/5 = 60%
  var RETRY_FAIL_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
  var NEXT_PASS_MS = 1 * 24 * 60 * 60 * 1000; // 1 day
  var EXAM_SECONDS = 30 * 60; // 30 minutes

  function blankState() {
    return { version: 1, name: "", certId: null, completedDate: null, exams: {} };
  }
  function blankExam() {
    return { status: "not-started", date: null, attempts: 0, best: 0, bestTotal: 0 };
  }
  function getExamRec(state, id) {
    if (!state.exams) state.exams = {};
    if (!state.exams[String(id)]) state.exams[String(id)] = blankExam();
    return state.exams[String(id)];
  }
  function passNeeded(exam) {
    return exam.type === "terminal" ? PASS_TERMINAL : PASS_MCQ;
  }
  function totalItems(exam) {
    return exam.type === "terminal" ? exam.tasks.length : exam.questions.length;
  }
  // Gating. Returns {ok:true} or {ok:false, reason, availableAt, message}.
  // reason: "locked" (previous exam not passed yet) or "wait" (cool-down).
  function canStart(id, state, nowMs) {
    id = Number(id);
    if (id < 1 || id > 15) return { ok: false, reason: "invalid", message: "Ghalat exam number." };
    var rec = getExamRec(state, id);
    if (rec.status === "passed") return { ok: true, retake: true };
    if (rec.status === "failed" && rec.date) {
      var retryAt = new Date(rec.date).getTime() + RETRY_FAIL_MS;
      if (nowMs < retryAt) {
        return { ok: false, reason: "wait", availableAt: new Date(retryAt).toISOString(),
          message: "Aap is exam me fail hue thay. Dobara koshish " + new Date(retryAt).toDateString() + " ke baad hogi (3 din ka waqfa)." };
      }
      return { ok: true, retake: true };
    }
    if (id === 1) return { ok: true };
    var prev = getExamRec(state, id - 1);
    if (prev.status !== "passed") {
      return { ok: false, reason: "locked",
        message: "Pehle Exam " + (id - 1) + " pass karen — us ke baghair Exam " + id + " nahi khul sakta." };
    }
    var nextAt = new Date(prev.date).getTime() + NEXT_PASS_MS;
    if (nowMs < nextAt) {
      return { ok: false, reason: "wait", availableAt: new Date(nextAt).toISOString(),
        message: "Exam " + (id - 1) + " pass ho gaya hai. Agla exam " + new Date(nextAt).toDateString() + " ke baad khulega (1 din ka waqfa)." };
    }
    return { ok: true };
  }
  // Record a finished attempt. `need` is the pass mark (12 for MCQ/short,
  // 3 for terminal). Callers should pass it; if omitted we try the global
  // EXAMS table (browser) and fall back to the MCQ mark.
  function recordResult(id, score, total, state, nowMs, need) {
    if (need === undefined || need === null) {
      var exam = null;
      try { exam = (typeof EXAMS !== "undefined") ? EXAMS[Number(id) - 1] : null; } catch (e) { exam = null; }
      need = exam ? passNeeded(exam) : PASS_MCQ;
    }
    var passed = score >= need;
    var rec = getExamRec(state, id);
    rec.attempts += 1;
    if (score > rec.best) { rec.best = score; rec.bestTotal = total; }
    rec.date = new Date(nowMs).toISOString();
    if (passed) rec.status = "passed";
    else if (rec.status !== "passed") rec.status = "failed";
    if (passed && allPassed(state)) {
      if (!state.completedDate) state.completedDate = new Date(nowMs).toISOString();
      if (!state.certId) state.certId = "CSH-" + String(100000 + Math.floor(Math.random() * 900000));
    }
    return { rec: rec, passed: passed, need: need };
  }
  function allPassed(state) {
    for (var i = 1; i <= 15; i++) {
      if (getExamRec(state, i).status !== "passed") return false;
    }
    return true;
  }
  function remainingExams(state) {
    var out = [];
    for (var i = 1; i <= 15; i++) {
      if (getExamRec(state, i).status !== "passed") out.push(i);
    }
    return out;
  }
  function passedCount(state) {
    var n = 0;
    for (var i = 1; i <= 15; i++) if (getExamRec(state, i).status === "passed") n++;
    return n;
  }
  // Short-answer normalisation: lower-case, hyphens/underscores -> space,
  // strip punctuation, collapse spaces.
  function norm(s) {
    return String(s || "").toLowerCase().replace(/[-_]/g, " ")
      .replace(/[^a-z0-9\u0600-\u06FF ]/g, " ").replace(/\s+/g, " ").trim();
  }
  function shortCorrect(answer, keywords) {
    var a = norm(answer);
    if (!a) return false;
    for (var i = 0; i < keywords.length; i++) {
      var k = norm(keywords[i]);
      if (k && a.indexOf(k) !== -1) return true;
    }
    return false;
  }
  function scoreShort(answers, exam) {
    var score = 0, detail = [];
    for (var i = 0; i < exam.questions.length; i++) {
      var ok = shortCorrect(answers[i], exam.questions[i].keywords);
      if (ok) score++;
      detail.push({ ok: ok, accepted: exam.questions[i].keywords });
    }
    return { score: score, detail: detail };
  }
  function scoreMcq(answers, exam) {
    var score = 0, detail = [];
    for (var i = 0; i < exam.questions.length; i++) {
      var ok = answers[i] === exam.questions[i].a;
      if (ok) score++;
      detail.push({ ok: ok, correct: exam.questions[i].a });
    }
    return { score: score, detail: detail };
  }
  function fmtDate(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    return d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
  }
  return {
    KEY: KEY, PASS_MCQ: PASS_MCQ, PASS_TERMINAL: PASS_TERMINAL,
    EXAM_SECONDS: EXAM_SECONDS, blankState: blankState, getExamRec: getExamRec,
    passNeeded: passNeeded, totalItems: totalItems, canStart: canStart,
    recordResult: recordResult, allPassed: allPassed, remainingExams: remainingExams,
    passedCount: passedCount, norm: norm, shortCorrect: shortCorrect,
    scoreShort: scoreShort, scoreMcq: scoreMcq, fmtDate: fmtDate
  };
})();
if (typeof module !== "undefined") module.exports = EXAM_LIB;
