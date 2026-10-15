# AI Agent 瀏覽器與搜尋工具

## 選擇工具

掃描平台、讀取物件 URL 與確認上架狀態，需要能執行 JavaScript 的互動式瀏覽器。依目前 AI Agent 工作階段提供的能力選擇：

1. **已連接的瀏覽器工具**：使用工具提供的導覽、頁面內容讀取與互動功能，並遵循該工具或技能的操作指引。工具名稱依環境而異，不假設有特定 MCP 方法。
2. **`agent-browser` CLI**：沒有可用瀏覽器工具時，透過 AI Agent 的 shell 執行。先用 `command -v agent-browser` 確認已安裝。

各 mode 內的 `agent-browser` 範例代表導覽、讀取頁面、填表、點擊、換頁等操作；使用已連接的瀏覽器時，換成該工具對應的操作即可。

CLI 安裝方式（需先安裝 Node.js 與 npm，參考 [官方安裝文件](https://agent-browser.dev/installation)）：

```bash
npm install -g agent-browser
agent-browser install
agent-browser --version
```

基本操作：

```bash
agent-browser open 'https://rent.591.com.tw/'
agent-browser snapshot
agent-browser snapshot -i
```

完整 snapshot 用來讀取物件標題、價格、地址與描述；`-i` 用來取得可互動元素的參照。只使用當前頁面提供的參照進行操作，不猜測欄位或按鈕 ID。完整選項可查 `agent-browser --help` 或 [官方指令文件](https://agent-browser.dev/commands)。

## 上架狀態判定

- **confirmed**：已載入目標物件的標題、價格、描述及聯絡區塊，且無下架通知。記錄來源 URL 與查閱日期。
- **已下架**：頁面明確顯示物件已下架、已結束或不再提供。
- **unconfirmed**：無法載入、僅有頁首頁尾、登入限制、CAPTCHA、拒絕存取或網路錯誤。這些狀況不能單獨證明物件已下架；說明限制並保留待確認狀態。

搜尋結果頁的新物件可作為 scan 的候選清單；完整評估前仍需開啟個別物件頁。搜尋摘要、靜態 HTTP 回應與舊的 pipeline 欄位都不能替代上架驗證。

## 搜尋與缺少工具時的處理

使用目前可用的網頁搜尋工具做廣泛發掘與行情查詢，附上來源與日期。沒有搜尋工具時，仍可直接掃描已設定的平台，並在摘要註明未執行廣泛搜尋；不可宣稱涵蓋了未查詢的平台或行情。

沒有互動式瀏覽器時，停止即時掃描與 URL 驗證，說明如何連接工具或安裝 CLI。可以繼續比較既有報告、查看追蹤表，或評估使用者貼上的文字；文字評估須註明資料由使用者提供、上架狀態未確認。

AI Agent 的網路與檔案權限仍由工作階段設定控制。權限不足時走正常核准流程，不要求停用 sandbox。
