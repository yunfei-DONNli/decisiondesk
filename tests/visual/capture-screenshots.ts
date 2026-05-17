/**
 * DecisionDesk 视觉验收截图脚本
 * 使用 Electron 内置 capturePage() 截图，零额外依赖
 *
 * 运行：pnpm dev（先启动开发服务器）
 *      然后：npx tsx tests/visual/capture-screenshots.ts
 */
import { app, BrowserWindow } from "electron";
import fs from "node:fs";
import path from "node:path";

const SCREENSHOTS_DIR = path.resolve("tests/visual/screenshots");
const BASE_URL = process.env.VITE_DEV_SERVER_URL ?? "http://127.0.0.1:5173";

const screens = [
  { name: "workbench-empty", url: BASE_URL, description: "空态工作台——三栏布局 + 分析输入面板" },
  { name: "analysis-panel", url: BASE_URL, description: "分析输入面板特写" }
];

async function captureAll() {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    show: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  });

  for (const screen of screens) {
    await win.loadURL(screen.url);
    await new Promise((r) => setTimeout(r, 2000)); // 等待渲染

    const image = await win.webContents.capturePage();
    const filePath = path.join(SCREENSHOTS_DIR, `${screen.name}.png`);
    fs.writeFileSync(filePath, image.toPNG());
    console.log(`✅ ${screen.name}.png — ${screen.description}`);
  }

  win.close();
  app.quit();
}

app.whenReady().then(captureAll);
