document.addEventListener("DOMContentLoaded", function () {
    const siteList = document.getElementById("siteList");

    // Check for required element
    if (!siteList) {
        console.error("Missing siteList element in reported.html");
        return;
    }

    // Function to render the list of reported sites
    function renderReportedSites() {
        chrome.storage.local.get(["reportedSites"], ({ reportedSites }) => {
            if (chrome.runtime.lastError) {
                console.error("Storage error:", chrome.runtime.lastError.message);
                siteList.innerHTML = '<li role="alert">Error loading reported sites</li>';
                return;
            }

            if (!reportedSites || reportedSites.length === 0) {
                siteList.innerHTML = '<li role="status">No reported sites yet.</li>';
                return;
            }

            siteList.innerHTML = "";
            reportedSites.forEach(site => {
                const li = document.createElement("li");
                li.textContent = `${site.url} (Reported on ${new Date(site.timestamp).toLocaleString()})`;
                li.setAttribute("role", "listitem");

                const btn = document.createElement("button");
                btn.textContent = "Unmark";
                btn.setAttribute("aria-label", `Unmark ${site.url} as phishing`);
                btn.addEventListener("click", () => {
                    if (confirm(`Are you sure you want to unmark ${site.url} as a phishing site?`)) {
                        chrome.runtime.sendMessage({ action: "unmarkPhishing", url: site.url }, (response) => {
                            if (chrome.runtime.lastError) {
                                console.error("Unmark error:", chrome.runtime.lastError.message);
                                siteList.innerHTML = '<li role="alert">Error unmarking site</li>';
                            } else if (response.status === "success") {
                                renderReportedSites(); // Refresh list
                            }
                        });
                    }
                });

                li.appendChild(btn);
                siteList.appendChild(li);
            });
        });
    }

    // Initial render
    renderReportedSites();
});