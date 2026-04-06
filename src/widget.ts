import { defaultDemoManifest, defaultIdleMessages, defaultTips, resolveTipText } from "./defaultTips.js";
import { widgetStyles } from "./styles.js";
import type {
  Live2DWidgetInstance,
  Live2DWidgetOptions,
  Live2DWidgetState,
  ModelEntry,
  ModelManifest,
  ModelServiceResponse,
  TipText,
  WidgetTipRule,
  WidgetTipsConfig
} from "./types.js";

type Nullable<T> = T | null;

interface Live2DGlobal {
  Live2D?: {
    captureFrame?: boolean;
    captureName?: string;
  };
  loadlive2d?: (canvasId: string, modelUrl: string) => void;
}

const STYLE_ID = "live2d-widget-package-style";
const DEFAULT_HEIGHT = 300;
const DEFAULT_HIDE_DURATION = 24 * 60 * 60 * 1000;
const DEFAULT_INFO_LINK = "https://github.com/stevenjoezhang/live2d-widget";
const DEFAULT_STORAGE_PREFIX = "live2d-widget";
const DEFAULT_WIDTH = 300;

let widgetCount = 0;
const runtimeLoaders = new Map<string, Promise<void>>();

function assertBrowser(): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("live2d-web-widget can only run in a browser environment.");
  }
}

function cloneManifest(manifest: ModelManifest): ModelManifest {
  return {
    models: [...manifest.models],
    messages: manifest.messages ? [...manifest.messages] : undefined
  };
}

function cloneTips(tips: WidgetTipsConfig): WidgetTipsConfig {
  return {
    mouseover: [...tips.mouseover],
    click: [...tips.click],
    seasons: [...tips.seasons]
  };
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = widgetStyles;
  document.head.appendChild(style);
}

function isAbsoluteUrl(value: string): boolean {
  return /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value) || value.startsWith("//");
}

function normalizeModelUrl(entry: string, modelBaseUrl?: string): string {
  const normalizedPath = entry.endsWith(".json")
    ? entry
    : `${entry.replace(/\/+$/, "")}/index.json`;

  if (isAbsoluteUrl(normalizedPath)) {
    return normalizedPath;
  }

  const baseUrl = modelBaseUrl ? ensureTrailingSlash(modelBaseUrl) : window.location.href;
  return new URL(normalizedPath, baseUrl).toString();
}

function resolveUrlFromBase(baseUrl: string, value: string): string {
  if (isAbsoluteUrl(value)) {
    return value;
  }

  return new URL(value, baseUrl).toString();
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function getSafeStorage(kind: "local" | "session"): Storage | null {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function getStoredNumber(storage: Storage | null, key: string): number | null {
  if (!storage) {
    return null;
  }

  const value = storage.getItem(key);
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mergeTips(tips?: Partial<WidgetTipsConfig>): WidgetTipsConfig {
  const merged = cloneTips(defaultTips);

  if (!tips) {
    return merged;
  }

  if (tips.mouseover) {
    merged.mouseover = [...tips.mouseover];
  }

  if (tips.click) {
    merged.click = [...tips.click];
  }

  if (tips.seasons) {
    merged.seasons = [...tips.seasons];
  }

  return merged;
}

async function loadRuntimeScript(runtimeScriptUrl: string): Promise<void> {
  const globalApi = window as typeof window & Live2DGlobal;

  if (typeof globalApi.loadlive2d === "function") {
    return;
  }

  if (runtimeLoaders.has(runtimeScriptUrl)) {
    return runtimeLoaders.get(runtimeScriptUrl)!;
  }

  const loader = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.src = runtimeScriptUrl;
    script.onload = () => {
      if (typeof globalApi.loadlive2d === "function") {
        resolve();
        return;
      }

      reject(new Error("The Live2D runtime loaded, but loadlive2d() is unavailable."));
    };
    script.onerror = () => reject(new Error(`Failed to load runtime: ${runtimeScriptUrl}`));
    document.head.appendChild(script);
  });

  runtimeLoaders.set(runtimeScriptUrl, loader);
  return loader;
}

function normalizeContainer(container?: HTMLElement | string): HTMLElement {
  if (!container) {
    return document.body;
  }

  if (typeof container === "string") {
    const target = document.querySelector<HTMLElement>(container);

    if (!target) {
      throw new Error(`Unable to find container element: ${container}`);
    }

    return target;
  }

  return container;
}

function resolveActionTip(rules: WidgetTipRule[], target: EventTarget | null): string | null {
  if (!(target instanceof Element)) {
    return null;
  }

  for (const rule of rules) {
    if (target.matches(rule.selector)) {
      return resolveTipText(rule.text);
    }
  }

  return null;
}

function resolveWelcomeMessage(): string {
  if (location.pathname === "/") {
    const hour = new Date().getHours();
    if (hour > 5 && hour <= 7) return "早上好，一日之计在于晨。";
    if (hour > 7 && hour <= 11) return "上午好，工作顺利的话也别忘了起身走走。";
    if (hour > 11 && hour <= 13) return "中午了，记得好好吃饭。";
    if (hour > 13 && hour <= 17) return "下午容易犯困，来和我聊两句提提神吧。";
    if (hour > 17 && hour <= 19) return "傍晚好，今天也辛苦啦。";
    if (hour > 19 && hour <= 23) return "晚上好，欢迎回来。";
    return "这么晚还不休息吗？";
  }

  return `欢迎阅读 <span>「${document.title || "当前页面"}」</span>`;
}

function appendSeasonalMessages(messages: string[], tips: WidgetTipsConfig): string[] {
  const now = new Date();
  const seasonalMessages = [...messages];

  for (const rule of tips.seasons) {
    const [after, before = after] = rule.date.split("-");
    const [afterMonth, afterDay] = after.split("/").map(Number);
    const [beforeMonth, beforeDay] = before.split("/").map(Number);

    const month = now.getMonth() + 1;
    const day = now.getDate();
    const inRange =
      month >= afterMonth &&
      month <= beforeMonth &&
      day >= afterDay &&
      day <= beforeDay;

    if (inRange) {
      seasonalMessages.push(
        resolveTipText(rule.text).replace(/\{year\}/g, String(now.getFullYear()))
      );
    }
  }

  return seasonalMessages;
}

class Live2DWidgetController implements Live2DWidgetInstance {
  public ready: Promise<void>;

  private readonly canvasId: string;
  private readonly hideDurationMs: number;
  private readonly idleMessages: string[];
  private readonly infoLink: string;
  private readonly localStorage: Storage | null = getSafeStorage("local");
  private readonly messageStorageKey: string;
  private readonly mountedStorageKey: string;
  private readonly sessionStorage: Storage | null = getSafeStorage("session");
  private readonly storagePrefix: string;
  private readonly width: number;
  private readonly height: number;
  private readonly zIndex: number;

  private currentModelIndex = 0;
  private currentModelUrl: string | undefined;
  private idleIntervalId: number | undefined;
  private isMounted = false;
  private isVisible = true;
  private lastActionAt = Date.now();
  private manifest: ModelManifest = cloneManifest(defaultDemoManifest);
  private messageTimerId: number | undefined;
  private mountPromise: Promise<void> | null = null;
  private root: Nullable<HTMLDivElement> = null;
  private bubble: Nullable<HTMLDivElement> = null;
  private toggle: Nullable<HTMLButtonElement> = null;
  private canvas: Nullable<HTMLCanvasElement> = null;
  private cleanupCallbacks: Array<() => void> = [];
  private resolvedModelBaseUrl: string | undefined;
  private usesBundledDemoManifest = false;

  constructor(private readonly options: Live2DWidgetOptions = {}) {
    this.canvasId = options.canvasId ?? `live2d-widget-canvas-${++widgetCount}`;
    this.height = options.height ?? DEFAULT_HEIGHT;
    this.hideDurationMs = options.hiddenDurationMs ?? DEFAULT_HIDE_DURATION;
    this.idleMessages = [...defaultIdleMessages];
    this.infoLink = options.infoLink ?? DEFAULT_INFO_LINK;
    this.storagePrefix = options.storageKeyPrefix ?? DEFAULT_STORAGE_PREFIX;
    this.messageStorageKey = `${this.storagePrefix}:message-priority`;
    this.mountedStorageKey = `${this.storagePrefix}:dismissed-at`;
    this.width = options.width ?? DEFAULT_WIDTH;
    this.zIndex = options.zIndex ?? 9999;
    this.ready = options.autoMount === false ? Promise.resolve() : this.mount();
  }

  public async mount(): Promise<void> {
    if (this.isMounted) {
      return;
    }

    if (this.mountPromise) {
      return this.mountPromise;
    }

    this.mountPromise = this.doMount();
    return this.mountPromise;
  }

  public destroy(): void {
    if (!this.isMounted) {
      return;
    }

    for (const cleanup of this.cleanupCallbacks.splice(0)) {
      cleanup();
    }

    if (this.messageTimerId) {
      window.clearTimeout(this.messageTimerId);
      this.messageTimerId = undefined;
    }

    if (this.idleIntervalId) {
      window.clearInterval(this.idleIntervalId);
      this.idleIntervalId = undefined;
    }

    this.sessionStorage?.removeItem(this.messageStorageKey);
    this.root?.remove();
    this.toggle?.remove();
    this.root = null;
    this.toggle = null;
    this.canvas = null;
    this.bubble = null;
    this.isMounted = false;
    this.mountPromise = null;
  }

  public getState(): Live2DWidgetState {
    return {
      mounted: this.isMounted,
      visible: this.isVisible,
      currentModelIndex: this.currentModelIndex,
      currentModelUrl: this.currentModelUrl
    };
  }

  public hide(persist = true): void {
    if (!this.root || !this.toggle) {
      return;
    }

    if (persist) {
      this.localStorage?.setItem(this.mountedStorageKey, String(Date.now()));
    }

    this.isVisible = false;
    this.root.classList.add("l2d-widget--hidden");
    window.setTimeout(() => {
      if (!this.isVisible && this.root) {
        this.root.style.display = "none";
      }
    }, 280);
    this.toggle.classList.add("l2d-widget__toggle--active");
  }

  public async nextModel(): Promise<void> {
    await this.mount();

    if (this.shouldUseServiceNavigation()) {
      try {
        const url = `${this.serviceNavigationUrl("next")}?prev=${encodeURIComponent(String(this.currentModelIndex))}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("service next failed");
        }

        const data = (await response.json()) as { nextIndex?: number };
        const nextIndex = Number.isFinite(data.nextIndex) ? Number(data.nextIndex) : 0;
        await this.switchModel(nextIndex);
        return;
      } catch {
        // Fall back to local manifest order.
      }
    }

    const nextIndex = (this.currentModelIndex + 1) % this.manifest.models.length;
    await this.switchModel(nextIndex);
  }

  public async randomizeModel(): Promise<void> {
    await this.mount();

    if (this.shouldUseServiceNavigation()) {
      try {
        const url = `${this.serviceNavigationUrl("random")}?current=${encodeURIComponent(String(this.currentModelIndex))}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("service random failed");
        }

        const data = (await response.json()) as { nextIndex?: number };
        const nextIndex = Number.isFinite(data.nextIndex) ? Number(data.nextIndex) : 0;
        await this.switchModel(nextIndex);
        return;
      } catch {
        // Fall back to local random.
      }
    }

    if (this.manifest.models.length === 1) {
      await this.switchModel(0);
      return;
    }

    let nextIndex = Math.floor(Math.random() * this.manifest.models.length);
    if (nextIndex === this.currentModelIndex) {
      nextIndex = (nextIndex + 1) % this.manifest.models.length;
    }
    await this.switchModel(nextIndex);
  }

  public show(): void {
    if (!this.root || !this.toggle) {
      return;
    }

    this.localStorage?.removeItem(this.mountedStorageKey);
    this.isVisible = true;
    this.root.style.display = "";
    this.toggle.classList.remove("l2d-widget__toggle--active");
    window.setTimeout(() => {
      this.root?.classList.remove("l2d-widget--hidden");
    }, 0);
  }

  public showMessage(text: TipText, timeoutMs = 6000, priority = 5): void {
    if (!this.bubble) {
      return;
    }

    const activePriority = getStoredNumber(this.sessionStorage, this.messageStorageKey);
    if (activePriority !== null && activePriority > priority) {
      return;
    }

    if (this.messageTimerId) {
      window.clearTimeout(this.messageTimerId);
      this.messageTimerId = undefined;
    }

    const message = resolveTipText(text);
    this.sessionStorage?.setItem(this.messageStorageKey, String(priority));
    this.options.onMessage?.(message);
    this.bubble.innerHTML = message;
    this.bubble.classList.add("l2d-widget__bubble--active");
    this.messageTimerId = window.setTimeout(() => {
      this.sessionStorage?.removeItem(this.messageStorageKey);
      this.bubble?.classList.remove("l2d-widget__bubble--active");
    }, timeoutMs);
  }

  public async switchModel(index: number): Promise<void> {
    await this.mount();
    const boundedIndex = ((index % this.manifest.models.length) + this.manifest.models.length) % this.manifest.models.length;
    const entry = this.manifest.models[boundedIndex];
    const entryValue = Array.isArray(entry) ? pickRandom(entry) : entry;
    const modelUrl = normalizeModelUrl(entryValue, this.resolveModelBaseUrl());

    const globalApi = window as typeof window & Live2DGlobal;
    if (typeof globalApi.loadlive2d !== "function") {
      throw new Error("Live2D runtime is not ready.");
    }

    globalApi.loadlive2d(this.canvasId, modelUrl);
    this.currentModelIndex = boundedIndex;
    this.currentModelUrl = modelUrl;
    this.localStorage?.setItem(`${this.storagePrefix}:model-index`, String(boundedIndex));

    const message = this.manifest.messages?.[boundedIndex];
    if (message) {
      this.showMessage(message, 4000, 10);
    }

    this.options.onModelChange?.({
      index: boundedIndex,
      url: modelUrl,
      entry,
      message
    });
  }

  private async doMount(): Promise<void> {
    assertBrowser();
    injectStyles();

    const runtimeScriptUrl = this.options.runtimeScriptUrl ?? getDefaultRuntimeScriptUrl();
    await loadRuntimeScript(runtimeScriptUrl);

    const [manifest, tips] = await Promise.all([this.resolveManifest(), this.resolveTips()]);
    this.manifest = manifest;
    if (this.manifest.models.length === 0) {
      throw new Error("The model manifest is empty.");
    }
    this.idleMessages.splice(
      0,
      this.idleMessages.length,
      ...appendSeasonalMessages(
        this.options.messages ? [...this.options.messages] : [...defaultIdleMessages],
        tips
      )
    );

    const container = normalizeContainer(this.options.container);
    const useAbsolutePosition = container !== document.body;

    this.createDom(container, useAbsolutePosition);
    this.bindInternalEvents(tips);
    this.startIdleLoop();
    this.isMounted = true;

    const dismissedAt = getStoredNumber(this.localStorage, this.mountedStorageKey);
    if (dismissedAt !== null && Date.now() - dismissedAt <= this.hideDurationMs) {
      this.hide(false);
    } else {
      this.show();
      this.showMessage(resolveWelcomeMessage(), 7000, 8);
    }

    const storedModelIndex = getStoredNumber(this.localStorage, `${this.storagePrefix}:model-index`);
    const initialModelIndex = storedModelIndex ?? this.options.initialModelIndex ?? 0;
    await this.switchModel(initialModelIndex);
  }

  private bindInternalEvents(tips: WidgetTipsConfig): void {
    const trackAction = () => {
      this.lastActionAt = Date.now();
    };
    const handleCopy = () => {
      this.showMessage("转载或者分享时，记得标注来源哦。", 5000, 8);
    };
    const handleVisibilityChange = () => {
      if (!document.hidden && this.isVisible) {
        this.showMessage("欢迎回来。", 5000, 9);
      }
    };
    const handleMouseover = (event: Event) => {
      const message = resolveActionTip(tips.mouseover, event.target);
      if (message) {
        this.showMessage(message, 4000, 7);
      }
    };
    const handleClick = (event: Event) => {
      const message = resolveActionTip(tips.click, event.target);
      if (message) {
        this.showMessage(message, 4000, 7);
      }
    };

    window.addEventListener("mousemove", trackAction, { passive: true });
    window.addEventListener("keydown", trackAction);
    window.addEventListener("copy", handleCopy);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("mouseover", handleMouseover);
    window.addEventListener("click", handleClick);

    this.cleanupCallbacks.push(() => window.removeEventListener("mousemove", trackAction));
    this.cleanupCallbacks.push(() => window.removeEventListener("keydown", trackAction));
    this.cleanupCallbacks.push(() => window.removeEventListener("copy", handleCopy));
    this.cleanupCallbacks.push(() =>
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    );
    this.cleanupCallbacks.push(() => window.removeEventListener("mouseover", handleMouseover));
    this.cleanupCallbacks.push(() => window.removeEventListener("click", handleClick));
  }

  private createDom(container: HTMLElement, useAbsolutePosition: boolean): void {
    this.toggle = document.createElement("button");
    this.toggle.className = "l2d-widget__toggle";
    this.toggle.type = "button";
    this.toggle.textContent = "Live2D";

    this.root = document.createElement("div");
    this.root.className = "l2d-widget";
    if (useAbsolutePosition) {
      this.root.classList.add("l2d-widget--absolute");
      this.toggle.classList.add("l2d-widget__toggle--absolute");
    }

    const left = this.options.position?.right ? "auto" : this.options.position?.left ?? "0";
    this.root.style.bottom = this.options.position?.bottom ?? "0";
    this.root.style.left = left;
    this.root.style.right = this.options.position?.right ?? "auto";
    this.root.style.zIndex = String(this.zIndex);

    this.toggle.style.bottom = this.options.position?.bottom ?? "72px";
    this.toggle.style.left = left;
    this.toggle.style.right = this.options.position?.right ?? "auto";
    this.toggle.style.zIndex = String(this.zIndex - 1);

    this.bubble = document.createElement("div");
    this.bubble.className = "l2d-widget__bubble";

    const stage = document.createElement("div");
    stage.className = "l2d-widget__stage";

    const canvasWrap = document.createElement("div");
    canvasWrap.className = "l2d-widget__canvas-wrap";

    this.canvas = document.createElement("canvas");
    this.canvas.className = "l2d-widget__canvas";
    this.canvas.id = this.canvasId;
    this.canvas.width = 800;
    this.canvas.height = 800;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    const tools = document.createElement("div");
    tools.className = "l2d-widget__tools";

    for (const [action, label] of [
      ["talk", "Talk"],
      ["next", "Next"],
      ["shuffle", "Shuffle"],
      ["photo", "Photo"],
      ["info", "Info"],
      ["hide", "Hide"]
    ]) {
      const button = document.createElement("button");
      button.className = "l2d-widget__tool";
      button.type = "button";
      button.dataset.live2dAction = action;
      button.textContent = label;
      const handleButtonClick = () => {
        void this.handleToolAction(action);
      };
      button.addEventListener("click", handleButtonClick);
      tools.appendChild(button);
      this.cleanupCallbacks.push(() => button.removeEventListener("click", handleButtonClick));
    }

    canvasWrap.append(this.canvas, tools);
    stage.append(this.bubble, canvasWrap);
    this.root.append(stage);

    const handleToggleClick = () => {
      this.show();
    };
    this.toggle.addEventListener("click", handleToggleClick);
    container.append(this.toggle, this.root);

    this.cleanupCallbacks.push(() => this.toggle?.removeEventListener("click", handleToggleClick));
  }

  private async handleToolAction(action: string): Promise<void> {
    switch (action) {
      case "talk":
        await this.fetchHitokoto();
        break;
      case "next":
        await this.nextModel();
        break;
      case "shuffle":
        await this.randomizeModel();
        break;
      case "photo":
        this.capturePhoto();
        break;
      case "info":
        window.open(this.infoLink, "_blank", "noopener,noreferrer");
        break;
      case "hide":
        this.showMessage("下次记得早点把我叫出来。", 2500, 11);
        this.hide(true);
        break;
      default:
        break;
    }
  }

  private async fetchHitokoto(): Promise<void> {
    if (this.shouldUseServiceNavigation()) {
      try {
        const response = await fetch(this.serviceNavigationUrl("hitokoto"));
        if (response.ok) {
          const payload = (await response.json()) as {
            creator?: string;
            error?: string;
            from?: string;
            hitokoto?: string;
          };

          if (!payload.error && payload.hitokoto) {
            this.showHitokotoPayload(payload);
            return;
          }
        }
      } catch {
        // Try direct API below.
      }
    }

    try {
      const response = await fetch("https://v1.hitokoto.cn");
      if (!response.ok) {
        throw new Error("Unexpected response");
      }

      const payload = (await response.json()) as {
        creator?: string;
        from?: string;
        hitokoto?: string;
      };

      if (payload.hitokoto) {
        this.showHitokotoPayload(payload);
        return;
      }
    } catch {
      // Ignore and fall back to a local line.
    }

    this.showMessage("今天也要元气满满。", 5000, 9);
  }

  private shouldUseServiceNavigation(): boolean {
    if (!this.options.serviceUrl) {
      return false;
    }

    return this.options.useServiceNavigation !== false;
  }

  private serviceNavigationUrl(kind: "next" | "random" | "hitokoto"): string {
    const base = ensureTrailingSlash(this.options.serviceUrl!);
    const paths = {
      next: this.options.serviceNextPath ?? "api/next",
      random: this.options.serviceRandomPath ?? "api/random",
      hitokoto: this.options.serviceHitokotoPath ?? "api/hitokoto"
    };

    return resolveUrlFromBase(base, paths[kind]);
  }

  private showHitokotoPayload(payload: { creator?: string; from?: string; hitokoto?: string }): void {
    if (!payload.hitokoto) {
      return;
    }

    this.showMessage(payload.hitokoto, 6000, 9);
    if (payload.from || payload.creator) {
      const detail = `这句一言来自 <span>「${payload.from ?? "未知作品"}」</span>，投稿者是 <span>${payload.creator ?? "匿名"}</span>。`;
      window.setTimeout(() => this.showMessage(detail, 4000, 9), 6000);
    }
  }

  private capturePhoto(): void {
    const globalApi = window as typeof window & Live2DGlobal;
    if (globalApi.Live2D) {
      globalApi.Live2D.captureName = "live2d-photo.png";
      globalApi.Live2D.captureFrame = true;
      this.showMessage("拍照指令已经发送，记得查看下载结果。", 5000, 9);
      return;
    }

    this.showMessage("当前 runtime 不支持截图接口。", 5000, 9);
  }

  private startIdleLoop(): void {
    this.idleIntervalId = window.setInterval(() => {
      if (!this.isVisible || Date.now() - this.lastActionAt < 20000) {
        return;
      }

      this.showMessage(pickRandom(this.idleMessages), 5000, 6);
    }, 20000);
  }

  private async resolveManifest(): Promise<ModelManifest> {
    this.resolvedModelBaseUrl = undefined;

    if (this.options.modelManifest) {
      this.usesBundledDemoManifest = false;
      return cloneManifest(this.options.modelManifest);
    }

    if (this.options.models) {
      this.usesBundledDemoManifest = false;
      return {
        models: [...this.options.models],
        messages: this.options.messages ? [...this.options.messages] : undefined
      };
    }

    if (this.options.serviceUrl) {
      this.usesBundledDemoManifest = false;
      const serviceUrl = ensureTrailingSlash(this.options.serviceUrl);
      const manifestUrl = resolveUrlFromBase(
        serviceUrl,
        this.options.serviceManifestPath ?? "api/model-list"
      );
      const payload = await this.fetchManifestPayload(manifestUrl);
      this.resolvedModelBaseUrl = payload.modelBaseUrl
        ? resolveUrlFromBase(serviceUrl, payload.modelBaseUrl)
        : resolveUrlFromBase(serviceUrl, this.options.serviceModelsPath ?? "models/");
      return {
        models: [...payload.models],
        messages: payload.messages ? [...payload.messages] : undefined
      };
    }

    if (this.options.modelManifestUrl) {
      this.usesBundledDemoManifest = false;
      const payload = await this.fetchManifestPayload(this.options.modelManifestUrl);
      if (payload.modelBaseUrl) {
        this.resolvedModelBaseUrl = resolveUrlFromBase(
          this.options.modelManifestUrl,
          payload.modelBaseUrl
        );
      }
      return {
        models: [...payload.models],
        messages: payload.messages ? [...payload.messages] : undefined
      };
    }

    this.usesBundledDemoManifest = true;
    this.resolvedModelBaseUrl = getDefaultDemoBaseUrl();
    return cloneManifest(defaultDemoManifest);
  }

  private async resolveTips(): Promise<WidgetTipsConfig> {
    if (this.options.tipsUrl) {
      const response = await fetch(this.options.tipsUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch tips config: ${this.options.tipsUrl}`);
      }
      const remoteTips = (await response.json()) as WidgetTipsConfig;
      return mergeTips(remoteTips);
    }

    return mergeTips(this.options.tips);
  }

  private resolveModelBaseUrl(): string | undefined {
    if (this.options.modelBaseUrl) {
      return this.options.modelBaseUrl;
    }

    if (this.resolvedModelBaseUrl) {
      return this.resolvedModelBaseUrl;
    }

    return this.usesBundledDemoManifest ? getDefaultDemoBaseUrl() : undefined;
  }

  private async fetchManifestPayload(url: string): Promise<ModelServiceResponse> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch model manifest: ${url}`);
    }

    return (await response.json()) as ModelServiceResponse;
  }
}

export function createLive2DWidget(options: Live2DWidgetOptions = {}): Live2DWidgetInstance {
  return new Live2DWidgetController(options);
}

export function getDefaultRuntimeScriptUrl(): string {
  return new URL("./assets/live2d.min.js", import.meta.url).toString();
}

export function getDefaultDemoBaseUrl(): string {
  return new URL("./demo/", import.meta.url).toString();
}
