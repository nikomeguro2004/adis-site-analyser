async function checkSSLValidity(url) {
    try {
        let response = await fetch(url, { method: "HEAD" });
        if (!response.ok) {
            return { riskScore: 50, details: "Server Error" };
        }
        if (!response.url.startsWith("https://")) {
            return { riskScore: 50, details: "No HTTPS" };
        }
        return new Promise((resolve) => {
            chrome.webRequest.onHeadersReceived.addListener(
                (details) => {
                    if (details.url === url) {
                        if (!details.sslVerified) {
                            resolve({ riskScore: 75, details: "Unverified SSL" });
                        } else {
                            const isExpired = false;
                            const isUntrusted = false;
                            if (isExpired) {
                                resolve({ riskScore: 60, details: "Expired SSL" });
                            } else if (isUntrusted) {
                                resolve({ riskScore: 65, details: "Untrusted SSL" });
                            } else {
                                resolve({ riskScore: 0, details: "Secure Connection" });
                            }
                        }
                    }
                },
                { urls: [url] },
                ["responseHeaders"]
            );
            fetch(url, { method: "HEAD" }).catch(() => resolve({ riskScore: 50, details: "Network Error" }));
            setTimeout(() => resolve({ riskScore: 50, details: "Scan Timed Out" }), 2000);
        });
    } catch {
        return { riskScore: 50, details: "Scan Failed" };
    }
}

function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch {
        return null;
    }
}

function updateIcon(icon, tabId) {
    chrome.action.setIcon({ path: icon, tabId: tabId });
}

async function checkWebsiteRisk(url, tabId) {
    if (!tabId) {
        return { riskScore: 100, message: "[Warning] No Tab Found", details: "Cannot scan without active tab" };
    }
    if (url.startsWith("chrome://") || url === "about:blank") {
        updateIcon("icon01.png", tabId);
        return { riskScore: 0, message: "[Safe] Chrome Page", details: "Internal page" };
    }
    let domain = extractDomain(url);
    if (!domain) {
        updateIcon("icon03.png", tabId);
        return { riskScore: 100, message: "[Danger] Invalid URL", details: "Cannot parse URL" };
    }
    if (url.startsWith("http://")) {
        updateIcon("icon03.png", tabId);
        return { riskScore: 100, message: "[Danger] Risky Site", details: "No HTTPS" };
    }
    let sslResult = await checkSSLValidity(url);
    if (sslResult.riskScore > 0) {
        updateIcon("icon03.png", tabId);
        return { riskScore: sslResult.riskScore, message: "[Danger] SSL Issue", details: sslResult.details };
    }
    updateIcon("icon01.png", tabId);
    return { riskScore: 0, message: "[Safe] Secure", details: sslResult.details };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "checkURL") {
        checkWebsiteRisk(request.url, sender.tab?.id).then((response) => {
            sendResponse(response);
        });
        return true;
    } else if (request.action === "reportPhishing") {
        chrome.storage.local.get(["reportedSites"], (data) => {
            let reportedSites = data.reportedSites || [];
            reportedSites.push({ url: request.url, timestamp: Date.now() });
            chrome.storage.local.set({ reportedSites }, () => {
                console.log("Phishing reported:", request.url);
            });
        });
    } else if (request.action === "getReportedSites") {
        chrome.storage.local.get(["reportedSites"], (data) => {
            sendResponse({ sites: data.reportedSites ? data.reportedSites.map(site => site.url) : [] });
        });
        return true;
    } else if (request.action === "unmarkPhishing") {
        chrome.storage.local.get(["reportedSites"], (data) => {
            let reportedSites = data.reportedSites || [];
            reportedSites = reportedSites.filter(site => site.url !== request.url);
            chrome.storage.local.set({ reportedSites }, () => {
                console.log("Unmarked phishing:", request.url);
            });
        });
    }
});
