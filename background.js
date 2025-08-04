// Background script to track active tabs and time
let currentTabId = null;
let startTime = null;
let currentDomain = null;

// Initialize tracking when extension starts
browser.runtime.onStartup.addListener(() => {
  initializeTracking();
});

browser.runtime.onInstalled.addListener(() => {
  initializeTracking();
});

// Handle messages from content script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "saveTime") {
    saveTimeData(message.domain, message.timeSpent);
  }
});

function initializeTracking() {
  // Get the active tab when extension starts
  browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      startTracking(tabs[0]);
    }
  });
}

// Track when tabs are activated
browser.tabs.onActivated.addListener((activeInfo) => {
  browser.tabs.get(activeInfo.tabId, (tab) => {
    if (tab) {
      stopCurrentTracking();
      startTracking(tab);
    }
  });
});

// Track when tabs are updated (URL changes)
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.active) {
    stopCurrentTracking();
    startTracking(tab);
  }
});

// Track when window focus changes
browser.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === browser.windows.WINDOW_ID_NONE) {
    // Browser lost focus
    stopCurrentTracking();
  } else {
    // Browser gained focus, get active tab
    browser.tabs.query({ active: true, windowId: windowId }, (tabs) => {
      if (tabs[0]) {
        startTracking(tabs[0]);
      }
    });
  }
});

function startTracking(tab) {
  if (
    tab.url &&
    !tab.url.startsWith("moz-extension://") &&
    !tab.url.startsWith("about:")
  ) {
    currentTabId = tab.id;
    currentDomain = getDomainFromUrl(tab.url);
    startTime = Date.now();
  }
}

function stopCurrentTracking() {
  if (currentTabId && startTime && currentDomain) {
    const timeSpent = Date.now() - startTime;
    saveTimeData(currentDomain, timeSpent);
  }

  currentTabId = null;
  startTime = null;
  currentDomain = null;
}

function getDomainFromUrl(url) {
  try {
    const domain = new URL(url).hostname;
    return domain.replace("www.", ""); // Remove www prefix
  } catch (e) {
    return url;
  }
}

function saveTimeData(domain, timeSpent) {
  const today = new Date().toDateString();

  browser.storage.local.get([domain]).then((result) => {
    const domainData = result[domain] || {};
    const todayData = domainData[today] || 0;

    domainData[today] = todayData + timeSpent;

    browser.storage.local
      .set({
        [domain]: domainData,
      })
      .then(() => {});
  });
}
