"use strict";
// Minimal DOM stub smoke test for app.js (no browser needed).
// Run: node tools/smoke_test.js
const fs = require("fs");
const path = require("path");

class ClassList {
  constructor(el) { this.el = el; this.set = new Set(); }
  add(...cs) { cs.forEach((c) => this.set.add(c)); this._sync(); }
  remove(...cs) { cs.forEach((c) => this.set.delete(c)); this._sync(); }
  toggle(c, force) {
    const want = force === undefined ? !this.set.has(c) : force;
    if (want) this.set.add(c); else this.set.delete(c);
    this._sync();
    return want;
  }
  contains(c) { return this.set.has(c); }
  _sync() { this.el._className = [...this.set].join(" "); }
}

class El {
  constructor(tag) {
    this.tagName = tag;
    this.children = [];
    this.listeners = {};
    this._classList = new ClassList(this);
    this._className = "";
    this.textContent = "";
    this._innerHTML = "";
    this.disabled = false;
    this.type = "";
  }
  get classList() { return this._classList; }
  set className(v) { this._className = v; this._classList.set = new Set(String(v).split(/\s+/).filter(Boolean)); }
  get className() { return this._className; }
  set innerHTML(v) { this._innerHTML = v; if (v === "") this.children = []; }
  get innerHTML() { return this._innerHTML; }
  appendChild(c) { this.children.push(c); return c; }
  addEventListener(t, fn) { (this.listeners[t] = this.listeners[t] || []).push(fn); }
  click() { (this.listeners.click || []).forEach((f) => f({ type: "click" })); }
  querySelectorAll(sel) {
    const cls = sel.replace(".", "");
    const out = [];
    const walk = (e) => e.children.forEach((c) => { if (c.classList.contains(cls)) out.push(c); walk(c); });
    walk(this);
    return out;
  }
}

const ids = [
  "home-btn", "view-home", "view-test", "view-flash",
  "btn-test", "btn-master", "btn-flash", "btn-new-test", "btn-new-test-bottom", "btn-home-bottom",
  "test-score", "test-questions",
  "flash-score", "flash-meta", "stat-correct", "stat-wrong",
  "flash-q", "flash-options", "flash-expl", "btn-next",
];
const byId = {};
ids.forEach((id) => (byId[id] = new El("div")));

global.window = {};
global.window.scrollToCalls = [];
global.window.scrollTo = (opts) => global.window.scrollToCalls.push(opts);
global.document = {
  getElementById: (id) => byId[id] || null,
  createElement: (t) => new El(t),
};

const root = path.join(__dirname, "..");
eval(fs.readFileSync(path.join(root, "questions.js"), "utf8"));
global.QUESTIONS = global.window.QUESTIONS;
eval(fs.readFileSync(path.join(root, "app.js"), "utf8"));

let failures = 0;
function assert(cond, msg) {
  if (cond) console.log("PASS:", msg);
  else { failures++; console.error("FAIL:", msg); }
}

assert(byId["view-home"].classList.contains("hidden") === false, "home view visible initially");

byId["btn-test"].click();
assert(!byId["view-test"].classList.contains("hidden"), "test view shown after clicking Test");
assert(byId["test-questions"].children.length === 30, "test renders exactly 30 questions");
assert(byId["test-score"].textContent.includes("0/30"), "score starts at 0/30");

let expectedCorrect = 0;
for (let i = 0; i < 2; i++) {
  const block = byId["test-questions"].children[i];
  const optionsBox = block.children[2];
  const expl = block.children[3];
  const btn = optionsBox.children[0];
  btn.click();
  const wasCorrect = btn.classList.contains("correct");
  if (wasCorrect) expectedCorrect++;
  const correctCount = optionsBox.children.filter((b) => b.classList.contains("correct")).length;
  assert(correctCount === 1, `q${i + 1}: exactly one option marked correct`);
  assert(optionsBox.children.every((b) => b.disabled), `q${i + 1}: all options disabled after answering`);
  assert(!expl.classList.contains("hidden") && expl.innerHTML.includes("Explanation:"), `q${i + 1}: explanation shown`);
}
assert(
  byId["test-score"].textContent === `Answered: 2/30 · Correct: ${expectedCorrect}`,
  "score text matches answered/correct after 2 answers"
);

byId["btn-new-test"].click();
assert(byId["test-questions"].children.length === 30 && byId["test-score"].textContent.includes("0/30"), "top New test regenerates 30 questions and resets score (event arg ignored)");

byId["btn-test"].click();
global.window.scrollToCalls.length = 0;
byId["btn-new-test-bottom"].click();
assert(byId["test-questions"].children.length === 30 && byId["test-score"].textContent.includes("0/30") && !byId["test-score"].textContent.includes("[object"), "bottom New test button regenerates 30 questions (event arg ignored)");
assert(
  global.window.scrollToCalls.length > 0 && global.window.scrollToCalls.every((c) => c.top === 0),
  "New test scrolls the page to the top"
);

byId["btn-master"].click();
assert(byId["test-questions"].children.length === QUESTIONS.length, "master test renders all questions");
assert(byId["test-score"].textContent.includes(`0/${QUESTIONS.length}`), "master test score starts at 0/total");

byId["btn-flash"].click();
assert(!byId["view-flash"].classList.contains("hidden"), "flash view shown");
assert(byId["flash-options"].children.length >= 2, "flashcard renders options");
assert(byId["flash-expl"].classList.contains("hidden"), "flash explanation hidden before answering");

const firstOpt = byId["flash-options"].children[0];
firstOpt.click();
const flashWasCorrect = firstOpt.classList.contains("correct");
assert(!byId["flash-expl"].classList.contains("hidden"), "flash explanation shown after answering");
assert(!byId["btn-next"].classList.contains("hidden"), "Next button shown after answering");
assert(byId["flash-score"].textContent === `Correct: ${flashWasCorrect ? 1 : 0}/1`, "flash score updated");
assert(
  byId["stat-correct"].textContent === `✓ ${flashWasCorrect ? 1 : 0}` &&
    byId["stat-wrong"].textContent === `✗ ${flashWasCorrect ? 0 : 1}`,
  "green/red stat boxes next to question show session right/wrong counts"
);

byId["btn-next"].click();
assert(byId["flash-expl"].classList.contains("hidden"), "explanation hidden again on next card");
assert(byId["flash-options"].children.every((b) => !b.disabled), "options re-enabled on next card");

byId["home-btn"].click();
assert(!byId["view-home"].classList.contains("hidden") && byId["view-flash"].classList.contains("hidden"), "home button returns to home view");

byId["btn-test"].click();
byId["btn-home-bottom"].click();
assert(!byId["view-home"].classList.contains("hidden") && byId["view-test"].classList.contains("hidden"), "bottom Home button returns to mode selection");

if (failures) { console.error(`\n${failures} failure(s)`); process.exit(1); }
console.log("\nAll smoke tests passed.");
