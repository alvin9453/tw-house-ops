# tw-house-ops

台灣看房 AI 管線，透過 `AGENTS.md` 提供跨工具的 AI Agent 工作流程。自動化物件發掘、評估與追蹤，涵蓋租屋與購屋市場的完整搜尋流程。

支援三種使用者類型：**租屋族**、**首購族**、**換屋族**。

> Inspired by [santifer/career-ops](https://github.com/santifer/career-ops) — same ops-style approach, applied to 台灣租屋 & 購屋.

![物件追蹤表](demo-images/tracker-demo.png)

---

## 功能概覽

- **掃描** 591、樂屋網、信義、永慶、東森、住商，搜尋符合條件的新物件
- **評估** 每間物件：與市場行情（實價登錄）比較、通勤計算、五維度評分
- **追蹤** 所有考慮過的物件，以結構化 Markdown 表格記錄
- **試算** 可負擔房價（首購族）與換屋財務規劃（換屋族）
- **準備** 根據評估報告產生看屋清單與議價策略

---

## 事前準備

使用支援 `AGENTS.md` 的 AI Agent 開啟此專案，並安裝 **Node.js 22+**（附 npm）。維護腳本只使用 Node.js 內建模組，不需執行 `npm install` 安裝專案依賴。

掃描（`scan`）與物件上架驗證需要互動式瀏覽器：可使用 AI Agent 工作階段已連接的瀏覽器工具，或安裝 `agent-browser` CLI：

```bash
npm install -g agent-browser
agent-browser install
```

確認安裝成功：

```bash
agent-browser --version
```

工具選擇、安裝與上架驗證規則見 [瀏覽器設定](docs/browser.md)。沒有互動式瀏覽器時，AI Agent 會說明無法執行即時掃描或 URL 驗證；仍可比較既有報告、查閱追蹤表，或評估你貼上的物件文字。

---

## 快速開始

1. Clone 此 repo，使用支援 `AGENTS.md` 的 AI Agent 開啟專案資料夾。
2. AI Agent 透過根目錄的 [`AGENTS.md`](AGENTS.md) 讀取專案規則與模式路由；若工具未自動載入，請先要求它讀取該檔案。
3. 輸入「幫我設定找房條件」。AI Agent 會讀取找房流程，詢問尚未提供的條件，建立缺少的個人設定檔（約 5 分鐘）；既有設定與紀錄會保留。
4. 確認互動式瀏覽器可用後，貼上物件 URL 即可評估，或輸入 `scan` 搜尋目標區域。

`scan`、`pipeline` 等文字是在 AI Agent 對話中輸入的需求，不是終端機指令或需要安裝的 slash command。直接要求修改程式、測試或文件時，AI Agent 會處理開發工作，不會要求先填找房資料。

---

## 用法

| 輸入 | 動作 |
|------|------|
| 貼上物件 URL | 自動判斷租屋 / 買屋 → 評估 → 產生報告 |
| `scan` | 在目標區域掃描各平台的新物件 |
| `pipeline` | 批次處理 `data/pipeline.md` 中所有待評估 URL |
| `compare 001, 003` | 並列比較兩間已評估物件 |
| `prepare visit for 001` | 產生報告 001 的看屋清單與議價策略 |
| `affordability` | 試算可負擔房價與區域適配（首購族） |
| `upgrade plan` | 換屋財務規劃：賣舊屋 + 買新房時程與資金缺口分析（換屋族） |
| `tracker` | 顯示所有追蹤物件的摘要 |

---

## Demo

### Pipeline 批次評估輸出

批次跑完後自動輸出摘要表 + 本輪最佳推薦，每筆附原始連結供人工覆核。

![Pipeline 處理摘要](demo-images/pipeline-summary-demo.png)

### 物件評估報告

每間物件產出完整報告：價格分析（含實價登錄比對）、通勤試算、五維度評分、疑點清單、看屋問題清單。

![報告詳細內容 1](demo-images/report-details-1.png)

![報告詳細內容 2](demo-images/report-details-2.png)

![報告詳細內容 3](demo-images/report-details-3.png)

---

## 目錄結構

```
tw-house-ops/
├── AGENTS.md                    # AI Agent 入口：任務路由、工具與資料規則
├── docs/
│   ├── house-hunting.md         # 初始設定、評估流程、資料合約
│   ├── browser.md               # 瀏覽器設定與上架驗證
│   └── superpowers/             # 歷史設計與實作計畫（已封存）
├── config/
│   ├── profile.yml              # 個人設定（永遠不會被系統更新覆寫）
│   └── profile.example.yml      # 設定範本
├── portals.yml                  # 各平台 URL 與掃描設定
├── modes/
│   ├── _shared.md               # 評分維度、台灣市場知識
│   ├── _profile.md              # 個人情境（每次評估都會注入）
│   ├── _profile.template.md     # _profile.md 的初始範本
│   ├── scan.md                  # 平台掃描器
│   ├── rent.md                  # 租屋評估
│   ├── buy.md                   # 購屋評估
│   ├── afford.md                # 可負擔房價試算
│   ├── switch.md                # 換屋規劃
│   ├── compare.md               # 多物件比較
│   ├── visit.md                 # 看屋清單與看後記錄
│   └── pipeline.md              # 批次評估處理器
├── data/
│   ├── pipeline.md              # 待評估 URL 收件匣
│   ├── tracker.md               # 物件追蹤主表
│   └── scan-history.tsv         # 去重紀錄（已加入 .gitignore）
├── reports/                     # 各物件評估報告
├── batch/tracker-additions/     # 待合併 TSV 暫存
├── templates/states.yml         # 追蹤表狀態標準值
├── merge-tracker.mjs            # 合併 TSV 至 tracker.md
├── verify-pipeline.mjs          # 驗證 pipeline 完整性
└── dedup-tracker.mjs            # 移除重複的追蹤條目
```

---

## 評分標準

物件依五個維度評分 0–5：

| 維度 | 租屋權重 | 買屋權重 |
|------|----------|----------|
| 價格合理性 | 30% | 35% |
| 空間與格局 | 20% | 20% |
| 區域生活機能 | 25% | 20% |
| 物件條件 | 15% | 15% |
| 風險與潛力 | 10% | 10% |

分數判讀：≥4.0 → 推薦看屋　·　3.5–3.9 → 持保留態度　·　<3.5 → 建議跳過

---

## 追蹤表狀態

`Scanned` → `Evaluated` → `Visit` → `Visited` → `Offer` → `Negotiating` → `Signed` → `Done`

另有：`Skip`（篩除）、`Pass`（看後放棄）、`Expired`（物件已下架）

---

## 資料合約

**使用者層**（永遠不會被自動覆寫）：`config/profile.yml`、`portals.yml`、`modes/_profile.md`、`data/*`、`reports/*`、`output/*`。個人設定檔已加入 `.gitignore`；追蹤表與報告仍由使用者決定是否提交至 Git。

**系統層**（可能隨系統更新）：`AGENTS.md`、工作流程文件、除 `modes/_profile.md` 外的 mode 檔案、`*.mjs` 腳本、`templates/*`。

---

## 腳本

```bash
node merge-tracker.mjs           # 合併待新增 TSV 至 tracker.md
node verify-pipeline.mjs         # 檢查 pipeline 完整性
node dedup-tracker.mjs           # 移除重複追蹤條目
node --test tests/**/*.test.mjs  # 執行所有測試
```

---

## 使用原則

本系統以精準找房為目標，非大量瀏覽。AI Agent 可以準備 offer、合約與申請草稿；送出或簽署前，必須經過你審閱並明確核准。評分低於 3.5/5 的物件將被明確建議不值得追蹤。

---

## 支持這個專案

如果這個工具對你的找房過程有幫助，歡迎請我喝杯咖啡 ☕

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/kylinwin)
