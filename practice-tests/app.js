"use strict";

const TEST_SIZE = 20;
const LETTERS = ["a", "b", "c", "d", "e"];

const els = {
  homeBtn: document.getElementById("home-btn"),
  views: {
    home: document.getElementById("view-home"),
    test: document.getElementById("view-test"),
    flash: document.getElementById("view-flash"),
  },
  btnTest: document.getElementById("btn-test"),
  btnFlash: document.getElementById("btn-flash"),
  btnNewTest: document.getElementById("btn-new-test"),
  testScore: document.getElementById("test-score"),
  testQuestions: document.getElementById("test-questions"),
  flashScore: document.getElementById("flash-score"),
  flashMeta: document.getElementById("flash-meta"),
  flashQ: document.getElementById("flash-q"),
  flashOptions: document.getElementById("flash-options"),
  flashExpl: document.getElementById("flash-expl"),
  btnNext: document.getElementById("btn-next"),
};

const state = {
  testAnswered: 0,
  testCorrect: 0,
  flashCorrect: 0,
  flashTotal: 0,
  lastFlashIndex: -1,
};

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function sampleQuestions(n) {
  return shuffle([...QUESTIONS]).slice(0, n);
}

function shuffledOptions(q) {
  const order = shuffle(q.options.map((_, i) => i));
  return {
    options: order.map((i) => q.options[i]),
    answer: order.indexOf(q.answer),
  };
}

function md(text) {
  const esc = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return esc
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function showView(name) {
  for (const [key, el] of Object.entries(els.views)) {
    el.classList.toggle("hidden", key !== name);
  }
  els.homeBtn.classList.toggle("hidden", name === "home");
}

function buildQuestionBlock(q, index, onAnswered) {
  const { options, answer } = shuffledOptions(q);

  const block = document.createElement("div");
  block.className = "question";

  const meta = document.createElement("div");
  meta.className = "q-meta";
  meta.textContent = `Question ${index + 1}/${TEST_SIZE} · ${q.number} · ${q.section}`;
  block.appendChild(meta);

  const qText = document.createElement("h2");
  qText.className = "q-text";
  qText.innerHTML = md(q.q);
  block.appendChild(qText);

  const optionsBox = document.createElement("div");
  optionsBox.className = "options";
  block.appendChild(optionsBox);

  const expl = document.createElement("div");
  expl.className = "explanation hidden";
  block.appendChild(expl);

  const buttons = options.map((text, i) => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.type = "button";
    const letter = document.createElement("span");
    letter.className = "letter";
    letter.textContent = LETTERS[i] + ".";
    const span = document.createElement("span");
    span.innerHTML = md(text);
    btn.appendChild(letter);
    btn.appendChild(span);
    btn.addEventListener("click", () => {
      buttons.forEach((b) => (b.disabled = true));
      const correct = i === answer;
      btn.classList.add(correct ? "correct" : "wrong");
      buttons[answer].classList.add("correct");
      expl.innerHTML = `<span class="expl-label">Explanation:</span> ${md(q.explanation)}`;
      expl.classList.remove("hidden");
      onAnswered(correct);
    });
    optionsBox.appendChild(btn);
    return btn;
  });

  return block;
}

function startTest() {
  state.testAnswered = 0;
  state.testCorrect = 0;
  els.testQuestions.innerHTML = "";
  updateTestScore();
  sampleQuestions(TEST_SIZE).forEach((q, i) => {
    els.testQuestions.appendChild(
      buildQuestionBlock(q, i, (correct) => {
        state.testAnswered++;
        if (correct) state.testCorrect++;
        updateTestScore();
      })
    );
  });
  showView("test");
}

function updateTestScore() {
  els.testScore.textContent =
    `Answered: ${state.testAnswered}/${TEST_SIZE} · Correct: ${state.testCorrect}`;
}

function nextFlashcard() {
  let idx;
  do {
    idx = Math.floor(Math.random() * QUESTIONS.length);
  } while (QUESTIONS.length > 1 && idx === state.lastFlashIndex);
  state.lastFlashIndex = idx;
  const q = QUESTIONS[idx];
  const { options, answer } = shuffledOptions(q);

  els.flashMeta.textContent = `${q.number} · ${q.section}`;
  els.flashQ.innerHTML = md(q.q);
  els.flashOptions.innerHTML = "";
  els.flashExpl.classList.add("hidden");
  els.btnNext.classList.add("hidden");

  options.forEach((text, i) => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.type = "button";
    const letter = document.createElement("span");
    letter.className = "letter";
    letter.textContent = LETTERS[i] + ".";
    const span = document.createElement("span");
    span.innerHTML = md(text);
    btn.appendChild(letter);
    btn.appendChild(span);
    btn.addEventListener("click", () => {
      const buttons = [...els.flashOptions.querySelectorAll(".option")];
      buttons.forEach((b) => (b.disabled = true));
      const correct = i === answer;
      btn.classList.add(correct ? "correct" : "wrong");
      buttons[answer].classList.add("correct");
      els.flashExpl.innerHTML =
        `<span class="expl-label">Explanation:</span> ${md(q.explanation)}`;
      els.flashExpl.classList.remove("hidden");
      els.btnNext.classList.remove("hidden");
      state.flashTotal++;
      if (correct) state.flashCorrect++;
      els.flashScore.textContent = `Correct: ${state.flashCorrect}/${state.flashTotal}`;
    });
    els.flashOptions.appendChild(btn);
  });
}

function startFlash() {
  state.flashCorrect = 0;
  state.flashTotal = 0;
  state.lastFlashIndex = -1;
  els.flashScore.textContent = "Correct: 0/0";
  nextFlashcard();
  showView("flash");
}

els.btnTest.addEventListener("click", startTest);
els.btnFlash.addEventListener("click", startFlash);
els.btnNewTest.addEventListener("click", startTest);
els.btnNext.addEventListener("click", nextFlashcard);
els.homeBtn.addEventListener("click", () => showView("home"));
