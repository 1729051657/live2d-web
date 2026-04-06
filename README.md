# live2d-web-widget（`nodejs-plugin` 仓库）

把旧的静态 Live2D 看板娘 demo 整理成了一个可安装的前端 npm 包（**本目录单独成一个 GitHub 仓库**），提供实例式 API，默认支持：

- 浏览器端 `createLive2DWidget()` 初始化
- 包内默认样式、按钮和提示文案
- 通过 `modelManifest` / `models` / `modelManifestUrl` 加载模型
- 通过 `serviceUrl` 直接接入自托管模型服务（见独立仓库 `live2d-service`）
- 内置极小 demo 资源集
- Next.js / React 客户端使用
- **Node 18+**：同一 npm 包提供 `live2d-web-widget/service-client`，用于调用 `live2d-service` 的 HTTP API

## 与后端仓库的关系

- **本仓库**：浏览器插件 + 可选 Node 客户端子路径。
- **[live2d-service](https://github.com/1729051657/live2d-service)**（另库）：Vercel 上的模型与动态 API（`api/model-list`、`api/next` 等）。

## 安装

```bash
npm install live2d-web-widget
```

## 快速开始

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

## 使用自托管模型服务

```ts
import { createLive2DWidget } from "live2d-web-widget";

createLive2DWidget({
  serviceUrl: "https://your-live2d-service.vercel.app",
  infoLink: "https://github.com/1729051657/live2d-service"
});
```

默认行为：

- 自动请求 `${serviceUrl}/api/model-list`
- 自动把模型资源基地址解析为 `${serviceUrl}/models/`
- 配置了 `serviceUrl` 时，工具栏 **Next / Shuffle / Talk** 默认走服务端：`api/next`、`api/random`、`api/hitokoto`；若需纯本地逻辑，可设 `useServiceNavigation: false`。

## Node 端调用同一服务 API

```ts
import { createLive2dServiceClient } from "live2d-web-widget/service-client";

const client = createLive2dServiceClient({
  baseUrl: "https://your-live2d-service.vercel.app"
});

await client.getModelList();
await client.next(0);
```

## 使用外部模型清单

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

`models` 里的每一项可以是：

- 一个目录路径，例如 `characters/shizuku`
- 一个完整 `index.json` URL
- 一个字符串数组，表示同一组候选模型，加载时会随机选一个

如果传的是目录路径，组件会自动补成 `目录/index.json`。

## API

### `createLive2DWidget(options)`

返回一个实例，包含：

- `ready: Promise<void>`：初始化和首个模型加载完成后 resolve
- `mount()`：手动挂载
- `destroy()`：销毁 DOM、定时器和事件监听
- `show()` / `hide()`：显示或隐藏组件
- `nextModel()`：按顺序切换模型
- `randomizeModel()`：随机切换模型
- `switchModel(index)`：切换到指定模型
- `showMessage(text, timeoutMs?, priority?)`：手动显示气泡消息
- `getState()`：读取当前状态

### 常用参数

```ts
createLive2DWidget({
  container: document.body,
  width: 320,
  height: 320,
  position: { left: "24px", bottom: "0" },
  runtimeScriptUrl: "/vendor/live2d.min.js",
  serviceUrl: "https://your-live2d-service.vercel.app",
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
  storageKeyPrefix: "my-live2d-widget"
});
```

参数优先级大致如下：

- 最高优先级：`modelManifest` / `models`
- 其次：`serviceUrl`
- 再其次：`modelManifestUrl`
- 都不传时：使用包内 demo 模型

## Next.js

只在客户端组件里使用。

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

## 上传 GitHub 与上架 npm

1. 将 `package.json` 里的 `repository` / `bugs` / `homepage` 改成你的真实仓库地址（建议仓库名与本地文件夹一致：`nodejs-plugin`）。
2. 推送前确认：`.gitignore` 已忽略 `node_modules/`、`dist/`；**不要**把旧版整包模型当主内容——大体积内容已在 `legacy/model/`，若仓库仍过大可考虑删 `legacy/` 或改用 Git LFS。
3. 首次发布 npm（需已登录 `npm login`）：

```bash
npm run build
npm publish --access public
```

## 开发

在本目录（`nodejs-plugin/`）执行：

```bash
npm install
npm run build
```

本地预览 demo（构建后启动静态服务，打开 `/demo/`）：

```bash
npm run demo:serve
```

构建后会输出：

- `dist/index.js` 和类型声明
- `dist/serviceClient.js`（Node 子路径）
- `dist/assets/live2d.min.js`
- `dist/demo/model-list.json`
- `dist/demo/models/uiharu`
- `dist/demo/models/wed_16`

## 说明

- 当前 runtime 仍然沿用了旧版 `live2d.min.js`，只是改成了包内资源和模块化入口。
- 包内 demo 模型只用于本地验证和接入演示，不建议作为公开商业资源直接二次分发。
- 正式发布到 npm 前，建议替换为你有明确分发授权的模型资源。
- 自托管 API 见独立仓库 **live2d-service**。
