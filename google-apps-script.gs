/**
 * Google Apps Script Backend — Telegram Notification Service
 * For "A Little Something for You ❤️"
 *
 * REQUIRED SCRIPT PROPERTIES (Project Settings -> Script Properties):
 *   1. TELEGRAM_BOT_TOKEN : Your bot token from @BotFather
 *   2. TELEGRAM_CHAT_ID   : Your personal numeric Telegram Chat ID
 */

const BACKEND_CONFIG = {
  // Must match CONFIG.SHARED_CLIENT_TOKEN in script.js
  EXPECTED_CLIENT_TOKEN: "manali-chai-date-2026",

  // Duplicate / rate-limit protection windows (in seconds)
  DUPLICATE_SIGNATURE_TTL_SECONDS: 600, // 10 minutes for identical selection payload
  GLOBAL_COOLDOWN_SECONDS: 10,          // Minimum 10s gap between any two requests

  // Strict server-side allowlists
  ALLOWED_DAYS: ["Saturday", "Sunday"],
  ALLOWED_MEALS: ["Lunch", "Dinner", "Lunch date", "Dinner date"],
  ALLOWED_RESTAURANTS: [
    "Fifty Five East",
    "Celini",
    "Copper Chimney – BKC",
  ],
};

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({
        status: "error",
        message: "Empty request received.",
      });
    }

    // 1. Parse JSON body safely
    let data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return jsonResponse({
        status: "error",
        message: "Malformed JSON request.",
      });
    }

    // 2. Validate shared client token
    if (!data || data.token !== BACKEND_CONFIG.EXPECTED_CLIENT_TOKEN) {
      return jsonResponse({
        status: "error",
        message: "Unauthorized request token.",
      });
    }

    // 3. Server-side validation of selected day, meal, and restaurant
    const selectedDay = String(data.selectedDay || "").trim();
    const calendarDate = String(data.calendarDate || "").trim();
    const rawMeal = String(data.mealPreference || "").trim();
    const restaurantName = String(data.restaurantName || "").trim();
    const customNote = String(data.customNote || "").trim().slice(0, 300);
    const confirmedAtIST = String(
      data.confirmedAtIST ||
        Utilities.formatDate(new Date(), "Asia/Kolkata", "dd MMM yyyy, hh:mm a")
    )
      .trim()
      .slice(0, 80);

    if (BACKEND_CONFIG.ALLOWED_DAYS.indexOf(selectedDay) === -1) {
      return jsonResponse({
        status: "error",
        message: "Invalid day selection.",
      });
    }

    // Ensure calendarDate starts with the selected day and has a reasonable length
    if (
      !calendarDate ||
      calendarDate.length > 50 ||
      calendarDate.indexOf(selectedDay) !== 0
    ) {
      return jsonResponse({
        status: "error",
        message: "Invalid calendar date format.",
      });
    }

    if (BACKEND_CONFIG.ALLOWED_MEALS.indexOf(rawMeal) === -1) {
      return jsonResponse({
        status: "error",
        message: "Invalid meal selection.",
      });
    }

    if (BACKEND_CONFIG.ALLOWED_RESTAURANTS.indexOf(restaurantName) === -1) {
      return jsonResponse({
        status: "error",
        message: "Invalid restaurant selection.",
      });
    }

    // Normalize meal display ("Lunch" or "Dinner")
    const normalizedMeal = rawMeal.replace(/\s*date$/i, "");

    // 4. Duplicate & Burst Rate-Limiting via CacheService
    const cache = CacheService.getScriptCache();
    const signatureKey =
      "dup_" +
      Utilities.base64EncodeWebSafe(
        [selectedDay, calendarDate, normalizedMeal, restaurantName, customNote].join("|")
      ).slice(0, 120);

    if (cache.get(signatureKey)) {
      // Already delivered this exact confirmation recently; return success idempotently
      return jsonResponse({
        status: "success",
        message: "Confirmation already delivered.",
      });
    }

    if (cache.get("global_rate_limit_lock")) {
      return jsonResponse({
        status: "error",
        message: "Please wait a few seconds before submitting again.",
      });
    }

    // 5. Retrieve Telegram credentials from Script Properties
    const props = PropertiesService.getScriptProperties();
    const botToken = (props.getProperty("TELEGRAM_BOT_TOKEN") || "").trim();
    const chatId = (props.getProperty("TELEGRAM_CHAT_ID") || "").trim();

    if (!botToken || !chatId) {
      return jsonResponse({
        status: "error",
        message:
          "Server configuration incomplete (TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing in Script Properties).",
      });
    }

    // 6. Build the Telegram message
    const messageLines = [
      "❤️ Date plan confirmed!",
      "",
      "Date: " + calendarDate,
      "Meal: " + normalizedMeal,
      "Restaurant: " + restaurantName,
      "Timestamp: " + confirmedAtIST + " IST",
      "Status: Preferences confirmed",
    ];

    if (customNote) {
      messageLines.push("Note: " + customNote);
    }

    messageLines.push("");
    messageLines.push("Your date planner has received a new confirmation.");

    const telegramText = messageLines.join("\n");

    // 7. Call official Telegram Bot API
    const telegramUrl =
      "https://api.telegram.org/bot" + botToken + "/sendMessage";

    const telegramResponse = UrlFetchApp.fetch(telegramUrl, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({
        chat_id: chatId,
        text: telegramText,
      }),
      muteHttpExceptions: true,
    });

    const responseCode = telegramResponse.getResponseCode();
    const responseBody = JSON.parse(telegramResponse.getContentText() || "{}");

    if (responseCode !== 200 || !responseBody.ok) {
      console.error("Telegram API error:", responseBody);
      return jsonResponse({
        status: "error",
        message: "Telegram notification service returned an error. Please try again.",
      });
    }

    // 8. Lock cache keys after verified Telegram delivery
    cache.put(
      signatureKey,
      "sent",
      BACKEND_CONFIG.DUPLICATE_SIGNATURE_TTL_SECONDS
    );
    cache.put(
      "global_rate_limit_lock",
      "locked",
      BACKEND_CONFIG.GLOBAL_COOLDOWN_SECONDS
    );

    return jsonResponse({
      status: "success",
      message: "Telegram notification sent.",
    });
  } catch (err) {
    console.error("Unexpected doPost error:", err);
    return jsonResponse({
      status: "error",
      message: "Unexpected server error while sending notification.",
    });
  }
}

/**
 * Optional helper you can run once inside the Apps Script editor
 * to test your Bot Token and Chat ID directly before testing from the website.
 */
function testTelegramSetupManually() {
  const props = PropertiesService.getScriptProperties();
  const botToken = (props.getProperty("TELEGRAM_BOT_TOKEN") || "").trim();
  const chatId = (props.getProperty("TELEGRAM_CHAT_ID") || "").trim();

  if (!botToken || !chatId) {
    throw new Error(
      "Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in Project Settings -> Script Properties."
    );
  }

  const url = "https://api.telegram.org/bot" + botToken + "/sendMessage";
  const res = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      chat_id: chatId,
      text: "✅ Test successful! Your Google Apps Script is connected to Telegram.",
    }),
  });
  Logger.log(res.getContentText());
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}