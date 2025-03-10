chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "checkURL") {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs.length === 0 || !tabs[0].id) {
                sendResponse({ riskScore: 100, message: "⚠️ Error: Could not get active tab." });
                return;
            }
            checkWebsiteRisk(request.url, tabs[0].id).then(response => {
                if (response.riskScore >= 50) {
                    showWarningNotification();
                }
                sendResponse(response);
            });
        });
        return true;
    }
});

function extractDomain(url) {
    try {
        return new URL(url).hostname;
    } catch {
        return url.replace("www.", "");
    }
}

async function checkWebsiteRisk(url, tabId) {
    if (!tabId) {
        return { riskScore: 100, message: "⚠️ Invalid tab ID" };
    }

    if (url.startsWith("chrome://") || url === "about:blank") {
        return { riskScore: 0, message: "✅ Safe (Internal Chrome Page)" };
    }

    let domain = extractDomain(url);
    if (!domain) {
        return { riskScore: 100, message: "❌ Invalid URL" };
    }

    if (url.startsWith("http://")) {
        updateIcon("icon03.png", tabId);
        return { riskScore: 100, message: "❌ Site Unsafe, close ASAP" };
    }

    let sslRisk = await checkSSLValidity(url);
    if (sslRisk > 0) {
        updateIcon("icon03.png", tabId);
        return { riskScore: 100, message: "❌ Invalid SSL Certificate!" };
    }

    return { riskScore: 0, message: "✅ You're safe (for now)" };
}

// ✅ Show warning notification when a site is unsafe
function showWarningNotification() {
    chrome.notifications.create({
        type: "basic",
        iconUrl: chrome.runtime.getURL("icon03.png"),
        title: "⚠️ WARNING",
        message: "This site is unsafe! Exit immediately!",
        requireInteraction: true
    });
}

async function checkSSLValidity(url) {
    try {
        let response = await fetch(url, { method: "HEAD" });
        return response.ok && response.url.startsWith("https://") ? 0 : 50;
    } catch {
        return 50;
    }
}

function updateIcon(icon, tabId) {
    if (tabId) {
        chrome.action.setIcon({ path: icon, tabId: tabId });
    }
}
