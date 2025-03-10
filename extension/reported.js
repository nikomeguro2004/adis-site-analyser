document.addEventListener("DOMContentLoaded", function () {
    const siteList = document.getElementById("siteList");

    // ✅ Load and display reported sites
    chrome.runtime.sendMessage({ action: "getReportedSites" }, (response) => {
        if (!response || !response.sites) return;

        siteList.innerHTML = "";
        response.sites.forEach(url => {
            let li = document.createElement("li");
            li.textContent = url;
            let btn = document.createElement("button");
            btn.textContent = "Unmark";
            btn.onclick = function () {
                chrome.runtime.sendMessage({ action: "unmarkPhishing", url: url });
                li.remove();
            };
            li.appendChild(btn);
            siteList.appendChild(li);
        });
    });
});
