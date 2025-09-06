document.addEventListener("DOMContentLoaded", function () {
    const securityInfo = document.getElementById("security-info");
    const riskIcon = document.getElementById("risk");
    const scanBtn = document.getElementById("scan-again");
    const reportBtn = document.getElementById("reportBtn");
    const viewReportedBtn = document.getElementById("viewReportedSites");

    // Check for required elements
    if (!securityInfo || !riskIcon || !scanBtn || !reportBtn || !viewReportedBtn) {
        console.error("Missing required HTML elements");
        if (securityInfo) {
            securityInfo.textContent = "[Error] Popup setup failed";
            securityInfo.className = "warning";
            securityInfo.setAttribute("role", "alert");
            securityInfo.setAttribute("aria-live", "assertive");
        }
        return;
    }

    // Initial UI setup
    securityInfo.textContent = "[Ready] Click Scan to check";
    securityInfo.className = "ready";
    securityInfo.setAttribute("role", "status");
    securityInfo.setAttribute("aria-live", "polite");
    riskIcon.style.display = "none";
    riskIcon.setAttribute("alt", "");

    // Cache current tab URL
    let currentUrl = "";
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs.length > 0 && tabs[0].url) {
            currentUrl = tabs[0].url;
            checkWebsiteRisk(currentUrl);
        } else {
            updateUI("[Warning] No website found", "warning", "Warning.png", "No active tab");
        }
    });

    // Button event listeners with debounce
    let isScanning = false;
    scanBtn.addEventListener("click", function () {
        if (isScanning) return;
        isScanning = true;
        scanBtn.disabled = true;
        checkWebsiteRisk(currentUrl);
        setTimeout(() => {
            isScanning = false;
            scanBtn.disabled = false;
        }, 1000); // Debounce for 1s
    });

    reportBtn.addEventListener("click", function () {
        if (!currentUrl) {
            updateUI("[Warning] No website found", "warning", "Warning.png", "No active tab");
            return;
        }
        chrome.runtime.sendMessage({ action: "reportPhishing", url: currentUrl }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Report error:", chrome.runtime.lastError);
                updateUI("[Warning] Report failed", "warning", "Warning.png", "Communication error");
                return;
            }
            if (response.status === "already_reported") {
                updateUI("[Warning] Site already reported", "warning", "Warning.png", "");
            } else if (response.status === "success") {
                updateUI("[Reported] Site flagged as phishing!", "warning", "Warning.png", "");
            } else {
                updateUI("[Warning] Report failed", "warning", "Warning.png", "Storage error");
            }
        });
    });

    viewReportedBtn.addEventListener("click", function () {
        chrome.runtime.openOptionsPage();
    });

    function checkWebsiteRisk(url) {
        if (!url) {
            updateUI("[Warning] No website found", "warning", "Warning.png", "No active tab");
            return;
        }
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
                updateUI("[Warning] Scan failed", "warning", "Warning.png", "Communication error");
                return;
            }
            if (!response || response.riskScore === undefined) {
                updateUI("[Warning] Scan failed", "warning", "Warning.png", "No risk score");
                return;
            }
            updateRiskDisplay(response);
        });
    }

    function updateUI(message, status, icon, details = "") {
        securityInfo.textContent = `${message}${details ? ` (${details})` : ""}`;
        securityInfo.className = status;
        securityInfo.setAttribute("role", "alert");
        securityInfo.setAttribute("aria-live", "assertive");
        securityInfo.classList.add("fade-in");
        setTimeout(() => securityInfo.classList.remove("fade-in"), 600);

        riskIcon.src = chrome.runtime.getURL(icon);
        riskIcon.style.display = "block";
        riskIcon.setAttribute("alt", `${status.charAt(0).toUpperCase() + status.slice(1)} icon`);
        riskIcon.classList.add("pulse");
        setTimeout(() => riskIcon.classList.remove("pulse"), 600);
    }

    function updateRiskDisplay(response) {
        const status = response.riskScore >= 50 ? "unsafe" : "safe";
        const icon = response.riskScore >= 50 ? "Danger.png" : "Secure.png";
        updateUI(response.message, status, icon, response.details);
    }
});