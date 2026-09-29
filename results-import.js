(() => {
  "use strict";

  const RESULTS_KEY = "vocabTrainer.results.v1";
  const WORDS_KEY = "vocabTrainer.words.v1";
  const MESSAGE_KEY = "vocabTrainer.resultsImportMessage.v1";
  const VALID_STATUSES = new Set(["known", "unknown", "unsure"]);

  function normalizeHeader(value) {
    return String(value || "").trim().toLowerCase().replace(/^\ufeff/, "");
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;

    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      const next = text[i + 1];
      if (char === '"' && quoted && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === "," && !quoted) {
        row.push(cell);
        cell = "";
      } else if ((char === "\n" || char === "\r") && !quoted) {
        if (char === "\r" && next === "\n") i += 1;
        row.push(cell);
        if (row.some((value) => String(value).trim() !== "")) rows.push(row);
        row = [];
        cell = "";
      } else {
        cell += char;
      }
    }

    row.push(cell);
    if (row.some((value) => String(value).trim() !== "")) rows.push(row);
    return rows;
  }

  function parseStoredJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch {
      return fallback;
    }
  }

  function resultKey(rank, word) {
    return `${rank}::${String(word || "").trim().toLowerCase()}`;
  }

  function validWordKeys() {
    const words = parseStoredJson(WORDS_KEY, []);
    return new Set(words
      .filter((word) => Number.isFinite(Number(word.rank)) && String(word.word || "").trim())
      .map((word) => resultKey(Number(word.rank), word.word)));
  }

  function importResultsCsv(text) {
    const rows = parseCsv(text);
    if (rows.length < 2) throw new Error("Results CSV has no data rows.");

    const headers = rows[0].map(normalizeHeader);
    const rankIndex = headers.indexOf("rank");
    const wordIndex = headers.indexOf("word");
    const statusIndex = headers.indexOf("status");
    const lastReviewedIndex = headers.indexOf("last_reviewed");
    const reviewCountIndex = headers.indexOf("review_count");

    if (rankIndex < 0 || wordIndex < 0 || statusIndex < 0) {
      throw new Error("Results CSV must contain rank, word, and status columns.");
    }

    const currentResults = parseStoredJson(RESULTS_KEY, {});
    const allowedKeys = validWordKeys();
    const checkWordKeys = allowedKeys.size > 0;
    let imported = 0;
    let skipped = 0;

    for (const row of rows.slice(1)) {
      const rank = Number.parseInt(String(row[rankIndex] || "").trim(), 10);
      const word = String(row[wordIndex] || "").trim();
      const status = String(row[statusIndex] || "").trim().toLowerCase();

      if (!Number.isFinite(rank) || !word || !status) continue;
      if (!VALID_STATUSES.has(status)) {
        skipped += 1;
        continue;
      }

      const key = resultKey(rank, word);
      if (checkWordKeys && !allowedKeys.has(key)) {
        skipped += 1;
        continue;
      }

      const importedLastReviewed = lastReviewedIndex >= 0
        ? String(row[lastReviewedIndex] || "").trim()
        : "";
      const importedReviewCount = reviewCountIndex >= 0
        ? Math.max(1, Number.parseInt(String(row[reviewCountIndex] || "1").trim(), 10) || 1)
        : 1;
      const existing = currentResults[key] || null;

      if (!existing) {
        currentResults[key] = {
          status,
          last_reviewed: importedLastReviewed,
          review_count: importedReviewCount
        };
        imported += 1;
        continue;
      }

      const importedTime = Date.parse(importedLastReviewed) || 0;
      const existingTime = Date.parse(existing.last_reviewed || "") || 0;
      const mergedReviewCount = Math.max(Number(existing.review_count || 0), importedReviewCount);

      if (importedTime >= existingTime) {
        currentResults[key] = {
          status,
          last_reviewed: importedLastReviewed || existing.last_reviewed || "",
          review_count: mergedReviewCount
        };
      } else {
        currentResults[key] = {
          ...existing,
          review_count: mergedReviewCount
        };
      }
      imported += 1;
    }

    if (!imported) throw new Error("No reviewed results were found to restore.");
    localStorage.setItem(RESULTS_KEY, JSON.stringify(currentResults));
    return { imported, skipped };
  }

  async function restoreFromFile(file) {
    if (!file) return;
    const input = document.getElementById("resultsInput");
    const message = document.getElementById("setupMessage");
    try {
      const text = await file.text();
      const { imported, skipped } = importResultsCsv(text);
      const suffix = skipped ? ` (${skipped} incompatible rows skipped)` : "";
      sessionStorage.setItem(MESSAGE_KEY, `Restored ${imported} reviewed results from ${file.name}.${suffix}`);
      window.location.reload();
    } catch (error) {
      if (message) message.textContent = error instanceof Error ? error.message : "Could not restore results.";
    } finally {
      if (input) input.value = "";
    }
  }

  const input = document.getElementById("resultsInput");
  if (input) {
    input.addEventListener("change", (event) => restoreFromFile(event.target.files?.[0]));
  }

  const restoredMessage = sessionStorage.getItem(MESSAGE_KEY);
  if (restoredMessage) {
    sessionStorage.removeItem(MESSAGE_KEY);
    window.setTimeout(() => {
      const message = document.getElementById("setupMessage");
      if (message) message.textContent = restoredMessage;
    }, 0);
  }
})();
