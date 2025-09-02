document.addEventListener("DOMContentLoaded", function () {
    const securityInfo = document.getElementById("security-info");
    const riskIcon = document.getElementById("risk");
    const scanBtn = document.getElementById("scan-again");
    const reportBtn = document.getElementById("reportBtn");
    const viewReportedBtn = document.getElementById("viewReportedSites");

    // Check if required elements exist
    if (!securityInfo || !riskIcon || !scanBtn || !reportBtn || !viewReportedBtn) {
        console.error("Missing required HTML elements");
        if (securityInfo) {
            securityInfo.textContent = "[Error] Popup setup failed";
            securityInfo.className = "warning";
        }
        return;
    }

    // Initial UI setup
    securityInfo.textContent = "[Ready] Click Scan to check";
    securityInfo.className = "ready";
    securityInfo.setAttribute("role", "status");
    securityInfo.setAttribute("aria-live", "polite");
    riskIcon.style.display = "none";

    // Check active tab on load
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs.length === 0 || !tabs[0].url) {
            updateUI("[Warning] No website found", "warning", "icon02.png", "(No active tab)");
            return;
        }
        checkWebsiteRisk(tabs[0].url);
    });

    // Button event listeners
    scanBtn.addEventListener("click", function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs.length === 0 || !tabs[0].url) {
                updateUI("[Warning] No website found", "warning", "icon02.png", "(No active tab)");
                return;
            }
            checkWebsiteRisk(tabs[0].url);
        });
    });

    reportBtn.addEventListener("click", function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs.length === 0 || !tabs[0].url) {
                updateUI("[Warning] No website found", "warning", "icon02.png", "(No active tab)");
                return;
            }
            chrome.runtime.sendMessage({ action: "reportPhishing", url: tabs[0].url }, () => {
                updateUI("[Reported] Site flagged as phishing!", "warning", "icon02.png", "");
            });
        });
    });

    viewReportedBtn.addEventListener("click", function () {
        chrome.runtime.openOptionsPage();
    });

    function checkWebsiteRisk(url) {
        securityInfo.textContent = "[Checking] Scanning...";
        securityInfo.className = "warning";
        securityInfo.setAttribute("role", "alert");
        securityInfo.setAttribute("aria-live", "assertive");
        securityInfo.classList.add("fade-in");
        riskIcon.style.display = "none";
        setTimeout(() => securityInfo.classList.remove("fade-in"), 600);

        chrome.runtime.sendMessage({ action: "checkURL", url }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Message error:", chrome.runtime.lastError);
                updateUI("[Warning] Scan failed", "warning", "icon02.png", "(Communication error)");
                return;
            }
            if (!response || response.riskScore === undefined) {
                updateUI("[Warning] Scan failed", "warning", "icon02.png", "(No risk score)");
                return;
            }
            updateRiskDisplay(response);
        });
    }

    function updateUI(message, status, icon, details = "") {
        const enhancedMessages = {
            safe: `[Safe] Secure ${details || (message.includes("Trusted") ? "(On Trusted List)" : "")}`,
            unsafe: `[Danger] Risky ${details || (message.includes("SSL") ? "(Invalid SSL)" : "")}`,
            warning: `[Warning] Issue ${details || (message.includes("tab") ? "(No Website)" : "")}`
        };
        securityInfo.textContent = enhancedMessages[status] || message;
        securityInfo.className = status;
        securityInfo.setAttribute("role", "alert");
        securityInfo.setAttribute("aria-live", "assertive");
        securityInfo.classList.add("fade-in");
        setTimeout(() => securityInfo.classList.remove("fade-in"), 600);

        riskIcon.src = chrome.runtime.getURL(icon);
        riskIcon.style.display = "block";
        riskIcon.setAttribute("alt", status === "safe" ? "Secure site icon" : status === "unsafe" ? "Risky site icon" : "Warning icon");
        riskIcon.classList.add("pulse");
        setTimeout(() => riskIcon.classList.remove("pulse"), 600);
    }

    function updateRiskDisplay(response) {
        updateUI(
            response.message,
            response.riskScore >= 50 ? "unsafe" : "safe",
            response.riskScore >= 50 ? "icon03.png" : "icon01.png",
            response.details || ""
        );
    }
});