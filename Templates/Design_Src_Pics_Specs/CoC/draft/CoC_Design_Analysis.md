# CoC 深度分析報告

> 分析日期：2026-04-07
> 比對對象：CoC_2（現行生產版）vs v1（新實作版）
> 資料來源：`Design_Src_Pics_Specs/InstaVoxel_Packin_CoC_2.pdf` + 業界研究

---

## 一、CoC_2（現行版）完整解構

### 版面結構（由上到下）

```
┌─ 左：InstaVoxel 公司資訊（純文字，公司名稱加粗）
│  右：參照表格（Order # / Client PO / Reference / Date / Page）
│
├─ "Client Info" 標籤框 → 聯絡人 Amy Ishler + 公司 + 地址
│
├─ 標題：Certificate of Compliance（置中，粗體，底線）
│
├─ 認證聲明（粗體，兩端對齊，2段）
│
├─ 零件表格（Item # / Part No. / Description / QTY Ordered / QTY Shipped）
│
├─ Additional Notes（灰底標頭 + 大片空白手寫區）
│
└─ Authorized by：Name ｜ Title（左右）
                   Signature ｜ Date（左右）
```

### 欄位清單

| 欄位 | 填寫狀態 | 備註 |
|------|---------|------|
| Order # | Q1088256U | 訂單號 |
| Client PO | 75635 | 客戶 PO |
| Reference | — | 空白，用途不明確 |
| Date | 08/02/2025 | 出貨日 |
| Page | 1 | 頁碼 |
| Client Info（聯絡人） | Amy Ishler | 包含收件人姓名 |
| 客戶公司 + 地址 | Optimax Systems, Inc. | |
| Item # | 1–5 | 序號 |
| Part No. | 25-25891-X-XX-PUR REV. A1 | Rev 嵌入料號中 |
| Description | **全部空白** | 最大欄位，全無填寫 |
| QTY Ordered | 10/10/10/10/20 | |
| QTY Shipped | 10/10/10/10/20 | |
| Additional Notes | 空白 | 手寫區 |
| Name | Mark Tanaka | |
| Title | QA Specialist | |
| Signature | 手簽 | |
| Date | 08/02/2025 | |

---

## 二、CoC_2 的三類主要使用者分析

### 1. 收貨員（Receiving / Warehouse）— 第一接觸者

**在意什麼（按順序）：**
- Item # + Part No. + QTY Shipped → 對比實物清點
- 能否快速找到這張單對應哪個包裹 → Order #
- 有沒有聯絡人（有問題要聯絡誰）→ Amy Ishler ✅

**CoC_2 對這個角色的支援：** 好。Item #、QTY Ordered vs Shipped、聯絡人都在。

---

### 2. IQC 檢驗員（Incoming Quality Control）— 核心讀者

**在意什麼（按順序）：**
1. 料號 + Rev（圖面版本匹配）→ 嵌在 Part No. 裡 ⚠️（難一眼識別）
2. 材料 + 批號（lot#/heat#）→ **完全沒有** ❌
3. QTY Ordered vs Shipped 是否相符 → ✅
4. Drawing reference → **完全沒有** ❌
5. 材料合規（RoHS/REACH）→ **完全沒有** ❌
6. 授權簽名是否為品質職能 → "QA Specialist"（偏低，非 Manager 層級）⚠️
7. Description（零件描述/材質/表面處理）→ **全部空白** ❌

**CoC_2 對這個角色的支援：** 非常弱。最需要的材料追溯、合規聲明、圖紙版本全部缺失。

---

### 3. AP 會計（Accounts Payable）— 付款核對者

**在意什麼（按順序）：**
1. Order # / Client PO → 對比發票 ✅
2. 件數是否與發票一致 → QTY Shipped ✅
3. 有授權簽名（QC 驗收完成）→ 有，雖然是手簽 ✅
4. 日期（計算付款期限起點）→ ✅
5. 供應商名稱 → ✅

**CoC_2 對這個角色的支援：** 良好，基本需求全覆蓋。

---

## 三、CoC_2 的設計優點

| 優點 | 重要性 | 我們 v1 是否有 |
|------|--------|--------------|
| QTY Ordered + QTY Shipped 分欄 | ★★★★★ 核心 | ❌ 沒有 |
| Item # 序號 | ★★★★ | ❌ 沒有 |
| 聯絡人姓名（收件人/負責人） | ★★★★ | ❌ 沒有 |
| Reference 欄位（彈性附加參照） | ★★★ | 有，但叫 PS Ref/PO Ref |
| Additional Notes 手寫區 | ★★★ | 有 notes 文字，但非空白手寫空間 |
| Page # 在參照表格 | ★★★ | 有，在 footer |
| 簡單直觀，一眼掃完 | ★★★★ | 我們的資訊密度較高 |

---

## 四、CoC_2 的設計缺陷與風險

### 嚴重缺失（對 IQC 與審計有影響）

**1. Description 欄全空白 — 文件功能失效**

整個最寬的欄位沒有填任何內容。這代表：
- 零件名稱、材料、表面處理、圖紙版本都必須靠 Part No. 反推
- IQC 無法從 CoC 確認材料合規（材料都不知道怎麼驗？）
- 若 Part No. 命名規則不標準，文件幾乎失去追溯功能

**2. 無材料追溯資訊**

沒有 lot#、heat#、material cert reference。對 Optimax（光學精密零件）這類客戶，材料追溯是基本要求。若零件日後有失效，CoC 無法回溯到批次材料。

**3. 無合規聲明（RoHS / REACH）**

Optimax 主要供應光學/精密系統市場，部分零件可能有 RoHS 要求。目前完全沒有合規聲明。

**4. 簽名職稱偏低：QA Specialist vs Quality Manager**

在採購合規標準（ISO 9001 / AS9100 / FAR 52.246-15）中，CoC 簽名者應具有品質職能授權。"QA Specialist" 在法律效力上弱於 "Quality Manager" 或 "Quality Assurance Manager"。若客戶做供應商審計，可能被要求重簽。

**5. 無 CoC 文件編號**

唯一識別只靠 Order #。若同一訂單補簽或修改，無法區分版本。

**6. 認證聲明過於通用**

"All processes, materials, and workmanship conform to the applicable standards and specifications." — 沒有說明是哪些標準（ASTM？ISO？客戶圖紙？）。在審計時可被質疑。

**7. "Certificate of Compliance" vs "Certificate of Conformance"**

- **Compliance** = 法規合規（通常是第三方/外部要求）
- **Conformance** = 符合規格（供應商自我聲明，符合採購規格）
- 業界標準 B2B 製造商自發出的應是 **Certificate of Conformance**
- 使用 Compliance 在嚴格審計中可能被退回，要求重出 Conformance 版本

**8. "Reference" 欄未定義**

目前是 "—"，欄位意義不清楚。使用者填寫時容易困惑。

---

## 五、v1（新實作版）vs CoC_2 對比矩陣

| 功能/欄位 | CoC_2 | v1 | 誰較好 |
|----------|-------|----|--------|
| QTY Ordered / QTY Shipped 分欄 | ✅ | ❌ | **CoC_2** |
| Item # 序號 | ✅ | ❌ | **CoC_2** |
| 聯絡人姓名 | ✅ | ❌ | **CoC_2** |
| 零件描述 | 欄存在但空白 | Material & Process 表格 | **v1** |
| 材料 + 表面處理 | ❌ | ✅ | **v1** |
| 材料批號 Lot # | ❌ | ✅ | **v1** |
| 圖紙 Drawing Ref（PDF） | ❌ | ✅ | **v1** |
| Drawing Rev 獨立欄 | ⚠️ 嵌入料號 | ✅ 獨立欄 | **v1** |
| 合規聲明（RoHS/REACH） | ❌ | ✅ | **v1** |
| 原產地 Country of Origin | ❌ | ✅ | **v1** |
| CoC 文件編號 | ❌ | ✅（COC-20XX-XXXX）| **v1** |
| 交叉索引（PS/PO/Invoice Ref） | PO 有，其他無 | ✅ 全有 | **v1** |
| 授權聲明語（"I hereby certify..."） | ❌ 無 | ✅ 有 | **v1** |
| 簽名人職稱 | QA Specialist（偏低）| Quality Manager | **v1** |
| 品牌一致性 | 純文字 header | InstaVoxel 品牌橫帶 | **v1** |
| Document footer（頁碼 + 文件 ID） | 頁碼在表格，無文件 ID | ✅ footer 含全部 | **v1** |
| Additional Notes 手寫空間 | ✅ 大片空白 | 只有文字 notes | **CoC_2** |
| 標題正確性 | Certificate of **Compliance** ⚠️ | Certificate of **Conformance** ✅ | **v1** |

---

## 六、研究彙整：業界最佳實踐 vs 兩個版本

根據 ISO 9001、AS9100、B2B CNC 製造標準與 B2B 業界實務：

### 必要欄位（兩個版本都應該有但目前不完整）

1. **Rev 欄獨立** — Rev 不應嵌入 Part No.，應是獨立欄位（IQC 對版本高度敏感）
2. **授權聲明** 應在簽名前明確寫出 "I certify that..."（CoC_2 沒有）
3. **參照標準** — 應明確說明依據哪個 drawing rev、規格、標準（兩版都略嫌通用）

### CoC_2 有而 v1 缺少的關鍵設計

1. **QTY Ordered vs Shipped** — 這是 B2B CoC 的行業標配，缺少此欄讓 AP 和 Receiving 都不方便
2. **Item # 序號** — 方便客戶在溝通中引用「第 3 項有問題」而非重複 Part No.
3. **Contact person（聯絡人）** — CoC 是寄給具體的人，不只是公司

---

## 七、設計結論與 v2 優先改進方向

### 必須加入（從 CoC_2 補充）

| 改動 | 原因 |
|------|------|
| 零件表格加 **QTY Ordered + QTY Shipped** 分欄 | 業界標配，AP/Receiving/IQC 三方都需要 |
| 零件表格加 **Item #** | 易引用，業界標配 |
| Customer 區塊加 **聯絡人姓名**（Attn:） | CoC 要有具體收件人 |
| 零件表格加 **Drawing Rev 欄**（獨立） | Rev 不應嵌入料號 |

### 必須修正（從研究中得出）

| 改動 | 原因 |
|------|------|
| 認證聲明加 **"per referenced drawings and specifications"** | 通用聲明在審計中力度不足 |
| 零件表格加 **Description 欄（材料 + 表面處理）** | 業界標配，直接在零件行顯示，不另開材料表 |
| Notes 區保留**一定空白手寫高度** | 客戶有時需要蓋章或手寫備注 |

### v1 已做對、繼續保留

| 保留項目 | 原因 |
|---------|------|
| 品牌 header | 一致性 |
| CoC 文件編號（COC-20XX-XXXX） | 版本追溯 |
| 交叉索引（PS / PO / Invoice） | 三方勾稽 |
| 合規聲明（RoHS / REACH 等） | IQC 必需 |
| 原產地（Country of Origin） | 進出口合規 |
| 材料批號（Lot #） | 材料追溯 |
| 圖紙 PDF reference | 追溯依據 |
| "I hereby certify..." 授權語 | 法律效力 |
| Quality Manager 職稱 | 授權層級正確 |
| Document footer | 頁面識別 |
| Certificate of **Conformance**（非 Compliance）| 術語正確 |

---

## 八、建議的 v2 零件表格結構

整合 CoC_2 的欄位 + v1 的資訊密度，一張表滿足三類讀者：

```
Item # | Part No.             | Description (Name · Material · Finish) | Rev   | QTY Ordered | QTY Shipped | Lot #
  1    | 25-25891-6-21-PUR    | Optical Bracket · Al 6061-T6 · Anodize | A1    | 10          | 10          | LOT-2025-041
  2    | 25-25891-3-21-PUR    | ...                                     | A1    | 10          | 10          | LOT-2025-041
  3    | 25-25891-6-24-PUR    | ...                                     | A1    | 10          | 10          | LOT-2025-042
```

**滿足對象：**
- Receiving → Item #、QTY Ordered/Shipped
- IQC → Description（含材料）、Rev、Lot #
- AP → Item 數量總覽、Order # 對應

Material & Process 的獨立 section 可**保留為補充性細節**（有特殊要求時才顯示），不作主要資訊載體。

---

## 九、v2 完整欄位規格（待實作）

### Header 區域
- InstaVoxel 品牌橫帶（保留）
- 左：Title "Certificate of Conformance" + CoC # 
- 右：DocumentMeta — Date / Order（highlight）/ PS Ref / PO Ref / Invoice Ref

### Customer 區域
- From（InstaVoxel）
- Bill To / Ship To（含 **Attn: 聯絡人姓名**）

### 認證聲明
- 左 border-left 裝飾（保留）
- 加入 "per customer drawings and specifications referenced herein"

### 零件表格（主要載體）
```
Item # | Part No. | Description | Rev | QTY Ordered | QTY Shipped | Lot #
```

### Material & Process（補充區，conditional）
- 僅在有特殊材料要求時顯示
- 或保留為完整展示材料細節

### Compliance（保留）
- RoHS / REACH / Conflict Minerals / ITAR 聲明

### Notes（改良）
- 保留文字 notes 欄
- 加入固定高度空白區（手寫/蓋章用）

### Authorized Release（保留，強化）
- "I hereby certify..." 語句
- Name / Signature / Title + Date 三欄
- Quality Manager 職稱
