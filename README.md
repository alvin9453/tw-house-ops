# tw-house-ops

台灣租屋與購屋的 AI Agent 工作流程，協助搜尋物件、整理評估報告、比較條件與追蹤看屋進度。

專案以 [`AGENTS.md`](AGENTS.md) 作為共用指引入口，搭配 Markdown 工作流程、YAML 設定與 Node.js 維護腳本。可使用支援 `AGENTS.md` 的 AI Agent；實際可執行的搜尋與瀏覽功能，依所用工具和工作階段權限而定。

支援三種使用者類型：**租屋族**、**首購族**、**換屋族**。

本專案修改自 [kylinfish/tw-house-ops](https://github.com/kylinfish/tw-house-ops)，將 Agent 指引整理為 `AGENTS.md`，並保留原有找房流程。原始專案靈感來自 [santifer/career-ops](https://github.com/santifer/career-ops)。

![物件追蹤表](demo-images/tracker-demo.png)

---

## 功能概覽

- **掃描** 依設定瀏覽 591、樂屋網、信義、永慶、東森、住商等平台，整理候選物件
- **評估** 物件價格、格局、交通與風險，參考可取得的實價登錄資料，給出五維度評分
- **追蹤** 所有考慮過的物件，以結構化 Markdown 表格記錄
- **試算** 可負擔房價（首購族）與換屋財務規劃（換屋族）
- **準備** 根據評估報告產生看屋清單與議價策略

---

## 事前準備

準備可讀取專案檔案的 AI Agent，以及 **Node.js 22+**（附 npm）。維護腳本只使用 Node.js 內建模組，不需另外安裝專案依賴。

掃描（`scan`）與物件上架驗證需要能執行 JavaScript 的互動式瀏覽器。若 Agent 已有可用的瀏覽器工具，可直接使用；需要透過 CLI 操作時，可安裝 `agent-browser`：

```bash
npm install -g agent-browser
agent-browser install
```

確認安裝成功：

```bash
agent-browser --version
```

工具選擇、安裝與上架驗證規則見 [瀏覽器設定](docs/browser.md)。沒有互動式瀏覽器時，仍可比較既有報告、查閱追蹤表，或評估你貼上的物件文字；即時掃描與上架驗證則需完成瀏覽器設定。

---

## 快速開始

1. Clone 此 repo，讓 AI Agent 開啟專案資料夾。
2. 確認 Agent 已讀取根目錄的 [`AGENTS.md`](AGENTS.md)；若工具未自動載入，請先要求它讀取該檔案。
3. 輸入「幫我設定找房條件」。Agent 會詢問找房目標、區域、預算與通勤等條件，建立缺少的個人設定檔；既有設定與紀錄會保留。
4. 確認互動式瀏覽器可用後，貼上物件 URL 即可評估，或輸入 `scan` 搜尋目標區域。

`scan`、`pipeline` 等文字請輸入於 Agent 對話，作為選擇工作流程的自然語言需求。終端機維護指令列在下方的「腳本」段落。修改程式、測試或文件可直接提出，不需要先設定找房條件。

詳細操作範例見 [使用教學](TUTORIAL.md)，設定與資料處理規則見 [找房工作流程](docs/house-hunting.md)。

---

## 用法

| 輸入 | 動作 |
|------|------|
| 幫我設定／更新找房條件 | 建立或調整個人設定 |
| 貼上物件 URL | 確認上架狀態 → 判斷租屋 / 買屋 → 快篩 → 評估與產生報告 |
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

Agent 依序處理待辦物件，保存報告與追蹤紀錄後，輸出摘要及達到評分門檻的物件，每筆附原始連結供人工覆核。無法確認上架狀態的 URL 會保留待重試。

![Pipeline 處理摘要](demo-images/pipeline-summary-demo.png)

### 物件評估報告

通過快篩的物件會產出完整報告：價格分析、通勤試算、五維度評分、疑點清單與看屋問題清單；購屋報告另含貸款試算。行情或物件資料不足時，報告會註明缺口。

購屋報告也可匯出成「每個物件一份 HTML ＋互動總覽」：物件與各主題預設收合，點擊即可展開，並支援搜尋、評分篩選、排序與列印。使用方式與檔案保留規則見 [HTML 報告說明](docs/html-reports.md)。

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
│   ├── profile.yml              # 初始設定時建立的個人條件（Git 忽略）
│   └── profile.example.yml      # 設定範本
├── portals.example.yml          # 平台設定範本
├── portals.yml                  # 個人平台與掃描設定（Git 忽略）
├── modes/
│   ├── _shared.md               # 評分維度、台灣市場知識
│   ├── _profile.md              # 評估時讀取的個人情境（Git 忽略）
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
├── output/                      # 掃描摘要與匯出檔案（Git 忽略）
├── batch/tracker-additions/     # 待合併 TSV 暫存
├── templates/states.yml         # 追蹤表狀態標準值
├── merge-tracker.mjs            # 合併 TSV 至 tracker.md
├── verify-pipeline.mjs          # 驗證 pipeline 完整性
├── dedup-tracker.mjs            # 移除重複的追蹤條目
├── render-pipeline-html.mjs     # 購屋報告轉 HTML 與互動總覽
└── package.json                 # 腳本與測試入口
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

**使用者層**：`config/profile.yml`、`portals.yml`、`modes/_profile.md`、`data/*`、`reports/*`、`output/*`。初始設定只建立缺少的檔案，更新工作流程時保留既有資料；找房過程會依你的指示更新條件與紀錄。

個人設定、掃描歷史與 `output/` 產出已加入 `.gitignore`。`data/pipeline.md`、`data/tracker.md` 與 `reports/` 仍可納入版本控制，由使用者決定是否提交。

**系統層**（可能隨系統更新）：`AGENTS.md`、工作流程文件、除 `modes/_profile.md` 外的 mode 檔案、`*.mjs` 腳本、`templates/*`。

---

## 腳本

```bash
node merge-tracker.mjs           # 合併待新增 TSV 至 tracker.md
node verify-pipeline.mjs         # 檢查 pipeline 完整性
node dedup-tracker.mjs           # 移除重複追蹤條目
node render-pipeline-html.mjs YYYY-MM-DD  # 匯出該日購屋評估的 HTML
npm test                        # 執行所有測試
```

`merge-tracker.mjs` 與 `dedup-tracker.mjs` 會修改追蹤資料；`verify-pipeline.mjs` 為唯讀檢查。

---

## 使用原則

本系統以精準找房為目標，非大量瀏覽。AI Agent 可以準備 offer、合約與申請草稿；送出或簽署前，必須經過你審閱並明確核准。評分低於 3.5/5 的物件將被明確建議不值得追蹤。

---

## 支持原作者

如果原始專案對你的找房過程有幫助，可以透過原作者提供的 Ko-fi 連結支持開發 ☕

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/kylinwin)
