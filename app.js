const pet = document.querySelector("#pet");
const bubble = document.querySelector("#bubble");
const menu = document.querySelector("#pet-menu");
const toggleChaseButton = document.querySelector("#toggle-chase");
const startChaseButton = document.querySelector("#start-chase");
const sleepNowButton = document.querySelector("#sleep-now");

const isTauriRuntime = "__TAURI_INTERNALS__" in window || "__TAURI__" in window;
const isDesktopPet = isTauriRuntime || window.location.port === "1420";

if (isDesktopPet) {
  document.documentElement.classList.add("tauri");
} else {
  document.documentElement.classList.add("browser-preview");
}

const phrases = ["Meow", "Mrrp", "Purr"];
const chasePhrases = ["Gotcha!", "Zoom!", "Mine!"];
const caughtPhrases = ["Caught!", "Okay, okay"];
const chaseDelayMin = 30 * 60 * 1000;
const chaseDelayMax = 60 * 60 * 1000;
const idleWanderDelayMin = 2 * 60 * 1000;
const idleWanderDelayMax = 5 * 60 * 1000;
const idleWanderDistanceMin = 30;
const idleWanderDistanceMax = 70;
const sleepDelayMin = 10 * 60 * 1000;
const sleepDelayMax = 20 * 60 * 1000;
const desktopChaseSpeed = (30 / 42) * 1000;
const previewChaseSpeed = (30 / 42) * 1000;
const chaseMaxFrameMs = 50;
const chaseRestEnterDistance = 20;
const chaseRestExitDistance = 44;
const chaseRestSettleMs = 180;
const storageKey = "pixelnest.randomChaseEnabled";

const state = {
  pointerId: null,
  startX: 0,
  startY: 0,
  offsetX: 0,
  offsetY: 0,
  moved: false,
  speechTimer: 0,
  chaseEnabled: localStorage.getItem(storageKey) === "true",
  chaseTimer: 0,
  chaseLoop: 0,
  chaseResting: false,
  chaseRestStartedAt: 0,
  idleWanderTimer: 0,
  sleepTimer: 0,
  behavior: "idle",
  lastMouse: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
  windowPosition: null,
};

let tauriWindowPromise = null;
let tauriPhysicalPosition = null;
let tauriCursorPosition = null;

function getTauriWindow() {
  if (!isTauriRuntime) {
    return Promise.resolve(null);
  }

  tauriWindowPromise ??= import("@tauri-apps/api/window")
    .then((module) => {
      tauriPhysicalPosition = module.PhysicalPosition;
      tauriCursorPosition = module.cursorPosition;
      return module.getCurrentWindow();
    })
    .catch(() => null);

  return tauriWindowPromise;
}

function placePetFromComputedPosition() {
  const rect = pet.getBoundingClientRect();
  pet.style.left = `${rect.left}px`;
  pet.style.top = `${rect.top}px`;
  pet.style.bottom = "auto";
}

function clampPagePosition(left, top) {
  const maxLeft = window.innerWidth - pet.offsetWidth;
  const maxTop = window.innerHeight - pet.offsetHeight;

  return {
    left: Math.min(Math.max(0, left), Math.max(0, maxLeft)),
    top: Math.min(Math.max(0, top), Math.max(0, maxTop)),
  };
}

function setPetFacing(deltaX) {
  if (Math.abs(deltaX) < 1) {
    return;
  }

  pet.classList.toggle("facing-left", deltaX < 0);
  pet.classList.toggle("facing-right", deltaX >= 0);
}

function setBehavior(nextBehavior) {
  state.behavior = nextBehavior;
  if (nextBehavior !== "chase") {
    setChaseResting(false);
  }
  pet.classList.toggle("walking", nextBehavior === "walking");
  pet.classList.toggle("chasing", nextBehavior === "chase");
  pet.classList.toggle("caught", nextBehavior === "caught");
  pet.classList.toggle("sleeping", nextBehavior === "sleeping");
}

function setChaseResting(isResting) {
  state.chaseResting = isResting;
  if (!isResting) {
    state.chaseRestStartedAt = 0;
  }
  pet.classList.toggle("chase-resting", isResting);
}

function say(text) {
  bubble.textContent = text;

  window.clearTimeout(state.speechTimer);
  pet.classList.remove("speaking");

  window.requestAnimationFrame(() => {
    pet.classList.add("speaking");
    state.speechTimer = window.setTimeout(() => {
      pet.classList.remove("speaking");
    }, 1050);
  });
}

function sayRandom(list = phrases) {
  say(list[Math.floor(Math.random() * list.length)]);
}

function hideMenu() {
  menu.hidden = true;
}

function showMenu(event) {
  event.preventDefault();

  const menuWidth = 168;
  const menuHeight = 126;
  const left = Math.min(event.clientX, window.innerWidth - menuWidth - 8);
  const top = Math.min(event.clientY, window.innerHeight - menuHeight - 8);

  menu.style.left = `${Math.max(8, left)}px`;
  menu.style.top = `${Math.max(8, top)}px`;
  menu.hidden = false;
}

function syncMenu() {
  toggleChaseButton.setAttribute("aria-checked", String(state.chaseEnabled));
  toggleChaseButton.classList.toggle("checked", state.chaseEnabled);
}

function randomChaseDelay() {
  return chaseDelayMin + Math.random() * (chaseDelayMax - chaseDelayMin);
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function randomIdleWanderDelay() {
  return randomRange(idleWanderDelayMin, idleWanderDelayMax);
}

function randomSleepDelay() {
  return randomRange(sleepDelayMin, sleepDelayMax);
}

function scheduleRandomChase() {
  window.clearTimeout(state.chaseTimer);

  if (!state.chaseEnabled) {
    return;
  }

  state.chaseTimer = window.setTimeout(() => {
    startChase();
  }, randomChaseDelay());
}

function scheduleIdleWander() {
  window.clearTimeout(state.idleWanderTimer);

  if (state.behavior === "sleeping") {
    return;
  }

  state.idleWanderTimer = window.setTimeout(() => {
    wanderIdle();
  }, randomIdleWanderDelay());
}

function scheduleSleep() {
  window.clearTimeout(state.sleepTimer);

  if (state.behavior !== "idle") {
    return;
  }

  state.sleepTimer = window.setTimeout(() => {
    enterSleep();
  }, randomSleepDelay());
}

function wakeUp(options = {}) {
  if (state.behavior !== "sleeping") {
    return false;
  }

  setBehavior("idle");

  if (options.speak) {
    say("Mrrp");
  }

  scheduleIdleWander();
  scheduleRandomChase();
  scheduleSleep();
  return true;
}

function enterSleep() {
  if (state.behavior === "chase") {
    stopChase(false);
  }

  if (state.pointerId !== null || !menu.hidden) {
    scheduleSleep();
    return;
  }

  window.clearTimeout(state.idleWanderTimer);
  window.clearTimeout(state.chaseTimer);
  setBehavior("sleeping");
  say("Zzz");
}

function setChaseEnabled(enabled) {
  state.chaseEnabled = enabled;
  localStorage.setItem(storageKey, String(enabled));
  syncMenu();

  if (enabled) {
    scheduleRandomChase();
    say("Hunt mode");
  } else {
    stopChase(false);
    say("Chase off");
  }
}

async function getDesktopWindowPosition(windowHandle) {
  if (state.windowPosition) {
    return state.windowPosition;
  }

  const position = await windowHandle.outerPosition();
  state.windowPosition = { x: position.x, y: position.y };
  return state.windowPosition;
}

async function moveDesktopWindowTo(windowHandle, x, y) {
  state.windowPosition = { x, y };
  await windowHandle.setPosition(new tauriPhysicalPosition(Math.round(x), Math.round(y)));
}

function movePagePetTo(left, top) {
  const next = clampPagePosition(left, top);
  pet.style.left = `${next.left}px`;
  pet.style.top = `${next.top}px`;
  return next;
}

function getCatchAnchor() {
  const rect = pet.getBoundingClientRect();

  return {
    x: rect.left + rect.width * 0.53,
    y: rect.top + rect.height * 0.6,
  };
}

async function readCursorPosition(windowHandle) {
  if (windowHandle && tauriCursorPosition) {
    return tauriCursorPosition();
  }

  return state.lastMouse;
}

async function getDesktopCatchAnchor(windowHandle) {
  const anchor = getCatchAnchor();
  const scaleFactor = await windowHandle.scaleFactor();

  return {
    x: anchor.x * scaleFactor,
    y: anchor.y * scaleFactor,
  };
}

async function wanderIdle() {
  if (state.behavior !== "idle" || state.pointerId !== null || !menu.hidden) {
    scheduleIdleWander();
    scheduleSleep();
    return;
  }

  window.clearTimeout(state.sleepTimer);
  setBehavior("walking");

  const direction = Math.random() > 0.5 ? 1 : -1;
  const distanceX = randomRange(idleWanderDistanceMin, idleWanderDistanceMax) * direction;
  const distanceY = randomRange(-14, 14);
  const duration = randomRange(850, 1250);
  const startedAt = performance.now();
  setPetFacing(distanceX);

  const windowHandle = await getTauriWindow();

  if (windowHandle && tauriPhysicalPosition) {
    const scaleFactor = await windowHandle.scaleFactor();
    const start = await getDesktopWindowPosition(windowHandle);
    const target = {
      x: start.x + distanceX * scaleFactor,
      y: start.y + distanceY * scaleFactor,
    };

    function step(now) {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      moveDesktopWindowTo(
        windowHandle,
        start.x + (target.x - start.x) * eased,
        start.y + (target.y - start.y) * eased,
      );

      if (progress < 1 && state.behavior === "walking") {
        window.requestAnimationFrame(step);
        return;
      }

      if (state.behavior === "walking") {
        setBehavior("idle");
        scheduleIdleWander();
        scheduleSleep();
      }
    }

    window.requestAnimationFrame(step);
    return;
  }

  placePetFromComputedPosition();
  const rect = pet.getBoundingClientRect();
  const target = clampPagePosition(rect.left + distanceX, rect.top + distanceY);

  function step(now) {
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    movePagePetTo(rect.left + (target.left - rect.left) * eased, rect.top + (target.top - rect.top) * eased);

    if (progress < 1 && state.behavior === "walking") {
      window.requestAnimationFrame(step);
      return;
    }

    if (state.behavior === "walking") {
      setBehavior("idle");
      scheduleIdleWander();
      scheduleSleep();
    }
  }

  window.requestAnimationFrame(step);
}

async function startChase() {
  if (state.behavior === "chase") {
    return;
  }

  wakeUp();
  hideMenu();
  setBehavior("chase");
  setChaseResting(false);
  sayRandom(chasePhrases);
  window.clearTimeout(state.chaseTimer);
  window.clearTimeout(state.idleWanderTimer);
  window.clearTimeout(state.sleepTimer);

  const windowHandle = await getTauriWindow();
  let lastFrameAt = performance.now();

  async function chaseFrame(now) {
    if (state.behavior !== "chase") {
      return;
    }

    if (state.pointerId !== null) {
      lastFrameAt = now;
      state.chaseLoop = window.requestAnimationFrame(chaseFrame);
      return;
    }

    const deltaMs = Math.min(chaseMaxFrameMs, Math.max(0, now - lastFrameAt));
    lastFrameAt = now;
    const cursor = await readCursorPosition(windowHandle);

    if (state.behavior !== "chase") {
      return;
    }

    if (windowHandle && tauriPhysicalPosition) {
      const current = await getDesktopWindowPosition(windowHandle);
      const anchor = await getDesktopCatchAnchor(windowHandle);
      const scaleFactor = await windowHandle.scaleFactor();
      const target = {
        x: cursor.x - anchor.x,
        y: cursor.y - anchor.y,
      };
      const deltaX = target.x - current.x;
      const deltaY = target.y - current.y;
      const distance = Math.hypot(deltaX, deltaY);
      const step = Math.min((desktopChaseSpeed * deltaMs) / 1000, distance);
      const enterDistance = chaseRestEnterDistance * scaleFactor;
      const exitDistance = chaseRestExitDistance * scaleFactor;

      if (state.behavior !== "chase") {
        return;
      }

      if (distance <= enterDistance) {
        state.chaseRestStartedAt ||= now;
        if (now - state.chaseRestStartedAt >= chaseRestSettleMs) {
          setChaseResting(true);
        }
        state.chaseLoop = window.requestAnimationFrame(chaseFrame);
        return;
      }

      if (state.chaseResting && distance < exitDistance) {
        state.chaseLoop = window.requestAnimationFrame(chaseFrame);
        return;
      }

      setChaseResting(false);
      setPetFacing(deltaX);
      await moveDesktopWindowTo(
        windowHandle,
        current.x + (deltaX / distance) * step,
        current.y + (deltaY / distance) * step,
      );
      if (state.behavior !== "chase") {
        return;
      }
      state.chaseLoop = window.requestAnimationFrame(chaseFrame);
      return;
    }

    placePetFromComputedPosition();
    const rect = pet.getBoundingClientRect();
    const anchor = getCatchAnchor();
    const target = {
      x: rect.left + cursor.x - anchor.x,
      y: rect.top + cursor.y - anchor.y,
    };
    const deltaX = target.x - rect.left;
    const deltaY = target.y - rect.top;
    const distance = Math.hypot(deltaX, deltaY);
    const step = Math.min((previewChaseSpeed * deltaMs) / 1000, distance);

    if (distance <= chaseRestEnterDistance) {
      state.chaseRestStartedAt ||= now;
      if (now - state.chaseRestStartedAt >= chaseRestSettleMs) {
        setChaseResting(true);
      }
      state.chaseLoop = window.requestAnimationFrame(chaseFrame);
      return;
    }

    if (state.chaseResting && distance < chaseRestExitDistance) {
      state.chaseLoop = window.requestAnimationFrame(chaseFrame);
      return;
    }

    setChaseResting(false);
    setPetFacing(deltaX);
    movePagePetTo(rect.left + (deltaX / distance) * step, rect.top + (deltaY / distance) * step);
    state.chaseLoop = window.requestAnimationFrame(chaseFrame);
  }

  state.chaseLoop = window.requestAnimationFrame(chaseFrame);
}

function stopChase(wasCaught) {
  if (state.behavior !== "chase" && !state.chaseLoop) {
    return;
  }

  window.cancelAnimationFrame(state.chaseLoop);
  state.chaseLoop = 0;
  setBehavior(wasCaught ? "caught" : "idle");

  if (wasCaught) {
    sayRandom(caughtPhrases);
    window.setTimeout(() => {
      setBehavior("idle");
      scheduleIdleWander();
    }, 900);
  }

  scheduleRandomChase();
  if (!wasCaught) {
    scheduleIdleWander();
    scheduleSleep();
  }
}

function beginDrag(event) {
  if (event.button !== undefined && event.button !== 0) {
    return;
  }

  hideMenu();
  wakeUp();

  if (state.behavior === "chase") {
    stopChase(true);
  } else {
    window.clearTimeout(state.idleWanderTimer);
    window.clearTimeout(state.sleepTimer);
    if (state.behavior === "walking") {
      setBehavior("idle");
    }
  }

  const rect = pet.getBoundingClientRect();
  state.pointerId = event.pointerId;
  state.startX = event.clientX;
  state.startY = event.clientY;
  state.offsetX = event.clientX - rect.left;
  state.offsetY = event.clientY - rect.top;
  state.moved = false;

  pet.classList.add("dragging");
  pet.setPointerCapture(event.pointerId);

  if (isDesktopPet) {
    getTauriWindow().then((windowHandle) => {
      if (windowHandle) {
        state.windowPosition = null;
        windowHandle.startDragging();
        return;
      }

      placePetFromComputedPosition();
    });
    return;
  }

  placePetFromComputedPosition();
}

function updateDrag(event) {
  if (event.pointerId !== state.pointerId) {
    return;
  }

  const distance = Math.hypot(event.clientX - state.startX, event.clientY - state.startY);

  if (distance > 3) {
    state.moved = true;
  }

  if (isDesktopPet) {
    return;
  }

  movePagePetTo(event.clientX - state.offsetX, event.clientY - state.offsetY);
}

function endDrag(event) {
  if (event.pointerId !== state.pointerId) {
    return;
  }

  pet.classList.remove("dragging");
  pet.releasePointerCapture(event.pointerId);
  state.pointerId = null;
  state.windowPosition = null;

  if (!state.moved) {
    sayRandom();
  }

  scheduleIdleWander();
  scheduleSleep();
}

function keepPetOnScreen() {
  if (isDesktopPet) {
    return;
  }

  placePetFromComputedPosition();
  movePagePetTo(Number.parseFloat(pet.style.left), Number.parseFloat(pet.style.top));
}

pet.addEventListener("pointerdown", beginDrag);
pet.addEventListener("pointermove", updateDrag);
pet.addEventListener("pointerup", endDrag);
pet.addEventListener("pointercancel", endDrag);
pet.addEventListener("contextmenu", showMenu);

pet.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    sayRandom();
  }
});

toggleChaseButton.addEventListener("click", () => {
  setChaseEnabled(!state.chaseEnabled);
  hideMenu();
});

startChaseButton.addEventListener("click", () => {
  hideMenu();
  startChase();
});

sleepNowButton.addEventListener("click", () => {
  hideMenu();
  enterSleep();
});

window.addEventListener("pointermove", (event) => {
  state.lastMouse = { x: event.clientX, y: event.clientY };
});

window.addEventListener("pointerdown", (event) => {
  if (!menu.hidden && !menu.contains(event.target) && event.target !== pet) {
    hideMenu();
  }
});

window.addEventListener("resize", keepPetOnScreen);
syncMenu();
scheduleRandomChase();
scheduleIdleWander();
scheduleSleep();
