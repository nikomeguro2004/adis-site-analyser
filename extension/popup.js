document.addEventListener("DOMContentLoaded", function () {
    const resultElement = document.getElementById("result");
    const riskImage = document.getElementById("riskImage");
    const checkBtn = document.getElementById("checkBtn");
    const reportBtn = document.getElementById("reportBtn");
    const viewReportedBtn = document.getElementById("viewReportedSites");

    document.getElementById("headerImage").src = chrome.runtime.getURL("icon04.png");

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs.length === 0 || !tabs[0].id) {
            updateUI("⚠️ Error: Could not retrieve active tab.", "orange", "icon02.png");
            return;
        }

        let currentTab = tabs[0].url;

        if (currentTab.startsWith("chrome://") || currentTab === "about:blank") {
            updateUI("✅ Safe (Internal Chrome Page)", "green", "icon01.png");
            return;
        }

        checkWebsiteRisk(currentTab);
    });

    checkBtn.addEventListener("click", function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs.length === 0 || !tabs[0].id) {
                updateUI("⚠️ Error: Could not retrieve active tab.", "orange", "icon02.png");
                return;
            }
            checkWebsiteRisk(tabs[0].url);
        });
    });

    reportBtn.addEventListener("click", function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs.length === 0 || !tabs[0].id) return;
            chrome.runtime.sendMessage({ action: "reportPhishing", url: tabs[0].url });
            alert("🚨 Site reported as phishing!");
        });
    });

    viewReportedBtn.addEventListener("click", function () {
        chrome.runtime.openOptionsPage();
    });

    function checkWebsiteRisk(url) {
        resultElement.innerText = "⚡ Scanning...";
        resultElement.style.color = "yellow";

        chrome.runtime.sendMessage({ action: "checkURL", url: url }, (response) => {
            if (!response || response.riskScore === undefined) {
                updateUI("⚠️ Error: Could not retrieve risk score.", "orange", "icon02.png");
                return;
            }
            updateRiskDisplay(response);
        });
    }

    function updateUI(message, color, icon) {
        resultElement.innerText = message;
        resultElement.style.color = color;
        riskImage.src = chrome.runtime.getURL(icon);
        riskImage.style.display = "block";
    }

    function updateRiskDisplay(response) {
        updateUI(
            response.message,
            response.riskScore >= 50 ? "red" : "green",
            response.riskScore >= 50 ? "icon03.png" : "icon01.png"
        );
    }
});
