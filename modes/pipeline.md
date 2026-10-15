# Pipeline Mode — Batch Pipeline Processor

<!-- Read modes/_shared.md first. -->

**Execution:** Run sequentially in the current agent session. Save progress after each listing and give brief updates during long batches. Follow `AGENTS.md`; no background-agent feature is required.

---

## Overview

Processes all unchecked (`- [ ]`) entries in `data/pipeline.md`. For each entry: applies Phase 1 quick filter, routes qualified listings to full evaluation (rent or buy mode), and marks entries as done.

---

## Step 1: Read Pipeline

1. Read `data/pipeline.md`
2. Find all lines matching: `- [ ] {url} | {portal} | {district} | {type} | {price} | {size} | {layout}`
3. If no unchecked entries → output "Pipeline 已清空，無待處理物件。" and stop
4. Log count: "找到 {N} 個待評估物件。"

---

## Step 2: Process Each Entry

For each `- [ ]` entry, in order:

### 2a: Parse entry fields

| Field | From entry |
|-------|-----------|
| URL | First field |
| Portal | Second field |
| District | Third field |
| Type | Fourth field: `租` → rent, `買` → buy |
| Price | Fifth field |
| Size | Sixth field (坪, parse number) |
| Layout | Seventh field |

### 2b: Apply Phase 1 Quick Filter

Check against `config/profile.yml`. For rent listings check `budget.rent_max`, for buy listings check `budget.buy_max`.

| Check | Rule |
|-------|------|
| Price | Parsed price > budget ceiling → skip |
| Size | Parsed 坪數 < `property.size_min` → skip |
| Floor | If floor visible in entry or URL → check vs `property.floor_min` |
| Age | Usually not available at this stage — skip this check |

Check `modes/_profile.md` deal_breakers against the title/address fields.

**If any check fails:**
- Write a minimal TSV to `batch/tracker-additions/{num}-{slug}.tsv` with status `Skip`
- Run `node merge-tracker.mjs`; after successful merge, mark the entry `- [x] SKIP: {reason} — {url}`
- Continue to next entry

### 2c: Full Evaluation (if qualified)

Process all pending entries unless the user supplied a limit. Keep full reports in `reports/` and checkpoint after each listing.

Before Phase 2, follow `docs/browser.md` to open the actual listing and verify its content. Reapply the quick filter with current page data, including floor and age. For an explicit removal notice, mark `- [x] EXPIRED: {url}` and continue. If access is unconfirmed, keep the entry unchecked, note the reason in the summary, and continue to the next entry. If no browser is available at all, report the blocker and stop live evaluations.

**For rent listings:**
- Follow all steps in `modes/rent.md` Phase 2 (Sections 3–9)
- Write the full report to `reports/`
- Write TSV to `batch/tracker-additions/`

**For buy listings:**
- Follow all steps in `modes/buy.md` Phase 2 (Sections 3–11)
- Write the full report to `reports/`
- Write TSV to `batch/tracker-additions/`

**Verification:** Use `confirmed` only after reading the actual listing during this run. If the user provides listing text for an inaccessible page, evaluation may proceed with `unconfirmed (user-provided text)`. Never treat old pipeline metadata as fetched page content.

### 2d: Mark entry as done

After writing the report and TSV, run `node merge-tracker.mjs`. Only after a successful merge, replace `- [ ]` with `- [x]` for that line in `data/pipeline.md`. If merge fails, keep the entry unchecked, stop processing, and report the pending files. On resume, check for an existing report/TSV/tracker entry for the URL and recover that work before creating another evaluation.

---

## Step 3: Post-Processing

After all entries are processed:

1. **Run merge-tracker:**
   ```
   node merge-tracker.mjs
   ```
   This merges all newly written TSV files into `data/tracker.md`.

2. Run `node verify-pipeline.mjs`. Report any issues and remaining unchecked entries; do not claim the batch is complete if work is blocked or integrity validation fails.

3. **Output summary table:**

```
Pipeline 處理完成 — YYYY-MM-DD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
總共處理: N 個物件
  完整評估: N 個 (報告已生成)
  快篩略過: N 個 (SKIP)

新增至追蹤表:
  + {###} | {district} | {price} | {score}/5 | {status} | [報告連結](reports/{filename})
  ...

略過物件:
  - {url} — {reason}
  ...
```

**IMPORTANT — Human Review Output:**
After the summary table, always output a dedicated review section. For each qualified listing (score ≥ 3.5), output the full report content inline — do NOT use file links. The user reads everything in the conversation, not in files.

Format:

```
## 待人工審閱

| 優先 | 物件 | 坪數 | 月租/總價 | 一句話 | 分數 | 原始物件 |
|------|------|------|----------|--------|------|---------|
| ⭐⭐ | {district} {address} | {size}坪 | {price} | {one-line summary} | {score}/5 | [🔗 591]({listing_url}) |
| ⭐  | {district} {address} | {size}坪 | {price} | {one-line summary} | {score}/5 | [🔗 591]({listing_url}) |
...

---

### ⭐⭐ {###} {district} {address}
[🔗 591]({listing_url})

{full report content — all sections: 基本資料, 價格分析, 通勤評估, 生活機能, 物件條件, 風險與潛力, 評分, 建議}

---

### ⭐ {###} {district} {address}
[🔗 591]({listing_url})

{full report content}

---
...
```

Priority rules:
- ⭐⭐ = score ≥ 4.0 (推薦看屋)
- ⭐  = score 3.5–3.9 (持保留態度)
- Omit listings scored < 3.5 from this section entirely

---

## Notes

- **Order matters:** Process entries in the order they appear in pipeline.md (top to bottom).
- **Report numbering:** Each evaluation must check `reports/` for the current highest ### before writing, since earlier entries in the same batch will have incremented the counter.
- **Partial runs:** If the user interrupts mid-batch, already-checked entries (`- [x]`) will not be re-processed on the next run.
- **Error handling:** If a listing URL is unreachable or returns an error, leave it unchecked for retry, record the reason in the summary, and continue. Only explicit removal notices count as expiry.
