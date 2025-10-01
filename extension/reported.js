document.addEventListener("DOMContentLoaded", function () {
    const siteList = document.getElementById("siteList");

    function updateSiteList(sites) {
        siteList.innerHTML = "";
        sites.forEach(url => {
            let li = document.createElement("li");
            let checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = true; // Reported sites are checked by default
            checkbox.addEventListener("change", function () {
                if (!checkbox.checked) {
                    chrome.runtime.sendMessage({ action: "unmarkPhishing", url: url }, () => {
                        li.remove();
                    });
                }
            });
            li.appendChild(checkbox);
            li.appendChild(document.createTextNode(" " + url));
            siteList.appendChild(li);
        });
    }

    // Load and display reported sites
    chrome.runtime.sendMessage({ action: "getReportedSites" }, (response) => {
        if (!response || !response.sites) return;
        updateSiteList(response.sites);
    });

    // Listen for updates from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "updateReportedSites") {
            updateSiteList(request.sites);
        }
    });
});