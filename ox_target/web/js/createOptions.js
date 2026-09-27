import { fetchNui } from "./fetchNui.js";

const optionsWrapper = document.getElementById("options-wrapper");

function onClick() {
  this.style.pointerEvents = "none";
  fetchNui("select", [this.targetType, this.targetId, this.zoneId]);
  setTimeout(() => (this.style.pointerEvents = "auto"), 100);
}

export function createOptions(type, data, id, zoneId, skipAnimation) {
  if (typeof zoneId === "boolean") {
    skipAnimation = zoneId;
    zoneId = undefined;
  }

  if (data.hide) return;

  const option = document.createElement("div");
  const iconElement = `<i class="fa-fw ${data.icon} option-icon" ${data.iconColor ? `style = color:${data.iconColor} !important` : null}"></i>`;
  const keybind = document.body.classList.contains("keyboard-mode") ? `<span class="option-keybind">E</span>` : "";

  option.innerHTML = `${keybind}${iconElement}<p class="option-label">${data.label}</p>`;
  option.className = "option-container";
  option.targetType = type;
  option.targetId = id;
  option.zoneId = zoneId;

  if (skipAnimation) {
    option.style.animation = "none";
    option.style.opacity = "1";
  }

  option.addEventListener("click", onClick);
  optionsWrapper.appendChild(option);
}
