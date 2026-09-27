import { createOptions } from "./createOptions.js";

const optionsWrapper = document.getElementById("options-wrapper");
const body = document.body;
const eyeSvg = document.getElementById("eyeSvg");
const eyeDot = document.getElementById("eye-dot");
const targetLine = document.getElementById("target-line");

let state = "hidden";
let closeTimer = null;
let pulseTimer = null;
let inputMode = "mouse";
let selectedIndex = -1;

function cancelTimers() {
  if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
  if (pulseTimer) { clearTimeout(pulseTimer); pulseTimer = null; }
}

function clearAnimClasses() {
  eyeDot.classList.remove("dot-in", "dot-out");
  eyeSvg.classList.remove("star-in", "star-out", "star-pulse");
}

function reflow(el) { void el.offsetWidth; }

function showLine() { targetLine.classList.add("line-visible"); }
function hideLine() { targetLine.classList.remove("line-visible"); }

function animateOptionsOut() {
  const opts = optionsWrapper.querySelectorAll(".option-container");
  if (opts.length === 0) return;
  opts.forEach((opt) => {
    opt.style.animation = "";
    opt.style.opacity = "";
    reflow(opt);
    opt.style.animation = "optionSlideOut 0.2s ease forwards";
  });
}

function updateSelection(index) {
  const opts = optionsWrapper.querySelectorAll(".option-container");
  if (opts.length === 0) { selectedIndex = -1; return; }
  if (index < 0) index = opts.length - 1;
  if (index >= opts.length) index = 0;
  opts.forEach((o) => o.classList.remove("option-selected"));
  selectedIndex = index;
  opts[selectedIndex].classList.add("option-selected");
}

function selectFirstOption() {
  if (inputMode === "keyboard") updateSelection(0);
}

function clearSelection() {
  selectedIndex = -1;
  optionsWrapper.querySelectorAll(".option-container").forEach((o) => o.classList.remove("option-selected"));
}

function confirmSelection() {
  const opts = optionsWrapper.querySelectorAll(".option-container");
  if (selectedIndex >= 0 && selectedIndex < opts.length) opts[selectedIndex].click();
}

function transitionToDot() {
  cancelTimers();
  clearAnimClasses();
  body.style.visibility = "visible";
  optionsWrapper.innerHTML = "";
  hideLine();
  reflow(eyeDot);
  eyeDot.classList.add("dot-in");
  state = "dot";
}

function transitionDotToHidden() {
  cancelTimers();
  clearAnimClasses();
  state = "hidden";
  reflow(eyeDot);
  eyeDot.classList.add("dot-out");
  closeTimer = setTimeout(() => {
    body.style.visibility = "hidden";
    clearAnimClasses();
    optionsWrapper.innerHTML = "";
    closeTimer = null;
  }, 300);
}

function transitionStarToHidden() {
  cancelTimers();
  clearAnimClasses();
  state = "hidden";
  hideLine();
  animateOptionsOut();
  reflow(eyeSvg);
  eyeSvg.classList.add("star-out");
  closeTimer = setTimeout(() => {
    body.style.visibility = "hidden";
    clearAnimClasses();
    optionsWrapper.innerHTML = "";
    closeTimer = null;
  }, 350);
}

function transitionDotToStar() {
  cancelTimers();
  clearAnimClasses();
  reflow(eyeDot);
  reflow(eyeSvg);
  eyeDot.classList.add("dot-out");
  eyeSvg.classList.add("star-in");
  pulseTimer = setTimeout(() => {
    if (state === "star") {
      eyeSvg.classList.remove("star-in");
      reflow(eyeSvg);
      eyeSvg.classList.add("star-pulse");
    }
    pulseTimer = null;
  }, 350);
  state = "star";
}

function transitionStarToDot() {
  cancelTimers();
  clearAnimClasses();
  hideLine();
  animateOptionsOut();
  reflow(eyeSvg);
  reflow(eyeDot);
  eyeSvg.classList.add("star-out");
  eyeDot.classList.add("dot-in");
  closeTimer = setTimeout(() => {
    eyeSvg.classList.remove("star-out");
    optionsWrapper.innerHTML = "";
    closeTimer = null;
  }, 300);
  state = "dot";
}

function rebuildOptions(data) {
  optionsWrapper.innerHTML = "";

  if (data.options) {
    for (const type in data.options)
      data.options[type].forEach((d, id) => createOptions(type, d, id + 1, true));
  }

  if (data.zones) {
    for (let i = 0; i < data.zones.length; i++)
      data.zones[i].forEach((d, id) => createOptions("zones", d, id + 1, i + 1, true));
  }

  if (optionsWrapper.children.length > 0) {
    showLine();
    if (inputMode === "keyboard" && selectedIndex >= 0) {
      const opts = optionsWrapper.querySelectorAll(".option-container");
      if (selectedIndex >= opts.length) selectedIndex = opts.length - 1;
      if (selectedIndex >= 0) opts[selectedIndex].classList.add("option-selected");
    }
  } else {
    hideLine();
  }
}

function buildOptionsAnimated(data) {
  optionsWrapper.innerHTML = "";

  if (data.options) {
    for (const type in data.options)
      data.options[type].forEach((d, id) => createOptions(type, d, id + 1));
  }

  if (data.zones) {
    for (let i = 0; i < data.zones.length; i++)
      data.zones[i].forEach((d, id) => createOptions("zones", d, id + 1, i + 1));
  }

  if (optionsWrapper.children.length > 0) {
    showLine();
    selectFirstOption();
  } else {
    hideLine();
  }
}

window.addEventListener("message", (event) => {
  switch (event.data.event) {
    case "setInputMode":
      inputMode = event.data.mode || "mouse";
      selectedIndex = -1;
      body.classList.toggle("keyboard-mode", inputMode === "keyboard");
      return;

    case "visible":
      if (event.data.state) {
        if (state === "hidden") { selectedIndex = -1; transitionToDot(); }
      } else {
        clearSelection();
        if (state === "dot") transitionDotToHidden();
        else if (state === "star") transitionStarToHidden();
      }
      return;

    case "leftTarget":
      if (state === "star") { clearSelection(); transitionStarToDot(); }
      return;

    case "setTarget":
      if (state === "dot") { transitionDotToStar(); buildOptionsAnimated(event.data); }
      else if (state === "star") rebuildOptions(event.data);
      return;

    case "scrollDown":
      if (state === "star" && inputMode === "keyboard") updateSelection(selectedIndex + 1);
      return;

    case "scrollUp":
      if (state === "star" && inputMode === "keyboard") updateSelection(selectedIndex - 1);
      return;

    case "confirmSelect":
      if (state === "star" && inputMode === "keyboard") confirmSelection();
      return;
  }
});
