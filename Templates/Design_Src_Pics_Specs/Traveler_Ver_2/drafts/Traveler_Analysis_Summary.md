# Traveler 統整分析報告

> 基於 Traveler_Ver_2 資料夾之 4 份業界模板（Codeware Shop Traveler、AK Company Safety Critical Traveler、複合型 Routing Sheet ×2）、4 份 Xometry Traveler（Admin 版 ×2 + Shop 版 ×2），以及 InstaVoxel 既有 P1–P6 設計（Traveler_Design_Draft.md）所做的交叉分析。

---

## 一、Traveler 的定義與 InstaVoxel 的定位差異

### 業界通用 Traveler（Shop Traveler / Job Traveler / Routing Sheet）

一份實體或電子文件，**跟著工件在工廠內移動**，每經過一道工序就由對應操作員簽名並記錄結果。核心功能是：

- **路由（Routing）**：按順序列出製造工序（下料→粗加工→精加工→熱處理→表處→檢驗→包裝）
- **追溯（Traceability）**：每道工序誰做的、什麼時間、結果為何
- **品質閘門（Hold Points）**：特定工序必須 QC 簽放才能進入下一站
- **ECO 追蹤**：工程變更紀錄（Plan Rev、Description of Change、Revised by）

### Xometry 的 Traveler 模式（與 InstaVoxel 最接近）

Xometry 是「平台媒合客戶＋外包工廠」的 Job Shop，**不做路由管理**。其 Traveler 實際上是「工單（Work Order）」：

- **Admin 版**：給 Xometry 內部用，含客戶名、合約夥伴、PSS/Quality Score
- **Shop 版**：給外包工廠用，**刪除客戶身分、刪除合作夥伴評分**（資訊隔離／保護客戶關係）
- 兩版共通：Part ID、Part Name、Quantity、Material、Finish、Due Date、Inspection Requirement、Features、Notes

### InstaVoxel 的定位

InstaVoxel **與 Xometry 模式幾乎完全對應** — 不是傳統製造廠 Traveler，而是「外包委製工單＋內部驗收記錄」的合體：

| 功能 | InstaVoxel 頁面 | 對應業界模板 |
|------|-----------------|-------------|
| 內部訂單建單（PM 交辦內容給 QC/工程） | P1 | Xometry Admin |
| 工廠工單（指示工廠做什麼） | P2（工廠 BOM） | Xometry Shop |
| 客戶圖紙（製作依據） | P3 | 隨附圖紙 |
| 來料品檢 + 包裝 Checklist | P4 | Codeware Shop Traveler 的 Inspection 欄 |
| 供應商驗收卡 | P5 | Receiving Inspection Record |
| 尺寸量測記錄 | P6 | Dimensional Inspection Report |

---

## 二、主要使用情境

### 情境 A：下單給工廠
- **誰**：PM（業務/專案經理）
- **何時**：客戶確認 Quotation 後、PO 發送前
- **做什麼**：從系統資料（Quote + BOM）產生 P1（內部 brief）與 P2（工廠工單），連同 P3（客戶圖紙）一起交付工廠
- **目的**：讓工廠明確知道要做哪個 Part、數量、材料、表處、公差、交期、需附的材料證明

### 情境 B：內部工程/QC 預審
- **誰**：工程師、QC
- **何時**：P1 產出後、發給工廠前
- **做什麼**：工程師用 P3（客戶圖紙）比對 3D 模型，確認無衝突；QC/工程在 P1「授權欄」簽核
- **目的**：預防圖紙與 3D 不一致、規格遺漏，發現問題回頭改單

### 情境 C：工廠製作與回傳
- **誰**：外部工廠
- **何時**：收到 P1+P2+P3 後 → 製作 → 出貨
- **做什麼**：按 P2 工單製作，依 P3 圖紙確認幾何／公差，附材料證書（若有要求），送貨時附 P5（供應商驗收卡）
- **目的**：製作符合規格的工件並送回艾維

### 情境 D：來料驗收
- **誰**：QC（Sylvia 等）
- **何時**：工廠送貨到艾維
- **做什麼**：簽收 → 填 P5（供應商驗收卡：合格/不合格、缺料） → 工程師以 P6（獨立列印的圖紙）實測每個尺寸 → QC 按 P4 checklist 完成品檢與包裝
- **目的**：篩出不合格品、記錄尺寸合格性、依 SOP-1004/1006/1011 完成包裝標籤

### 情境 E：出貨給客戶
- **誰**：QC / 業務
- **何時**：P4 checklist 全數完成後
- **做什麼**：依 P4「外箱包裝」段記錄 DHL 提單與箱體資訊，準備 Packing Slip + CoC
- **目的**：成品發貨給客戶，並提供品質符合性文件

### 情境 F（未來擴展）：客訴追溯
- **誰**：QC 主管、業務、客戶
- **何時**：客戶回報品質問題
- **做什麼**：從 P6 量測記錄 + P4 品檢簽名 + P5 收料記錄，追溯製作批次與驗收當下的狀態
- **目的**：釐清問題責任歸屬（工廠瑕疵？運輸損壞？驗收失誤？）

---

## 三、使用者與各自目的

| 使用者 | 在 Traveler 上的任務 | 最在意什麼 |
|--------|--------------------|----------|
| **PM / 業務** | 建立 P1/P2，指定零件規格與交期 | 規格完整、交期準確、避免遺漏材料證書等客戶特殊要求 |
| **工程師** | P3 圖紙比對；P6 尺寸量測 | 3D 與圖紙一致、公差落在範圍內、量測過程有記錄 |
| **QC（Sylvia 等）** | P4 品檢＋包裝 checklist；P5 收料驗收 | 每個步驟都檢查到、NG 品有標註、拍照完整、DHL 資訊正確 |
| **QC 主管 / 管理層** | 審核所有簽名、追蹤問題批次 | 每個環節都有問責簽名與日期 |
| **外部工廠** | 依 P2 工單製作，簽回 P5 | 規格清楚（一眼找得到材料、公差、表處）、聯絡窗口明確 |
| **客戶（間接受眾）** | 從最終成品與 CoC/Packing Slip 感受品質 | 不會直接看到 Traveler，但 Traveler 的完善度決定收到的成品品質 |

---

## 四、各來源 Traveler 之欄位聯集

### A. 業界通用 Traveler（Codeware、AK Company、Routing Sheets）共通欄位

**頁首／識別**
- Job Number / Work Order Number
- Serial Number（產品序號 — 安全關鍵件必備）
- Part Number / Part Name / Revision
- Customer / Contact
- Ship To（地址、City、State、Zip）
- Drawing Number / Drawing Revision
- Order Date / Due Date
- P.O. Number

**數量／進度**
- QTY REQ（要求數量）
- QTY RUNNING（加工中）
- QTY COMPLETE（完成數量）

**規格**
- Material / Material Spec
- Finish / Surface Treatment
- Tolerance Class
- Inspection Requirement / Inspection Level
- Certifications（材料證書、FAI、CoC 要求）

**工序路由（InstaVoxel 不涉及內部工序，但工廠可能有）**
- Operation Sequence（下料→粗銑→鑽孔→熱處理→精銑→表處→檢驗→包裝）
- Work Center / Machine
- Operator Initial + Date（每道工序）
- Hold Point / Inspection Point 標記（H / I）
- QC Accepted + Date（閘門簽放）

**工程變更（ECO）**
- Plan Revision
- Description of Change
- Change Date
- Revised By
- Admin Approval

**包裝／出貨**
- Ship Method / Carrier
- Tracking Number
- Package Dimensions / Weight

**簽名區**
- Prepared By / Reviewed By / Approved By / Inspected By
- 每個簽名 + Initial + Date

### B. Xometry Traveler 特有欄位

**Admin 版獨有（Shop 版隱藏）**
- Customer Name
- Partner（合作工廠名稱）
- PSS / Quality Score（工廠評分）
- Shipping Instructions（含收件人 Attn）
- Previous Orders（該客戶歷史訂單數）
- Date Ordered（含時間戳）

**兩版共通**
- Order ID（Admin）／Purchase Order（Shop）
- Part ID（Customer Part ID / Internal Part ID 雙 ID）
- Part Name（檔案名稱如 .stp / .SLDPRT）
- Drawing #
- Quantity / Material / Finish / Blank Size
- Due Date / Shipping Method / Carrier
- Inspection Requirement
- Certifications
- **Features（列點）**：Threads/Tapped Holes, Tolerances（precision +/-.001", 3 locations）, Surface Roughness, Part Markings
- **Notes（自由文字，多段）**：MATERIAL NOTES / MACHINING NOTES / INSPECTION NOTES / PART MARKING NOTES / SHIPPING NOTES / CONTACT REFERENCES

### C. InstaVoxel 現有 P1–P6 欄位（Traveler_Design_Draft.md）

**P1（Order Brief）**
- 訂單編號、案名、授權欄（預習/預習複查/質檢/質檢複查 + 日期）
- 交期三段（台灣工廠交貨 / 台灣最晚 DHL / 美國最終交期）
- 零件種類及件數、材料要求、公差要求、表粗要求、檢測要求
- Per-part 特殊要求表
- Standard Requirements（固定 4 條）
- Special Actions（螺紋拍照、朋友工廠 checkbox）

**P2（Factory Work Order）**
- Part No.、3D 圖、尺寸、重量、製程、材料、表面、檔名、備註、QTY
- 供應商簽收欄

**P3（Customer Drawing）**
- 客戶圖紙原樣
- 3D 比對記錄（版本、GD&T 基準面、差異備註、工程師簽名+日期）

**P4（QC & Packing Checklist）**
- 案名、填表人、填表日期
- 品檢 SOP-1004（Asana 收貨、材質確認、外觀 8 子項、螺紋、尺寸量測、清潔、拍照 4 子項）
- 包裝 SOP-1006 & 1011（巡查表、NG 標註、獨立包裝、氣球圖/CMM、標籤、內箱、外箱、DHL）
- 分段簽名（品檢完成 / 包裝完成）
- 包裝資訊（外箱/內箱尺寸、重量、材質、單件尺寸分類）

**P5（Supplier Acceptance Card）**
- 供應商、訂單號、名稱、訂單數量、預計交貨日
- 合格/不合格 + 不合格原因
- 檢驗數、QC、檢驗日
- 缺貨狀況 + 缺料說明

**P6（Dimensional Inspection）**
- 案名、Part No.、量測人員、量測日期
- 客戶圖紙（手寫實測值）
- Pass/Fail、超差尺寸記錄、量測工具、環境溫度、簽名

---

## 五、InstaVoxel Context 中實際需要的資料欄位

> 取三方欄位聯集，再以「InstaVoxel 外包 Job Shop + 跨國出貨（台灣→美國）」情境過濾。

### 1. 文件識別（Document Header）
- **文件類型** — Order Brief / Factory Work Order / QC Checklist …
- **訂單編號（orderId / quoteId）** — 如 U26033148F_REV-1（承襲 Quote ID）
- **Part No.** — 如 噴火槍_P01（案名_PXX）
- **文件版本 / Revision** — P1/P2 若修訂需 Rev 編號
- **產出日期 / Issued Date**

### 2. 當事方（Parties — 依版本露出不同資訊）
- **Internal 版**：客戶名稱、客戶聯絡人、工廠名稱、業務 PM、QC 人員
- **Factory 版（= Xometry Shop 概念）**：**隱藏客戶名**，只保留艾維身分 + Part 資訊 + 工廠聯絡
- **艾維公司識別**：艾維數位工業有限公司、地址、Email、電話

### 3. 時程（Schedule — InstaVoxel 特有三段）
- **台灣工廠交貨日** — 工廠送到艾維的日期
- **台灣最晚 DHL 日** — 艾維發 DHL 的最晚日
- **美國最終交期** — 客戶收到的日期
- 三段之間的 buffer 天數（供 PM 算逆推）

### 4. 零件規格（Per Part）
- **Part No.**（artId 如 噴火槍_P01）
- **Part Name / 檔名**（.stp / .step / .sldprt 原始檔名）
- **Drawing #**（客戶圖紙編號；若有 Internal Drawing 則雙 ID）
- **Drawing Revision**
- **3D Thumbnail**（渲染圖）
- **Dimensions**（L × W × H mm）、**Weight**（kg / g）
- **Quantity**（本訂單數量）
- **Material**（如「低碳鋼 S15C」、「Aluminum 6061-T6」）
- **Finish / 表面處理**（陽極、噴砂、無…）
- **Blank Size**（毛胚尺寸，若指定）
- **Process / 製程**（CNC 金屬、鈑金、3D 列印…）

### 5. 公差與特徵（Features — 給工廠看的重點）
- **整體公差等級**（如「未指定處 ±0.005" / ±0.127mm」）
- **Precision Tolerances** — 點位式：「±0.001"，3 處」+ 圖面位置標註
- **Surface Roughness** — 「16 μin / 0.4 μm Ra，整件」或局部
- **Threads / Tapped Holes** — 規格（2A/2B, 6g/6H）+ 數量
- **Part Markings** — 標記方式（雷射、打印）、內容（客戶 PN + Rev）
- **GD&T 基準面** — 確認項

### 6. 檢測／認證需求（Certifications & Inspection）
- **Inspection Level** — Standard / Formal Inspection with Dimensional Report / CMM Report / FAI
- **Certifications** — Material Cert（英文版）、CoC、RoHS、Heat Treatment Cert
- **Part Markings Requirement** — Bag and Tag、雷射標
- **Packaging Requirement** — 獨立包裝、氣泡膜、防銹油

### 7. 特殊備註（Notes — 多段分類）
- **MATERIAL NOTES** — 材質特殊要求（如指定批次、供應商）
- **MACHINING NOTES** — 加工備註（「若公差有衝突，先聯絡艾維」）
- **INSPECTION NOTES** — 量測方式、VQC
- **PART MARKING NOTES** — 標記細節
- **SHIPPING NOTES** — 出貨包裝、防損
- **CONTACT REFERENCES** — 一般問題聯絡 Email、品檢聯絡、出貨聯絡

### 8. 標準規定（Standard Requirements — 固定印刷）
- 小於 305mm 無明確公差者 ±0.005"
- 螺紋預設 2A/2B（美規）或 6g/6H（公規）
- 鋒利邊緣去毛邊 0.25–0.75mm
- 加工完立即清潔，不可氧化變黑

### 9. 授權／簽名矩陣（Authorization）
- **預習（PM）** + 日期
- **預習複查（PM 主管）** + 日期
- **質檢（QC）** + 日期
- **質檢複查（QC 主管）** + 日期
- **工廠簽收**（Factory 版）+ 日期
- **工程師 3D-圖紙比對簽名**（P3）+ 日期
- **品檢完成簽名**（P4）+ 日期
- **包裝完成簽名**（P4）+ 日期
- **量測人員簽名**（P6）+ 日期

### 10. 進度欄（若未來追蹤工廠狀態）
- **QTY REQ / RUNNING / COMPLETE** — 可由工廠在 P2 回填
- **工序進度**（若需）：下料/加工/表處/驗收

### 11. 變更管理（ECO — 若 Quote Rev 變動）
- **Plan Rev**（對應 Quote Rev）
- **Description of Change**
- **Revised By** + Date
- **Admin Approval** + Date

### 12. 收料驗收（P5 專屬）
- 供應商、訂單號、名稱、訂單數量、預計交貨日、實際交貨日
- 合格 / 不合格
- 不合格原因、NG 數量
- 檢驗數、QC 姓名、檢驗日
- 缺貨狀況、缺料說明

### 13. 品檢 Checklist（P4 專屬，對應 SOP）
- **SOP-1004 品檢**：Asana 收貨、材質、外觀 8 子項、螺紋、尺寸量測、清潔、拍照 4 子項
- **SOP-1006 / 1011 包裝**：巡查表、NG 包裝、獨立包裝、氣球圖/CMM 附件、標籤（數字籤、外袋、英文 PO）、內箱（≤20kg）、外箱（≤25kg、DHL 提單確認、Asana 記 DHL 號）
- **包裝資訊**：外箱/內箱尺寸、重量、材質（金屬/塑膠）、單件尺寸分類（S/M/L）

### 14. 尺寸量測記錄（P6 專屬）
- 圖紙上每個尺寸對應的實測值（手寫）
- Pass / Fail 總判
- 超差尺寸清單（尺寸編號、圖紙標稱值、實測值、公差、超差量）
- 量測工具（卡尺 / 千分尺 / CMM）
- 環境溫度
- 量測日期、量測人、複核人

---

## 六、各來源 × InstaVoxel 欄位對照矩陣

| 資料類別 | Codeware Shop | AK Safety-Critical | Xometry Admin | Xometry Shop | InstaVoxel 現有 | InstaVoxel 應補 |
|---------|--------------|-------------------|---------------|-------------|---------------|---------------|
| 訂單號 | ✅ Job # | ✅ Job Number | ✅ Order ID | ✅ PO | ✅ 訂單編號 | — |
| Serial Number | ✅ | ✅ | — | — | — | ⚠️ 若安全關鍵件需加 |
| Customer | ✅ | ✅ | ✅ | ❌ 隱藏 | ✅ 僅內部 | ✅ 已隱藏於 P2 |
| Partner/工廠 | — | — | ✅ | ❌ 隱藏 | ✅ | — |
| PSS/Quality Score | — | — | ✅ | — | — | ⚠️ 可加（內部評估） |
| Due Date | ✅ | ✅ | ✅ | ✅ | ✅ 三段式 | ✅ 更完整 |
| Part ID 雙 ID | — | — | ✅（Customer + Internal） | ✅ | ⚠️ 單一 | ⚠️ 建議加 Customer Part ID |
| Drawing # + Rev | ✅ | ✅ | ✅ | — | ⚠️ 需補 Rev | ✅ P3 比對欄已加 |
| 3D Thumbnail | — | — | ✅ | ✅ | ✅ P2 | — |
| Dimensions / Weight | — | — | Blank Size | Blank Size | ✅ P2 | — |
| Material | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Finish | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Tolerance（結構化）| ✅ | ✅ | ✅ Features | ✅ Features | ⚠️ 文字 | ⚠️ 建議結構化為 Features 列點 |
| Surface Roughness | ✅ | ✅ | ✅ Features | ✅ Features | ✅ 表粗要求 | — |
| Threads | — | — | ✅ Features | ✅ Features | ⚠️ 文字 | ⚠️ 建議結構化 |
| Part Markings | — | — | ✅ | ✅ | — | ⚠️ 建議加 |
| Certifications | ✅ | ✅ | ✅ | ✅ | ✅ 英文材料證明 | ✅ 已有 |
| Inspection Level | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Notes（分類段落）| — | — | ✅ 6 段 | ✅ 6 段 | ⚠️ 混合 | ⚠️ 建議分類為 Material/Machining/Inspection/Marking/Shipping/Contact |
| Standard Requirements | — | — | — | — | ✅ 4 條 | ✅ InstaVoxel 特色 |
| 授權簽名多層 | ✅ | ✅ | ✅ | — | ✅ 4 層 | ✅ 已有 |
| Hold Point / QC Gate | ✅ | ✅ | — | — | — | ⚠️ 可選加（高風險件） |
| ECO 變更記錄 | — | ✅ Plan Rev | — | — | — | ⚠️ 建議加（配合 Quote Rev） |
| QTY Req/Running/Complete | — | ✅ | — | — | — | ⚠️ 未來工廠端回填可加 |
| 工廠簽收 | — | — | — | — | ✅ P2 已加 | — |
| 3D vs 圖紙比對記錄 | — | — | — | — | ✅ P3 已加 | — |
| 品檢 SOP 對應 | ✅ | ✅ | — | — | ✅ P4 | — |
| 包裝 Checklist | — | — | — | — | ✅ P4 | — |
| 收料驗收卡 | — | — | — | — | ✅ P5 | — |
| 尺寸量測 Pass/Fail | ✅ | ✅ | — | — | ✅ P6 已加 | — |

---

## 七、InstaVoxel 的 Traveler 獨特性總結

1. **Job Shop 外包模式**（= Xometry，≠ 傳統製造廠）
   不管內部工序路由，只管「交給工廠做什麼 + 回來後怎麼驗」

2. **雙版本隔離**（P1 內部 vs P2 工廠）
   對應 Xometry Admin/Shop 分版原則：客戶身分、利潤資訊、工廠評分不露出給工廠

3. **三段式交期**（台灣交貨 / DHL 最晚 / 美國最終）
   跨國出貨特有，業界模板沒有

4. **P3/P6 同圖雙用**
   P3 是「製作依據＋3D 比對」，P6 是「實測記錄」，兩次列印同一張圖紙但用途與簽名欄不同

5. **SOP-1004/1006/1011 對應明確**
   P4 直接對應公司內部 SOP 編號，業界模板多為通用 checklist，沒有 SOP 連結

6. **艾維特有 4 條 Standard Requirements**
   ±.005"、螺紋 2A/2B、去毛邊、加工後清潔 — 作為固定文字，不逐單重打

7. **材料證書 + 特殊螺紋拍照 特殊動作 checkbox**
   業界沒有，艾維常見客戶要求

---

## 八、建議優先補齊項（按影響力排序）

| 優先 | 項目 | 理由 |
|-----|------|------|
| ★★★★ | **Features 結構化**（Tolerance/Roughness/Threads/Markings 改為列點）| Xometry 驗證過的最有效寫法，工廠一眼看完 |
| ★★★★ | **Notes 分類段落**（6 段：Material/Machining/Inspection/Marking/Shipping/Contact）| 避免目前 Notes 混在一起的可讀性問題 |
| ★★★ | **Drawing Revision 欄位**（P1/P2 頁首）| 客戶更新圖紙後的版本追溯 |
| ★★★ | **Part Markings 要求欄**（Bag and Tag、雷射標）| 客戶常提的需求，目前只能寫在 Notes |
| ★★ | **Customer Part ID 雙 ID**（客戶端編號 ≠ 艾維內部編號）| 未來接平台客戶時需要 |
| ★★ | **ECO 變更記錄**（Plan Rev、Description of Change）| 配合 Quote Rev 機制，有變更時可追溯 |
| ★ | **Serial Number 欄**（僅安全關鍵件） | 目前客群未必需要，視客戶類型加選 |
| ★ | **QTY Running/Complete**（工廠回填進度）| 未來工廠端電子化後可加 |

---

*最後更新：2026-04-14*
