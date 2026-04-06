# live2d-web-widget

浏览器端 Live2D 看板娘 npm 包，提供 `createLive2DWidget()` 与可选 Node 子路径 `live2d-web-widget/service-client`。

| 项目 | 地址 |
|------|------|
| **本仓库（源码）** | [github.com/1729051657/live2d-web](https://github.com/1729051657/live2d-web) |
| **配套模型与 API 服务** | [github.com/1729051657/live2d-service](https://github.com/1729051657/live2d-service) |
| **npm 包名** | `live2d-web-widget` |

前端只配一个 `serviceUrl` 即可拉模型清单与静态资源；服务部署说明见 [live2d-service README](https://github.com/1729051657/live2d-service#readme)。

---

## 功能概览

- 浏览器：`createLive2DWidget()`，内置样式、气泡与工具栏（Next / Shuffle / Talk 等）
- 模型来源：`modelManifest` / `models` / `modelManifestUrl`，或 **`serviceUrl`** 对接自托管服务
- 内置极小 demo 资源（`dist/demo/`），便于本地联调
- **Node 18+**：`import { createLive2dServiceClient } from "live2d-web-widget/service-client"` 调用服务端 HTTP API
- 运行时仍使用包内 `live2d.min.js`（Cubism 2 系），通过 `runtimeScriptUrl` 可改为你站点上的路径

---

## 安装

```bash
npm install live2d-web-widget
```

若从 monorepo 本地开发，也可用 `pnpm` / `npm` 的 **`link:../path/to/nodejs-plugin`** 指向本仓库根目录，始终使用当前构建的 `dist/`。

---

## 快速开始（包内 demo，无需后端）

```ts
import {
  createLive2DWidget,
  defaultDemoManifest,
  getDefaultDemoBaseUrl
} from "live2d-web-widget";

const widget = createLive2DWidget({
  modelBaseUrl: getDefaultDemoBaseUrl(),
  modelManifest: defaultDemoManifest
});

await widget.ready;
```

---

## 使用自托管模型服务（推荐）

先部署 [live2d-service](https://github.com/1729051657/live2d-service)（或 Fork 后部署自己的 Vercel 项目），将下面 `serviceUrl` 换成你的线上地址，例如官方示例域名 **`https://live2d-service.vercel.app`**（以你实际部署为准）。

```ts
import { createLive2DWidget } from "live2d-web-widget";

createLive2DWidget({
  serviceUrl: "https://live2d-service.vercel.app",
  infoLink: "https://github.com/1729051657/live2d-service"
});
```

默认行为：

- 请求 `${serviceUrl}/api/model-list` 获取模型列表与 `modelBaseUrl`
- 模型资源：`${serviceUrl}/models/...`
- 工具栏 **Next / Shuffle / Talk** 分别请求：`api/next`、`api/random`、`api/hitokoto`
- 若不想走服务端切换逻辑：设置 `useServiceNavigation: false`

**说明**：加载模型时请使用 **HTTPS 的 `index.json` 地址**。运行时按「模型目录 URL + 相对路径」拼接 `.moc` 等资源，**不要用 Blob URL 包一层再改 JSON**，否则会出现错误的路径拼接。

---

## Node 端调用同一套 API

```ts
import { createLive2dServiceClient } from "live2d-web-widget/service-client";

const client = createLive2dServiceClient({
  baseUrl: "https://live2d-service.vercel.app"
});

await client.getModelList();
await client.next(0);
```

---

## 使用外部模型清单（自有 CDN）

```ts
import { createLive2DWidget } from "live2d-web-widget";

createLive2DWidget({
  modelBaseUrl: "https://your-cdn.example.com/live2d/",
  modelManifest: {
    models: [
      "characters/shizuku",
      ["characters/uiharu", "characters/wed_16"]
    ],
    messages: ["欢迎来到这里。", "这次换个角色看看。"]
  }
});
```

`models` 中每一项可以是：目录路径（自动补 `index.json`）、完整 `index.json` URL、或字符串数组（随机选一个）。

---

## 常用参数说明

```ts
createLive2DWidget({
  container: document.body,
  width: 280,
  height: 280,
  position: { left: "0", bottom: "0" },
  /** Live2D 运行时脚本；默认使用包内资源时可不传 */
  runtimeScriptUrl: "/js/live2d.min.js",
  serviceUrl: "https://live2d-service.vercel.app",
  useServiceNavigation: true,
  serviceManifestPath: "api/model-list",
  serviceModelsPath: "models/",
  serviceNextPath: "api/next",
  serviceRandomPath: "api/random",
  serviceHitokotoPath: "api/hitokoto",
  modelBaseUrl: "https://your-cdn.example.com/live2d/",
  modelManifestUrl: "/live2d/model-list.json",
  tipsUrl: "/live2d/tips.json",
  infoLink: "https://github.com/1729051657/live2d-service",
  storageKeyPrefix: "my-live2d-widget",
  /**
   * 画布垂直偏移。默认约 `8%` 高度向下，让人物略贴底、减少下方留白。
   * 设为 `"0"` 或 `"none"` 可关闭。
   */
  canvasOffsetY: "8%"
});
```

**参数优先级（模型从哪来）**：`modelManifest` / `models` 最高 → 其次 `serviceUrl` → 再其次 `modelManifestUrl` → 都不传则用包内 demo。

---

## API（实例方法）

| 成员 | 说明 |
|------|------|
| `ready` | `Promise`，挂载并加载首个模型后 resolve |
| `mount()` | 手动挂载 |
| `destroy()` | 销毁 DOM、定时器与监听 |
| `show()` / `hide()` | 显示或隐藏 |
| `nextModel()` / `randomizeModel()` / `switchModel(index)` | 切换模型 |
| `showMessage(text, timeoutMs?, priority?)` | 气泡文案 |
| `getState()` | 当前状态 |

---

## VuePress / Vite 项目提示

- 动态 `import('live2d-web-widget')` 时，若依赖仍命中旧的预构建缓存，可在 Vite 里为 `live2d-web-widget` 配置 **`resolve.alias`** 指向本包 `dist/index.js`，并对该包 **`optimizeDeps.exclude`**，或在本仓库根目录用 **`link:`** 安装依赖，避免 stale 缓存。
- 将 **`live2d.min.js`** 放到站点 `public/js/`，并把 `runtimeScriptUrl` 设为站点内可访问的 URL。

---

## Next.js

仅在 **`"use client"`** 组件中初始化；在 `useEffect` 里 `createLive2DWidget`，在 cleanup 里 `widget.destroy()`。

```tsx
"use client";

import { useEffect } from "react";
import {
  createLive2DWidget,
  defaultDemoManifest,
  getDefaultDemoBaseUrl
} from "live2d-web-widget";

export function Live2DClientWidget() {
  useEffect(() => {
    const widget = createLive2DWidget({
      modelBaseUrl: getDefaultDemoBaseUrl(),
      modelManifest: defaultDemoManifest
    });
    return () => widget.destroy();
  }, []);
  return null;
}
```

---

## 开发与构建

```bash
npm install
npm run build
```

- 产物：`dist/index.js`、类型声明、`dist/assets/live2d.min.js`、`dist/serviceClient.js`、内置 `dist/demo/` 模型子集。
- 本地静态预览（构建后）：`npm run demo:serve`，浏览器打开 `/demo/`。

---

## 发布到 npm

```bash
npm run build
npm publish --access public
```

`prepublishOnly` 会执行 `npm run build`。首次发布前请登录：`npm login`。

---

## 版本说明（摘录）

- **0.2.0**：竖向画布比例与默认 `canvasOffsetY` 调整；移除会破坏 `modelHomeDir` 的 Blob 式 `index.json` 加载；`package.json` 仓库字段指向 [live2d-web](https://github.com/1729051657/live2d-web)。

---

## 许可与第三方

- 包本体见根目录 `LICENSE`。
- 运行时与部分资源说明见 `THIRD_PARTY_NOTICES.md`。
- 包内 demo 模型仅作接入演示；公开站点请使用你有权分发的模型。
- 模型 **`layout`**（裁切、站位）可在各模型的 `index.json` 中配置；服务端维护的模型见 [live2d-service](https://github.com/1729051657/live2d-service) 的 `public/models/`。
