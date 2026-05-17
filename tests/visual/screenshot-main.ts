/**
 * DecisionDesk 截图入口 — 独立 Electron 进程
 * 运行：npx electron -r tsx/esm tests/visual/screenshot-main.ts
 */
import { app, BrowserWindow } from "electron";
import fs from "node:fs";
import path from "node:path";

const SCREENSHOTS_DIR = path.resolve("tests/visual/screenshots");
const BASE_URL = process.env.VITE_DEV_SERVER_URL ?? "http://127.0.0.1:5173";

async function main() {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const win = new BrowserWindow({ width: 1440, height: 900, show: false });
  await win.loadURL(BASE_URL);
  await new Promise((r) => setTimeout(r, 3000));

  const image = await win.webContents.capturePage();
  fs.writeFileSync(path.join(SCREENSHOTS_DIR, "workbench-empty.png"), image.toPNG());
  console.log("✅ workbench-empty.png — 三栏工作台截图");

  win.close();
  app.quit();
}

app.whenReady().then(main);
