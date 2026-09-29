# Vocab Trainer

A minimal iPhone-friendly vocabulary trainer built as a static PWA.

## What it does

- Shows one English word at a time with its frequency rank.
- Swipe left: **Known**.
- Swipe right: **Unknown**.
- Swipe up: **Unsure**.
- Long press: reveal the Japanese gloss.
- Study in frequency order or random order.
- Filter by learner-facing part of speech.
- Filter by saved review status: **All**, **Not reviewed**, **Know**, **Don't know**, **Unsure**, or **Don't know + Unsure**.
- Combine review status, part of speech, and frequency/random order freely.
- Review-status filters use the latest saved status for each word; changing a status during a session affects later sessions, not the already-built current queue.
- Import another CSV to replace the active vocabulary set.
- Export learning results as CSV.
- Restore an exported results CSV into the current browser/app storage without replacing vocabulary data.
- Saves vocabulary and review results locally in the browser.

## Default vocabulary

The bundled default set contains **2,809 NGSL words**.

The public distribution copy is stored as 29 CSV chunks under:

```text
data/chunks/001.csv
...
data/chunks/029.csv
```

`data-loader.js` presents those chunks to the app as one logical `data/NGSL.csv` dataset at runtime. The split is only a distribution implementation detail.

The durable source of truth for the vocabulary dataset remains in the private AIW repository:

```text
mak-ot-o/aiw
areas/english/vocabulary/ngsl/NGSL.csv
```

Changes to the vocabulary source should be made there first and then reflected into this public distribution repository.

### Learner-facing override layers

The source-backed NGSL rows are preserved for provenance. Learner-facing corrections are distributed as:

```text
data/NGSL_learner_overrides.csv
data/NGSL_source_conflict_resolutions_2026-09-12.csv
```

`learner-overrides.js` applies the general learner override first and the audited source-conflict resolution layer second when the default NGSL dataset loads. These layers can clarify the Japanese gloss and, where necessary, provide a single study part-of-speech category without rewriting the underlying source row.

The v2 audit contains **227 learner override entries**, including **45 explicit study-PoS selections**. A re-audit then checked those rows plus all known source-level PoS/definition conflicts and added a narrow 10-row conflict-resolution layer. Rank and headword identity are unchanged.

`data-version.js` provides a one-time client migration for the current learner-data version. Existing cached NGSL word metadata is refreshed, while the separate saved review-result store remains intact. Therefore existing **Know / Don't know / Unsure**, review timestamps, and review counts are preserved.

Result identity remains based on `rank::word`, so this migration does not reset learning history.

## Result backup and restore

**Export Results** writes a CSV containing `rank`, `word`, `japanese`, `status`, `last_reviewed`, and `review_count`.

**Restore Results** reads an exported results CSV and restores only review metadata into `vocabTrainer.results.v1`. It does not replace the current vocabulary dataset or learner-facing Japanese/PoS corrections. Imported rows are matched by `rank::word`; if a current result already exists, the newer `last_reviewed` status is kept and `review_count` is preserved at the larger value.

This is useful when Safari and an iOS Home Screen Web App have separate browser storage.

## CSV format

Required columns for vocabulary import:

```csv
rank,word,japanese
```

Optional column used by the built-in filter:

```csv
part_of_speech
```

The bundled NGSL source includes additional fields such as `definition` and `example`; the trainer only reads the fields it needs. The learner override layers are only applied to the bundled/default NGSL source, not to arbitrary manually imported CSVs.

## Run locally

Serve the repository with any static HTTP server and open `index.html`. Opening the file directly with `file://` is not recommended because browser fetch and service-worker behavior differs from a hosted site.

## iPhone

Open the GitHub Pages site in Safari, then use **Add to Home Screen** to install it like an app.

## Deployment

GitHub Pages deploys from the repository's `main` branch at the repository root.

Public URL:

`https://mak-ot-o.github.io/vocab-trainer/`

The repository rename to `mak-ot-o/vocab-trainer` was confirmed on 2026-09-03.

## Vocabulary attribution

Vocabulary data is based on the **New General Service List (NGSL)** by Charles Browne, Brent Culligan, and Joseph Phillips and is distributed under **CC BY-SA 4.0**. Japanese glosses and app formatting are adapted for this trainer.
