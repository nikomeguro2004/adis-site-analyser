# adis-site-analyser
Project Overview
Adi’s Site Analyzer is a Chrome extension designed to analyze website security in real-time, helping users identify unsafe websites and phishing attempts. The extension provides instant feedback on website safety, checks for SSL certificate validity, detects HTTP usage, warns users about phishing risks, and displays a notification when a site is unsafe.

Key Features
Real-Time Website Security Analysis – Scans the active tab for potential security threats.
Instant SSL & HTTP Check – Flags websites using HTTP or invalid SSL certificates as unsafe.
Phishing Detection – Users can report phishing sites, and the extension maintains a list of reported URLs.
Automated Risk Scoring – Determines risk levels based on SSL validity, HTTP usage, phishing reports, and known blacklist databases.
Dynamic Security Notifications – Displays alert notifications for unsafe sites with a message to exit immediately.
Extension Icon Updates – Changes extension icon dynamically based on website security:
Safe (icon01.png) – The site is secure.
Unsafe (icon03.png) – The site is high risk or phishing.
Unreachable (icon02.png) – The site does not exist or cannot be scanned.
Professional & Compact UI – Modern interface with a header image, risk level indicator, and smooth animations.
Blacklist & Typosquatting Detection – Flags domains using known malware, phishing, and typo-squatted URLs.
Customizable User Settings – Users can view reported phishing sites and manually scan websites.
How It Works
The user visits a website, and the extension automatically scans it.
The extension analyzes SSL, HTTP, phishing reports, and blacklist status.
A security indicator displays the result in the extension popup.
If the site is unsafe, a popup notification warns the user to exit immediately.
The user can report phishing sites or manually rescan the website.
Technologies Used
JavaScript (Chrome Extensions API) – Core logic for scanning and handling messages.
HTML & CSS – For the extension popup and UI styling.
Chrome Storage API – Saves reported phishing sites and settings.
Fetch API – Used for validating SSL certificates and checking site status.
Future Enhancements
Real-Time Blacklist API Integration – Sync with PhishTank or Google Safe Browsing.
Auto-Blocking Feature – Block high-risk sites automatically.
Advanced ML-Based Phishing Detection – AI-powered phishing classification.
Custom User Settings – Allow users to adjust security sensitivity levels.
Why Use Adi’s Site Analyzer?
Protect yourself from phishing and unsafe sites with instant security feedback.
Fast and lightweight with real-time scanning and optimized performance.
Proactive warnings with alerts and notifications for dangerous sites.
Modern, professional UI with smooth animations and clear risk indicators.
License & Contribution
License: Open-source (MIT License)
Contributions: Open for enhancements and new feature additions.
Installation Guide
Download the extension from GitHub.
Open Chrome and go to chrome://extensions/.
Enable Developer Mode (toggle in the top-right corner).
Click "Load Unpacked" and select the project folder.
Pin the extension to Chrome for easy access.
