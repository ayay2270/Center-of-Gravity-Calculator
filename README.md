# Center of Gravity Calculator

桌面導向的 2D 重心 / 翻覆穩定性工程計算工具，用於快速評估機櫃與棧板系統向右側的靜態翻覆穩定性。

## Online Demo

**正式網址（Cloudflare Pages）：<https://center-of-gravity-calculator.pages.dev/>**

[開啟線上計算機](https://center-of-gravity-calculator.pages.dev/)

備用部署（GitHub Pages）：<https://ayay2270.github.io/Center-of-Gravity-Calculator/>

## 主要功能

- 2D SVG 側視工程圖：重心、重力線、支點與傾角即時更新；尺寸標註預設隱藏，展開計算過程時顯示。
- 棧板高度、棧板寬度、機櫃高度及目前傾角 θ 支援同步滑桿與數值輸入。
- 理論置中 / 手動重心模式；直接拖曳紅色 CG 點即可切換手動模式，雙向同步重心高度與左右偏移。
- CG 點可用方向鍵微調 1 mm，Shift + 方向鍵微調 10 mm。
- 世界座標鉛直重力線與固定的右下翻覆支點。
- 規格上限角度可精確編輯，預設 22.0°，範圍 1.0°–60.0°、步進 0.1°。
- 直立 0°、至規格上限、臨界角快速操作。
- 目前傾角、臨界角及規格上限以三個數字並列；目前姿態與規格檢核獨立判讀，另提供所需棧板寬度反算。
- 計算過程包含工程尺寸明細與六步水平公式卡片，可展開 / 收合，於目前工作階段保留收合狀態。

主要工作區以 1440 × 900 桌面視窗為目標，窄視窗可捲動操作。

## 工程計算

理論置中重心高度：

`Zcg = 機櫃高度 / 2 + 棧板高度`

右側翻覆時，重心至支點的水平距離：

`D = 棧板寬度 / 2 − Xcg`

臨界角：

`θc = tan⁻¹(D / Zcg)`

使用目前規格上限角度反算所需距離：

`Drequired = Zcg × tan(specLimitAngle)`

置中重心的精確所需棧板寬度：

`所需棧板寬度 = 2 × Zcg × tan(specLimitAngle)`

手動偏移時，所需半寬 `W = Drequired + Xcg`，精確全寬為 `2W`。此反算值對應臨界角恰為所選規格上限；半寬向上取整至 10 mm，再乘以 2。預設上限 22.0° 時，精確全寬約 1112.7 mm、工程取整值為 1120 mm。取整後臨界角會略高於規格上限。規格是否通過只比較目前傾角，不由這個取整寬度決定。

- Zcg 由地面起算，手動重心高度不再加上棧板高度。
- Xcg 正值表示向右、靠近右側支點；負值表示向左、遠離右側支點。
- 本工具進行靜態翻覆篩選，並非動態翻倒模擬；不包含滑動、變形或衝擊分析。圖中機櫃寬度按棧板寬度示意。
- 規格是否超過所選上限，與目前姿態是否達到物理翻覆臨界條件分開評估；需確認實際重心與支承條件。

## 驗證案例

| 項目 | 預設值 / 結果 |
| --- | --- |
| 棧板高度 | 153 mm |
| 棧板寬度 | 1092 mm |
| 機櫃高度 | 2448 mm |
| 重心模式 / Xcg | 理論置中 / 0 mm |
| 理論重心高度 Zcg | 1377 mm |
| 現有半寬 | 546 mm |
| 臨界角 θc | 約 21.6° |
| 規格上限 | 22.0° |
| 22° 上限餘量 | 約 +6.0° |
| 精確所需棧板寬度 | 約 1112.7 mm |
| 22° 工程建議棧板寬度 | 1120 mm |
| 目前傾角 / 目前狀態 | 16.0° / 仍穩定 |

## 規格上限與目前狀態

兩項檢核分開判讀：

1. **規格檢核**：目前傾角 θ ≤ 規格上限為通過。低於上限顯示綠色「符合規格」，相等同樣顯示綠色「符合規格」；θ > 規格上限顯示紅色「超過規格」。餘量 = 規格上限 − θ，正數表示尚有餘量，負數表示已超過上限。臨界角 θc 不決定這項檢核。
2. **目前狀態**：θ < θc 為綠色「未達臨界角」（仍穩定）；相等時為琥珀色「已達臨界角」；超過時為「已超過臨界角」。臨界比較使用小量容差處理浮點誤差。

例如上限 22.0°、θc = 21.6°、目前 θ = 16.0°，餘量為 +6.0°，表示目前傾角距離上限尚有 6.0°、符合規格，且目前姿態仍穩定。θ = 22.0° 時餘量為 0.0°，屬邊界 / 通過；θ = 22.4° 時餘量為 −0.4°，超過上限、不通過。θc 高於上限而目前 θ 仍低於上限時，規格檢核仍為通過。

手動案例 Zcg = 1262 mm、Xcg = +318 mm、目前 θ = 19.4°，臨界角約 10.2°：上限 22.0° 時規格餘量 +2.6°、符合規格，但目前傾角已超過臨界角。更改上限只更新規格檢核、餘量與寬度反算，不改變目前姿態或臨界角。

## 技術

- Vite
- React
- TypeScript
- SVG

## 本機開發

建議使用 Node.js 24。

```bash
npm ci
npm run dev
```

開發網址：<http://127.0.0.1:4527/>。

測試、建置及預覽：

```bash
npm test
npm run build
npm run preview
```

`npm test` 包含 24 項工程測試，涵蓋理論預設值、手動正負偏移、低於 / 等於 / 超過臨界角、目前傾角對規格上限的檢核、一小數角度比較、可調規格上限與邊界、寬度反算、支點座標轉換、數值顯示及無效輸入。`npm run build` 包含 TypeScript 檢查。

`tests/browser-qa.mjs` 提供 `runBrowserQA(tab)`，可搭配 Browser 工具的 tab API 驗證滑桿、數值輸入、CG 拖曳、模式切換、傾角、重力線、固定支點及計算面板收合。

`tests/revision-qa.mjs` 驗證多個傾角的箭頭與尺寸標註；`tests/spec-limit-qa.mjs` 驗證上限編輯、動態文字、狀態顏色、寬度與公式連動、快捷按鈕及草圖手動案例。

## 部署

本專案同時部署在兩個位置：Cloudflare Pages 為主要網址，GitHub Pages 為次要（備用）部署。

### Cloudflare Pages（主要）

正式網址：<https://center-of-gravity-calculator.pages.dev/>

使用 Cloudflare 傳統 Pages（Git 連線）部署，無需 wrangler 或額外設定檔。Cloudflare 儀表板設定如下：

| 項目 | 設定 |
| --- | --- |
| Framework preset | None（或 Vite） |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Production branch | `main` |

- 自動部署：推送（push）到 `main` 後，Cloudflare 會自動重新建置並部署；其他分支則產生預覽部署。
- Node 版本：專案根目錄的 `.node-version` 指定 Node 22。若建置因 Node 版本失敗，請在 Pages 專案的 **Settings → Variables and Secrets**（Production 與 Preview）新增環境變數 `NODE_VERSION=22`，再重新部署。
- Cloudflare 建置不會設定 `GITHUB_ACTIONS`，因此 Vite 使用 `/` 為 base，網站位於網域根目錄。

自訂網域（選用）：

1. 在 Cloudflare 儀表板開啟 **Workers & Pages**，選擇本專案。
2. 進入 **Custom domains** → **Set up a custom domain**。
3. 輸入網域（例如 `cog.example.com`）並依指示確認。若網域的 DNS 在 Cloudflare，會自動建立 CNAME 紀錄；若在其他 DNS 供應商，請手動新增 CNAME 指向 `center-of-gravity-calculator.pages.dev`。
4. 等待網域驗證與 SSL 憑證簽發完成後即可使用。

### GitHub Pages（次要）

備用網址：<https://ayay2270.github.io/Center-of-Gravity-Calculator/>

更新 `main` 後，GitHub Actions 會自動執行依賴安裝、工程測試及建置，再部署至 GitHub Pages；也可手動觸發 workflow。

部署設定位於 `.github/workflows/deploy-pages.yml`，Pages 來源為 **GitHub Actions**。本機開發、建置與預覽使用 `/`，Actions 建置使用 `/Center-of-Gravity-Calculator/`。

`/concept-e/`（Concept E 預覽）僅存在於 GitHub Pages，由該 workflow 組裝；Cloudflare Pages 不包含此路徑。
