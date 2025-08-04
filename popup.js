// Popup script for the dashboard
document.addEventListener("DOMContentLoaded", () => {
  const todayBtn = document.getElementById("todayBtn");
  const weekBtn = document.getElementById("weekBtn");
  const exportBtn = document.getElementById("exportBtn");
  const clearBtn = document.getElementById("clearBtn");
  const statsHeader = document.getElementById("statsHeader");
  const todayStats = document.getElementById("todayStats");
  const chart = document.getElementById("chart");

  let currentView = "today";

  // Event listeners
  todayBtn.addEventListener("click", () => {
    currentView = "today";
    updateActiveButton();
    loadData();
  });

  weekBtn.addEventListener("click", () => {
    currentView = "week";
    updateActiveButton();
    loadData();
  });

  exportBtn.addEventListener("click", () => {
    exportData();
  });

  clearBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to clear all tracking data?")) {
      browser.storage.local.clear().then(() => {
        loadData();
      });
    }
  });

  function updateActiveButton() {
    todayBtn.style.background = currentView === "today" ? "#0052a3" : "#0066cc";
    weekBtn.style.background = currentView === "week" ? "#0052a3" : "#0066cc";
    if (currentView === "today") {
      statsHeader.textContent = "Time Spent Today";
    } else if (currentView === "week") {
      statsHeader.textContent = "Time Spent This Week";
    }
  }

  function loadData() {
    browser.storage.local.get(null).then((data) => {
      const processedData = processData(data);
      displayStats(processedData);
      displayChart(processedData);
    });
  }

  function exportData() {
    browser.storage.local.get(null).then((data) => {
      const processedData = processData(data);
      const csv = convertToCSV(processedData);
      downloadCSV(csv);
    });
  }

  function convertToCSV(data) {
    let csv = "Website,Time Spent \n";
    for (const [domain, time] of Object.entries(data)) {
      const hours = Math.floor(time / 3600000);
      const minutes = Math.floor((time % 3600000) / 60000);
      const seconds = Math.floor((time % 60000) / 1000);
      csv += `${domain},${hours} hour(s) ${minutes} minute(s) ${seconds} second(s)\n`;
    }
    return csv;
  }

  function downloadCSV(csv) {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    timestamp = Date.now();
    link.download = `watch-your-time-${timestamp}.csv`;
    link.click();
  }

  function processData(rawData) {
    const today = new Date().toDateString();
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const result = {};

    for (const [domain, dateData] of Object.entries(rawData)) {
      let totalTime = 0;

      for (const [date, time] of Object.entries(dateData)) {
        const dateObj = new Date(date);

        if (currentView === "today" && date === today) {
          totalTime += time;
        } else if (currentView === "week" && dateObj >= weekStart) {
          totalTime += time;
        }
      }

      if (totalTime > 0) {
        result[domain] = totalTime;
      }
    }

    return result;
  }

  function displayStats(data) {
    const sortedData = Object.entries(data)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    if (sortedData.length === 0) {
      todayStats.innerHTML = '<div class="no-data">No browsing data yet</div>';
      return;
    }

    const html = sortedData
      .map(
        ([domain, time]) => `
      <div class="website-item">
        <span class="website-name">${domain}</span>
        <span class="website-time">${formatTime(time)}</span>
      </div>
    `,
      )
      .join("");

    todayStats.innerHTML = html;
  }

  function displayChart(data) {
    const sortedData = Object.entries(data)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    if (sortedData.length === 0) {
      chart.innerHTML = '<div class="no-data">No data to display</div>';
      return;
    }

    const maxTime = Math.max(...sortedData.map(([, time]) => time));

    const html = sortedData
      .map(([domain, time]) => {
        const percentage = (time / maxTime) * 100;
        return `
        <div class="bar-item">
          <div class="bar-label">${domain} (${formatTime(time)})</div>
          <div class="bar-container">
            <div class="bar-fill" style="width: ${percentage}%"></div>
          </div>
        </div>
      `;
      })
      .join("");

    chart.innerHTML = `<div class="bar-chart">${html}</div>`;
  }

  function formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Initial load
  updateActiveButton();
  loadData();
});
