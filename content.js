async function createSidebar() {
  const sidebar = document.createElement("div");
  sidebar.id = "readability-sidebar";

  const response = await fetch(chrome.runtime.getURL("sidebar.html"));
  const htmlContent = await response.text();
  sidebar.innerHTML = htmlContent;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = chrome.runtime.getURL("sidebar.css");

  document.body.appendChild(sidebar);
  document.head.appendChild(link);

  // event handlers
  document.getElementById("define-button").addEventListener("click", () => {
    const word = document.getElementById("word-input").value;
    if (word.trim()) {
      document.getElementById(
        "definition-display"
      ).textContent = `Looking up definition for "${word}"...`;
    }
  });
}

// Initialize message listener when content script loads
console.log("Readability extension content script loaded");

// toggles the sidebar after the extension icon is clicked
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in content script:", message);
  if (message.action === "toggleSidebar") {
    const sidebar = document.getElementById("readability-sidebar");
    if (sidebar) {
      sidebar.remove();
    } else {
      createSidebar();
    }
    sendResponse({ status: "Sidebar toggled" });
    return true;
  }
});

// to auto load the sidebar when the page loads, uncomment the line below
// createSidebar();
