let isVisible = !document.hidden;

document.addEventListener("visibilitychange", () => {
  isVisible = !document.hidden;
  chrome.runtime.sendMessage({ type: isVisible ? "TICK" : "IDLE" }).catch(() => { });
});

window.addEventListener("focus", () => { isVisible = true; });

export { };