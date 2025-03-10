<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

// Log incoming request for debugging
file_put_contents("debug_log.txt", "Received Request: " . file_get_contents("php://input") . "\n", FILE_APPEND);

// Check if the request method is POST
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    die("Error: Only POST requests are allowed.");
}

// Get POST data
$data = file_get_contents("php://input");
parse_str($data, $post_vars);

// Log the parsed POST data
file_put_contents("debug_log.txt", "Parsed POST Data: " . print_r($post_vars, true) . "\n", FILE_APPEND);

// Check if "url" exists in the request
if (!isset($post_vars["url"]) || empty($post_vars["url"])) {
    die("Error: No URL provided.");
}

$url = trim($post_vars["url"]);

// Validate if URL is valid
if (!filter_var($url, FILTER_VALIDATE_URL)) {
    die("Error: Invalid URL format.");
}

// Check if the site is using HTTPS
if (strpos($url, "https://") !== 0) {
    echo "MALICIOUS"; // All HTTP sites are flagged
    exit;
}

// Blacklist check (example)
$blacklist = ["nceg.uop.edu.pk", "phishingsite.com", "malicious-example.com", "badwebsite.net"];
foreach ($blacklist as $badSite) {
    if (stripos($url, $badSite) !== false) {
        echo "MALICIOUS";
        exit;
    }
}

// Fetch website content
$html = @file_get_contents($url);

if ($html === false) {
    echo "MALICIOUS"; // If site cannot be fetched, mark it as unsafe
    exit;
}

// Simple check for phishing (example)
$phishing_keywords = ["free money", "urgent action", "password reset", "verify your account", "confirm your identity"];
$malicious = false;

foreach ($phishing_keywords as $keyword) {
    if (stripos($html, $keyword) !== false) {
        $malicious = true;
        break;
    }
}

// Return response
if ($malicious) {
    echo "MALICIOUS";
} else {
    echo "SAFE";
}

?>
