// Content script to track page visibility
let pageStartTime = Date.now();
let isPageVisible = !document.hidden;

// Start tracking immediately
const domain = window.location.hostname.replace("www.", "");

// Track when page visibility changes (tab switching, minimizing, etc.)
document.addEventListener("visibilitychange", () => {
  const domain = window.location.hostname.replace("www.", "");

  if (document.hidden) {
    // Page became hidden, stop tracking
    if (isPageVisible) {
      const timeSpent = Date.now() - pageStartTime;
      browser.runtime.sendMessage({
        action: "saveTime",
        domain: domain,
        timeSpent: timeSpent,
      });
      isPageVisible = false;
    }
  } else {
    // Page became visible, start tracking
    pageStartTime = Date.now();
    isPageVisible = true;
  }
});

// Save time when page is about to unload
window.addEventListener("beforeunload", () => {
  if (isPageVisible) {
    const domain = window.location.hostname.replace("www.", "");
    const timeSpent = Date.now() - pageStartTime;
    browser.runtime.sendMessage({
      action: "saveTime",
      domain: domain,
      timeSpent: timeSpent,
    });
  }
});

// Handle messages from background script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "ping") {
    sendResponse({ status: "active" });
  }
});
