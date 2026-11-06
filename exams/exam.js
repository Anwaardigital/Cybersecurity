// CyberSec Hub Exams — browser engine (MCQ / short / simulated terminal).
// Reads EXAMS from questions.js and pure logic from exam-lib.js.
// State lives in localStorage key hubExamsV1. Never touches hubProgressV1.
(function () {
  var EXAM_ID = window.EXAM_ID;
  var exam = EXAMS[EXAM_ID - 1];
  var L = EXAM_LIB;
  var KEY = L.KEY;

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function loadState() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) { var s = JSON.parse(raw); if (s && s.exams) return s; }
    } catch (e) {}
    return L.blankState();
  }
  function saveState(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  }
  var state = loadState();

  // ---------- timer ----------
  var left = L.EXAM_SECONDS, timerId = null, submitted = false;
  function fmt(s) {
    var m = Math.floor(s / 60), ss = s % 60;
    return m + ":" + (ss < 10 ? "0" + ss : ss);
  }
  function startTimer() {
    stopTimer();
    var t = $("timer");
    if (t) { t.textContent = fmt(left); t.classList.remove("warn"); }
    timerId = setInterval(function () {
      left--;
      var el = $("timer");
      if (el) {
        el.textContent = fmt(Math.max(0, left));
        if (left <= 60) el.classList.add("warn");
      }
      if (left <= 0) { submitExam(true); }
    }, 1000);
  }
  function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }

  // ---------- start / gating ----------
  function initStart() {
    var gate = L.canStart(EXAM_ID, state, Date.now());
    var box = $("gateMsg"), btn = $("startBtn");
    var total = L.totalItems(exam);
    var need = L.passNeeded(exam);
    var meta = $("examMeta");
    if (meta) meta.textContent = (exam.type === "terminal" ? total + " tasks" : total + " sawal") + " · 30 minute · Pass ke liye " + need + " zaroori";
    if (!gate.ok) {
      if (box) box.innerHTML = "<p><b>Ye exam abhi band hai.</b></p><p>" + esc(gate.message) + "</p>";
      if (btn) btn.disabled = true;
      return;
    }
    if (gate.retake && box) box.innerHTML = "<p class=\"lock-note\">Aap ye exam pehle pass kar chuke hain — dobara practice ke liye de sakte hain.</p>";
  }

  function show(id) {
    ["screen-start", "screen-exam", "screen-result"].forEach(function (s) {
      var el = $(s); if (el) el.classList.add("hidden");
    });
    var t = $(id); if (t) t.classList.remove("hidden");
    window.scrollTo(0, 0);
  }

  function startExam() {
    var gate = L.canStart(EXAM_ID, state, Date.now());
    if (!gate.ok) { alert(gate.message); return; }
    submitted = false;
    left = L.EXAM_SECONDS;
    show("screen-exam");
    if (exam.type === "terminal") startTerminal(); else renderQuestions();
    startTimer();
  }

  // ---------- MCQ / short ----------
  var answers = [];
  function renderQuestions() {
    answers = [];
    var html = "";
    exam.questions.forEach(function (q, i) {
      answers.push(exam.type === "mcq" ? -1 : "");
      html += '<div class="qcard"><span class="qnum">SAWAL ' + (i + 1) + " / " + exam.questions.length + "</span><h3>" + esc(q.q) + "</h3>";
      if (exam.type === "mcq") {
        q.opts.forEach(function (o, j) {
          html += '<button class="opt" data-q="' + i + '" data-o="' + j + '" onclick="pickOpt(' + i + "," + j + ')">' + esc(o) + "</button>";
        });
      } else {
        html += '<input type="text" class="short-input" id="short-' + i + '" placeholder="Apna jawab yahan likhen" autocomplete="off" oninput="window.countShort()">';
      }
      html += "</div>";
    });
    $("qWrap").innerHTML = html;
  }
  window.pickOpt = function (i, j) {
    answers[i] = j;
    var card = document.querySelectorAll(".qcard")[i];
    if (!card) return;
    card.querySelectorAll(".opt").forEach(function (b) { b.classList.remove("sel"); });
    var btn = card.querySelector('[data-o="' + j + '"]');
    if (btn) btn.classList.add("sel");
    updateProg();
  };
  window.countShort = function () {
    var done = 0;
    exam.questions.forEach(function (q, i) {
      var el = $("short-" + i);
      if (el && el.value.trim() !== "") done++;
    });
    var p = $("prog");
    if (p) p.textContent = "Jawab diye: " + done + "/" + exam.questions.length;
  };
  function updateProg() {
    var done = 0;
    if (exam.type === "mcq") done = answers.filter(function (a) { return a !== -1; }).length;
    else done = answers.filter(function (a) { return String(a).trim() !== ""; }).length;
    var p = $("prog");
    if (p) p.textContent = "Jawab diye: " + done + "/" + exam.questions.length;
  }

  // ---------- simulated terminal ----------
  var FS = exam.fs || {};
  var NMAP = exam.nmap || {};
  var cwd = "/home/student", historyArr = [], histIdx = -1;
  var tasks = [], events = [], examDone = false;
  var HELP_TEXT = "Commands: help, pwd, ls, ls -a, ls -l, cd, cat, grep, find, nmap, whoami, echo, history, hint, clear\nMasalan: pwd | ls | cat notes.txt | grep Failed /var/log/auth.log";
  function normPath(p) {
    var parts = p.split("/"), out = [];
    for (var i = 0; i < parts.length; i++) {
      var s = parts[i];
      if (s === "" || s === ".") continue;
      if (s === "..") { out.pop(); continue; }
      out.push(s);
    }
    return "/" + out.join("/");
  }
  function resolvePath(p) {
    if (!p) return cwd;
    if (p === "~") return "/home/student";
    if (p.indexOf("~/") === 0) return normPath("/home/student/" + p.slice(2));
    if (p.charAt(0) === "/") return normPath(p);
    return normPath(cwd + "/" + p);
  }
  function isDir(p) { return !!(FS[p] && FS[p].type === "dir"); }
  function isFile(p) { return !!(FS[p] && FS[p].type === "file"); }
  function shortPath(p) { return p === "/home/student" ? "~" : p; }
  function baseName(p) { var a = p.split("/"); return a[a.length - 1]; }
  function recordEvent(ev) { events.push(ev); checkTasks(); }
  function checkMatch(check, ev) {
    if (check.type === "pwd") return ev.kind === "pwd";
    if (check.type === "ls") return ev.kind === "ls" && ev.dir === check.dir;
    if (check.type === "cat") return ev.kind === "cat" && ev.file === check.file;
    if (check.type === "grep") return ev.kind === "grep" && ev.word.toLowerCase() === String(check.word).toLowerCase() && ev.file === check.file;
    if (check.type === "grepCount") return ev.kind === "grepCount" && ev.word.toLowerCase() === String(check.word).toLowerCase() && ev.file === check.file;
    if (check.type === "nmap") return ev.kind === "nmap" && ev.target === check.target;
    if (check.type === "find") return ev.kind === "find" && ev.name === check.name;
    return false;
  }
  function checkTasks() {
    for (var i = 0; i < tasks.length; i++) {
      if (tasks[i]) continue;
      var check = exam.tasks[i].check;
      for (var j = 0; j < events.length; j++) {
        if (checkMatch(check, events[j])) { tasks[i] = true; break; }
      }
    }
    renderTasks();
  }
  function doLs(args) {
    var showAll = false, longFmt = false, pathArg = null;
    for (var i = 0; i < args.length; i++) {
      var a = args[i];
      if (a.charAt(0) === "-") {
        if (a.indexOf("a") !== -1) showAll = true;
        if (a.indexOf("l") !== -1) longFmt = true;
      } else if (!pathArg) pathArg = a;
    }
    var target = resolvePath(pathArg);
    if (!isDir(target)) return "ls: " + (pathArg || "") + ": No such directory";
    recordEvent({ kind: "ls", dir: target });
    var kids = FS[target].children.slice();
    if (!showAll) kids = kids.filter(function (k) { return k.charAt(0) !== "."; });
    if (showAll) kids = [".", ".."].concat(kids);
    if (kids.length === 0) return "";
    return kids.map(function (k) {
      var full = target === "/" ? "/" + k : target + "/" + k;
      var isD = (k === "." || k === "..") ? true : isDir(full);
      if (!longFmt) return k;
      var size = isD ? 4096 : (isFile(full) ? FS[full].content.length : 0);
      return (isD ? "drwxr-xr-x" : "-rw-r--r--") + " 2 student student " + size + " " + k;
    }).join("\n");
  }
  function doCd(arg) {
    if (!arg) { cwd = "/home/student"; return ""; }
    var target = resolvePath(arg);
    if (!isDir(target)) return "cd: " + arg + ": No such file or directory";
    cwd = target;
    return "";
  }
  function doCat(arg) {
    if (!arg) return "Usage: cat <file>";
    var target = resolvePath(arg);
    if (isDir(target)) return "cat: " + arg + ": Is a directory";
    if (!isFile(target)) return "cat: " + arg + ": No such file";
    recordEvent({ kind: "cat", file: target });
    return FS[target].content;
  }
  function doGrep(args) {
    var countOnly = false, rest = [];
    for (var i = 0; i < args.length; i++) {
      if (args[i] === "-c") countOnly = true; else rest.push(args[i]);
    }
    if (rest.length < 2) return "Usage: grep [-c] <word> <file>";
    var word = rest[0];
    var target = resolvePath(rest[1]);
    if (!isFile(target)) return "grep: " + rest[1] + ": No such file";
    recordEvent({ kind: countOnly ? "grepCount" : "grep", word: word, file: target });
    var lines = FS[target].content.split("\n").filter(function (l) { return l.indexOf(word) !== -1; });
    if (countOnly) return String(lines.length);
    return lines.length ? lines.join("\n") : "Kuch nahi mila.";
  }
  function doFind(args) {
    var dir = cwd, name = null;
    for (var i = 0; i < args.length; i++) {
      if (args[i] === "-name" && i + 1 < args.length) name = args[i + 1];
      else if (args[i].charAt(0) !== "-" && i === 0) dir = resolvePath(args[i]);
    }
    if (!name) return "Usage: find <dir> -name <file>";
    if (!isDir(dir)) return "find: " + dir + ": No such directory";
    recordEvent({ kind: "find", name: name });
    var found = Object.keys(FS).filter(function (k) {
      return (k === dir || k.indexOf(dir + "/") === 0) && baseName(k) === name;
    });
    return found.length ? found.join("\n") : "Kuch nahi mila.";
  }
  function doNmap(target) {
    if (!target) return "Usage: nmap <target>";
    recordEvent({ kind: "nmap", target: target });
    if (NMAP[target]) return NMAP[target];
    return "Starting Nmap (simulated)...\nHost " + target + " is up\nNo open ports found.\n(simulated result — asli network scan nahi)";
  }
  function getHint() {
    for (var i = 0; i < tasks.length; i++) {
      if (!tasks[i]) return "Task " + (i + 1) + ": " + exam.tasks[i].hint;
    }
    return "Tamam tasks mukammal ho gaye hain!";
  }
  function execCommand(raw) {
    var cmd = raw.trim();
    if (!cmd) return "";
    historyArr.push(cmd);
    histIdx = historyArr.length;
    var parts = cmd.split(/\s+/);
    var base = parts[0];
    var out = "";
    if (base === "help") out = HELP_TEXT;
    else if (base === "pwd") { out = cwd; recordEvent({ kind: "pwd" }); }
    else if (base === "ls") out = doLs(parts.slice(1));
    else if (base === "cd") out = doCd(parts[1]);
    else if (base === "cat") out = doCat(parts[1]);
    else if (base === "grep") out = doGrep(parts.slice(1));
    else if (base === "find") out = doFind(parts.slice(1));
    else if (base === "nmap") out = doNmap(parts[1]);
    else if (base === "whoami") out = "student";
    else if (base === "echo") {
      if (cmd.indexOf(">") !== -1) out = "Redirection is practice terminal me supported nahi hai.";
      else out = parts.slice(1).join(" ");
    }
    else if (base === "history") out = historyArr.join("\n");
    else if (base === "hint") out = getHint();
    else if (base === "clear") return "__CLEAR__";
    else if (base === "sudo") out = "sudo is practice terminal me band hai (simulated environment).";
    else out = "Command nahi mili: " + base + " — 'help' likhen.";
    return out;
  }
  function printHtml(html) {
    var t = $("termOut");
    if (!t) return;
    t.innerHTML += html;
    t.scrollTop = t.scrollHeight;
  }
  function printText(txt) {
    String(txt).split("\n").forEach(function (ln) {
      printHtml('<div class="line">' + esc(ln) + "</div>");
    });
  }
  function updatePrompt() {
    var p = $("promptLabel");
    if (p) p.textContent = "student@hub:" + shortPath(cwd) + "$";
  }
  function renderTasks() {
    var done = 0, html = "";
    for (var i = 0; i < tasks.length; i++) {
      if (tasks[i]) done++;
      html += '<div class="task"><span class="st ' + (tasks[i] ? "ok" : "no") + '">' + (tasks[i] ? "✓" : "○") + "</span> <b>Task " + (i + 1) + ":</b> " + esc(exam.tasks[i].text) + "</div>";
    }
    var tl = $("tasksList");
    if (tl) tl.innerHTML = html;
    var pt = $("progText");
    if (pt) pt.textContent = done + "/" + tasks.length + " mukammal";
  }
  function startTerminal() {
    cwd = "/home/student"; historyArr = []; histIdx = -1; events = []; examDone = false;
    tasks = exam.tasks.map(function () { return false; });
    var to = $("termOut");
    if (to) to.innerHTML = "";
    printHtml('<div class="line sys">CyberSec Hub — Practice Terminal (Simulated)</div>');
    printHtml('<div class="line sys">Ye asli Kali Linux nahi hai — seekhne ke liye banaya gaya naqli terminal hai.</div>');
    printHtml('<div class="line sys">\'help\' likhen taake commands dekhen. Tasks panel me 5 tasks hain.</div>');
    updatePrompt();
    renderTasks();
    var inp = $("termInput");
    if (inp) inp.focus();
  }
  window.runCmd = function () {
    var input = $("termInput");
    if (!input) return;
    var raw = input.value;
    if (!raw.trim()) return;
    printHtml('<div class="line"><span class="prompt">' + esc($("promptLabel").textContent) + "</span> " + esc(raw) + "</div>");
    var out = execCommand(raw);
    if (out === "__CLEAR__") { var t = $("termOut"); if (t) t.innerHTML = ""; }
    else if (out) printText(out);
    updatePrompt();
    renderTasks();
    input.value = "";
    input.focus();
    var to = $("termOut");
    if (to) to.scrollTop = to.scrollHeight;
  };
  window.showHint = function () {
    var box = $("hintBox");
    if (!box) return;
    box.textContent = getHint();
    box.classList.remove("hidden");
  };
  window.resetTerminal = function () {
    startTerminal();
  };

  // ---------- submit / results ----------
  function collectAnswers() {
    if (exam.type === "short") {
      exam.questions.forEach(function (q, i) {
        var el = $("short-" + i);
        answers[i] = el ? el.value : "";
      });
    }
  }
  function submitExam(auto) {
    if (submitted) return;
    submitted = true;
    stopTimer();
    var score, detail, total = L.totalItems(exam);
    if (exam.type === "terminal") {
      score = tasks.filter(function (t) { return t; }).length;
      detail = exam.tasks.map(function (t, i) { return { ok: tasks[i], text: t.text }; });
    } else {
      collectAnswers();
      var r = exam.type === "mcq" ? L.scoreMcq(answers, exam) : L.scoreShort(answers, exam);
      score = r.score; detail = r.detail;
    }
    var res = L.recordResult(EXAM_ID, score, total, state, Date.now(), L.passNeeded(exam));
    saveState(state);
    var need = res.need;
    var passed = res.passed;
    var rt = $("resTitle");
    if (rt) rt.textContent = exam.title + " — Result";
    var rs = $("resScore");
    if (rs) rs.innerHTML = "Score: <b>" + score + "/" + total + "</b> — " +
      '<span class="' + (passed ? "pass" : "fail") + '">' + (passed ? "KAMYAB" : "NAKAM") + "</span>";
    var rm = $("resMsg");
    if (rm) {
      if (auto) rm.textContent = "Waqt khatam ho gaya — exam khud submit ho gaya. ";
      if (passed) {
        rm.textContent += "Mubarak ho! Aap ne exam pass kar liya hai. " +
          (EXAM_ID < 15 ? "Agla exam 1 din ke baad khulega." : "Tamam 15 exams mukammal — aap ka certificate tayar hai!");
      } else {
        rm.textContent += "Afsos, is dafa kamyabi nahi hui — pass ke liye " + need + " zaroori thay. Dobara koshish 3 din ke baad hogi.";
      }
    }
    var rev = "";
    if (exam.type === "terminal") {
      detail.forEach(function (d, i) {
        rev += "<p><b>Task " + (i + 1) + ":</b> " + esc(d.text) + "<br>" +
          (d.ok ? '<span class="ok">✓ Mukammal</span>' : '<span class="bad">✗ Mukammal nahi hua</span>') + "</p>";
      });
      rev += "<p class=\"lock-note\">Incident response ke 5 qadam yaad rakhen: Isolate, Preserve, Reset, Remove, Report.</p>";
    } else if (exam.type === "mcq") {
      detail.forEach(function (d, i) {
        rev += "<p><b>Sawal " + (i + 1) + ":</b> " + esc(exam.questions[i].q) + "<br>" +
          (d.ok ? '<span class="ok">✓ Sahi</span>' : '<span class="bad">✗ Ghalat</span> — Sahi jawab: ' + esc(exam.questions[i].opts[d.correct])) + "</p>";
      });
    } else {
      detail.forEach(function (d, i) {
        rev += "<p><b>Sawal " + (i + 1) + ":</b> " + esc(exam.questions[i].q) + "<br>" +
          (d.ok ? '<span class="ok">✓ Sahi</span>' : '<span class="bad">✗ Ghalat</span> — Qabool jawab me ye alfaz hone chahie thay: ' + esc(d.accepted.join(", "))) + "</p>";
      });
    }
    var rv = $("review");
    if (rv) rv.innerHTML = rev;
    var nextBtn = $("nextExamBtn");
    if (nextBtn) {
      if (passed && EXAM_ID < 15) {
        nextBtn.style.display = "";
        nextBtn.onclick = function () { window.location.href = "exam-" + String(EXAM_ID + 1).padStart(2, "0") + ".html"; };
      } else nextBtn.style.display = "none";
    }
    var certBtn = $("certBtn");
    if (certBtn) certBtn.style.display = (passed && EXAM_ID === 15) ? "" : "none";
    show("screen-result");
  }
  window.submitExam = submitExam;
  window.startExam = startExam;
  window.backToList = function () { stopTimer(); window.location.href = "index.html"; };

  // terminal input: Enter to run, Up/Down for history
  document.addEventListener("DOMContentLoaded", function () {
    initStart();
    var inp = $("termInput");
    if (inp) {
      inp.addEventListener("keydown", function (e) {
        if (e.key === "Enter") window.runCmd();
        else if (e.key === "ArrowUp") {
          e.preventDefault();
          if (historyArr.length) { if (histIdx > 0) histIdx--; inp.value = historyArr[histIdx] || ""; }
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          if (histIdx < historyArr.length - 1) { histIdx++; inp.value = historyArr[histIdx]; }
          else { histIdx = historyArr.length; inp.value = ""; }
        }
      });
    }
  });
  initStart();
})();
