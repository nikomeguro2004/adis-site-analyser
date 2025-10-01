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
    } else if (request.action === "reportPhishing") {
        chrome.storage.local.get(["reportedSites"], (result) => {
            let reportedSites = result.reportedSites || [];
            if (!reportedSites.includes(request.url)) {
                reportedSites.push(request.url);
                chrome.storage.local.set({ reportedSites }, () => {
                    sendResponse({ success: true });
                    chrome.runtime.sendMessage({ action: "updateReportedSites", sites: reportedSites });
                });
            } else {
                sendResponse({ success: true });
            }
        });
        return true;
    } else if (request.action === "getReportedSites") {
        chrome.storage.local.get(["reportedSites"], (result) => {
            sendResponse({ sites: result.reportedSites || [] });
        });
        return true;
    } else if (request.action === "unmarkPhishing") {
        chrome.storage.local.get(["reportedSites"], (result) => {
            let reportedSites = result.reportedSites || [];
            reportedSites = reportedSites.filter(url => url !== request.url);
            chrome.storage.local.set({ reportedSites }, () => {
                sendResponse({ success: true });
                chrome.runtime.sendMessage({ action: "updateReportedSites", sites: reportedSites });
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

    let reportedSites = await new Promise(resolve => {
        chrome.storage.local.get(["reportedSites"], result => {
            resolve(result.reportedSites || []);
        });
    });
    if (reportedSites.includes(url)) {
        updateIcon("icon03.png", tabId);
        return { riskScore: 100, message: "❌ Reported as Phishing" };
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
        let response = await fetch(url, { method: "HEAD", redirect: "follow" });
        if (response.ok && response.url.startsWith("https://")) {
           return 0; 
        }
        return 50;
    } catch (error) {
        console.error("SSL check error:", error.message);
        return 50; 
    }
}

function updateIcon(icon, tabId) {
    if (tabId) {
        chrome.action.setIcon({ path: icon, tabId: tabId });
    }
}