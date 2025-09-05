async function checkSSLValidity(url) {
    try {
        const response = await fetch(url, { method: "HEAD", mode: "no-cors" });
        // Check if URL uses HTTPS
        if (!url.startsWith("https://")) {
            return { riskScore: 50, details: "No HTTPS" };
        }
        // Since no-cors limits response details, assume success if no error
        return { riskScore: 0, details: "Secure Connection" };
    } catch (error) {
        console.error("SSL check error:", error.message);
        return { riskScore: 50, details: "Scan Failed" };
    }
}

function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch {
        console.error("Invalid URL for domain extraction:", url);
        return null;
    }
}

function updateIcon(icon, tabId) {
    if (tabId) {
        chrome.action.setIcon({ path: icon, tabId: tabId }, () => {
            if (chrome.runtime.lastError) {
                console.error("Error setting icon:", chrome.runtime.lastError);
            }
        });
    }
}

async function checkWebsiteRisk(url, tabId) {
    if (!tabId) {
        return { riskScore: 100, message: "[Warning] No Tab Found", details: "Cannot scan without active tab" };
    }
    if (url.startsWith("chrome://") || url === "about:blank") {
        updateIcon("Warning.png", tabId);
        return { riskScore: 50, message: "[Warning] Internal Page", details: "Cannot analyze Chrome internal page" };
    }
    const domain = extractDomain(url);
    if (!domain) {
        updateIcon("Danger.png", tabId);
        return { riskScore: 100, message: "[Danger] Invalid URL", details: "Cannot parse URL" };
    }
    if (url.startsWith("http://")) {
        updateIcon("Danger.png", tabId);
        return { riskScore: 100, message: "[Danger] Risky Site", details: "No HTTPS" };
    }
    const sslResult = await checkSSLValidity(url);
    updateIcon(sslResult.riskScore > 0 ? "Danger.png" : "Secure.png", tabId);
    return {
        riskScore: sslResult.riskScore,
        message: sslResult.riskScore > 0 ? "[Danger] SSL Issue" : "[Safe] Secure",
        details: sslResult.details
    };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "checkURL") {
        checkWebsiteRisk(request.url, sender.tab?.id).then((response) => {
            sendResponse(response);
        });
        return true;
    } else if (request.action === "setWarningIcon") {
        updateIcon("Warning.png", request.tabId);
        sendResponse({ status: "success" });
        return true;
    } else if (request.action === "reportPhishing") {
        if (!request.url || request.url.startsWith("chrome://") || request.url === "about:blank") {
            console.error("Invalid URL for reporting:", request.url);
            sendResponse({ status: "error", message: "Cannot report internal or invalid pages" });
            return true;
        }
        chrome.storage.local.get(["reportedSites"], ({ reportedSites }) => {
            const sites = reportedSites || [];
            if (sites.some(site => site.url === request.url)) {
                console.log("Site already reported:", request.url);
                sendResponse({ status: "already_reported" });
            } else {
                sites.push({ url: request.url, timestamp: Date.now() });
                const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
                const updatedSites = sites.filter(site => site.timestamp > thirtyDaysAgo);
                chrome.storage.local.set({ reportedSites: updatedSites }, () => {
                    if (chrome.runtime.lastError) {
                        console.error("Storage error:", chrome.runtime.lastError.message);
                        sendResponse({ status: "error", message: "Failed to save reported site" });
                    } else {
                        console.log("Phishing reported:", request.url);
                        sendResponse({ status: "success", message: "Site reported successfully" });
                    }
                });
            }
        });
        return true;
    } else if (request.action === "getReportedSites") {
        chrome.storage.local.get(["reportedSites"], ({ reportedSites }) => {
            if (chrome.runtime.lastError) {
                console.error("Storage error:", chrome.runtime.lastError.message);
                sendResponse({ sites: [], error: "Failed to retrieve sites" });
            } else {
                sendResponse({ sites: reportedSites || [] });
            }
        });
        return true;
    } else if (request.action === "unmarkPhishing") {
        chrome.storage.local.get(["reportedSites"], ({ reportedSites }) => {
            const sites = reportedSites || [];
            const updatedSites = sites.filter(site => site.url !== request.url);
            chrome.storage.local.set({ reportedSites: updatedSites }, () => {
                if (chrome.runtime.lastError) {
                    console.error("Storage error:", chrome.runtime.lastError.message);
                    sendResponse({ status: "error", message: "Failed to unmark site" });
                } else {
                    console.log("Unmarked phishing:", request.url);
                    sendResponse({ status: "success", message: "Site unmarked successfully" });
                }
            });
        });
        return true;
    }
});

// Auto-scan on tab update
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url && tab.active) {
        if (tab.url.startsWith("chrome://") || tab.url === "about:blank") {
            updateIcon("Warning.png", tabId);
        } else {
            checkWebsiteRisk(tab.url, tabId);
        }
    }
});