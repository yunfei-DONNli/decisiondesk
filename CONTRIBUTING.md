# Contributing to DecisionDesk

## 开发环境

```bash
# 依赖
Node.js v22+ | npm | pnpm | Python 3.10+ (for AkShare)

# 安装
npm install
pip3 install akshare yfinance

# 启动开发
npm run dev

# 运行测试
npm test
```

## 已知问题

### vitest 依赖错误（macOS ARM64）

npm 可选依赖 bug 导致 `@rollup/rollup-darwin-arm64` 丢失，报错：

```
Cannot find module @rollup/rollup-darwin-arm64
```

**修复**：

```bash
npm install @rollup/rollup-darwin-arm64 --no-save
```

然后重新运行 `npm test`。

## 项目结构

```
src/           React 前端
electron/      Electron 主进程
multica/       Multica Agent 配置
scripts/       构建/同步脚本
```

## 测试

```bash
npm test           # 全量测试
npm run test:e2e   # Playwright E2E 与截图回归
npx vitest run     # 等价
npx tsc --noEmit   # 类型检查
```
