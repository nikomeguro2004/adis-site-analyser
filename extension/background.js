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
        updateIcon("Secure.png", tabId);
        return { riskScore: 0, message: "[Safe] Chrome Page", details: "Internal page" };
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
        return true; // Keep message channel open for async response
    } else if (request.action === "reportPhishing") {
        chrome.storage.local.get(["reportedSites"], (data) => {
            let reportedSites = data.reportedSites || [];
            if (reportedSites.some(site => site.url === request.url)) {
                console.log("Site already reported:", request.url);
                sendResponse({ status: "already_reported" });
            } else {
                reportedSites.push({ url: request.url, timestamp: Date.now() });
                // Auto-expire entries older than 30 days
                const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
                reportedSites = reportedSites.filter(site => site.timestamp > thirtyDaysAgo);
                chrome.storage.local.set({ reportedSites }, () => {
                    if (chrome.runtime.lastError) {
                        console.error("Storage error:", chrome.runtime.lastError);
                        sendResponse({ status: "error" });
                    } else {
                        console.log("Phishing reported:", request.url);
                        sendResponse({ status: "success" });
                    }
                });
            }
        });
        return true;
    } else if (request.action === "getReportedSites") {
        chrome.storage.local.get(["reportedSites"], (data) => {
            if (chrome.runtime.lastError) {
                console.error("Storage error:", chrome.runtime.lastError);
                sendResponse({ sites: [], error: "Failed to retrieve sites" });
            } else {
                sendResponse({ sites: data.reportedSites || [] });
            }
        });
        return true;
    } else if (request.action === "unmarkPhishing") {
        chrome.storage.local.get(["reportedSites"], (data) => {
            let reportedSites = data.reportedSites || [];
            reportedSites = reportedSites.filter(site => site.url !== request.url);
            chrome.storage.local.set({ reportedSites }, () => {
                if (chrome.runtime.lastError) {
                    console.error("Storage error:", chrome.runtime.lastError);
                    sendResponse({ status: "error" });
                } else {
                    console.log("Unmarked phishing:", request.url);
                    sendResponse({ status: "success" });
                }
            });
        });
        return true;
    }
});

// Auto-scan on tab update
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url && tab.active) {
        checkWebsiteRisk(tab.url, tabId);
    }
});