# PR 描述

## 改了什麼
<!-- 簡述這次改動的主題（一句話）。 -->

## 為什麼
<!-- 動機、情境、或解決的問題。不寫「加了某某 function」這類 what，寫 why。 -->

## 範圍
<!-- 打勾適用 -->
- [ ] 新 document 類型
- [ ] Document 新迭代（`[new]` badge 機制）
- [ ] Document 迭代升格（舊版搬 archive）
- [ ] Shared primitive（`components/` 底下非 `*Document` 檔）
- [ ] 分頁 / pagination 相關
- [ ] PDF pipeline（`downloadPdf.ts` / `pdf-server.ts`）
- [ ] Design token / documents.css
- [ ] Demo 頁改動
- [ ] Tests / test infra
- [ ] HANDOFF.md / docs

## 驗證
- [ ] `npm run typecheck` 綠
- [ ] `npm run test` 綠
- [ ] `npm run build` 綠
- [ ] 手動在 dev server（`#/...` 路由）看過正常
- [ ] Download PDF 測過（若牽涉 Document 或 PDF pipeline）

## 相關 / 備註
<!-- 相關 issue、commit、HANDOFF.md 章節；跨文件類型影響；後續待辦；... -->
