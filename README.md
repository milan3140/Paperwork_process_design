# Paperwork Process Design

InstaVoxel 紙本文件（Paperwork）模板系統：React 18 + TypeScript 5 + Vite 5 + Tailwind 3，產出可列印 PDF 與 email 用結構化報價。

## Quick Start

```bash
cd Templates/demo
npm install
npm run dev                # http://localhost:5173
```

開 http://localhost:5173/ 看到 DemoIndex — 列出所有正式版 (Current) 與歷史版本 (Archive) 文件模板。

## 文件

- **[Templates/HANDOFF.md](./Templates/HANDOFF.md)** — 工程師交接說明（架構、路由、慣例、加新 document 流程）
- **[CLAUDE.md](./CLAUDE.md)** — AI coding assistant 的除錯方法論與執行指令
- **[Document_Analysis/Order_Workflow_Paths.html](./Document_Analysis/Order_Workflow_Paths.html)** — 訂單工作流順序（文件排列依據）

工作流進行中的任何改動，請先讀 HANDOFF.md。
