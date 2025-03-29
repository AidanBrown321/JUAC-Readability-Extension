chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: "toggleSidebar" })
    .then(response => {
      console.log("Message sent:", response);
    })
    .catch((error) => {
      console.warn("No content script found on this tab. Ignoring.");
    });
});
