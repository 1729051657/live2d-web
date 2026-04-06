export type TipText = string | string[];
export type ModelEntry = string | string[];

export interface WidgetTipRule {
  selector: string;
  text: TipText;
}

export interface SeasonalTipRule {
  date: string;
  text: TipText;
}

export interface WidgetTipsConfig {
  mouseover: WidgetTipRule[];
  click: WidgetTipRule[];
  seasons: SeasonalTipRule[];
}

export interface ModelManifest {
  models: ModelEntry[];
  messages?: string[];
}

export interface ModelServiceResponse extends ModelManifest {
  modelBaseUrl?: string;
  serviceName?: string;
}

export interface Live2DWidgetPosition {
  bottom?: string;
  left?: string;
  right?: string;
}

export interface ModelChangeEvent {
  index: number;
  url: string;
  entry: ModelEntry;
  message?: string;
}

export interface Live2DWidgetState {
  mounted: boolean;
  visible: boolean;
  currentModelIndex: number;
  currentModelUrl?: string;
}

export interface Live2DWidgetOptions {
  autoMount?: boolean;
  canvasId?: string;
  container?: HTMLElement | string;
  /**
   * 与 `width` 一起决定缩放基准：取二者较小值作为「显示宽度」，高度按内部缓冲 800×1100 与宽度同比例计算，避免拉伸。
   */
  height?: number;
  hiddenDurationMs?: number;
  infoLink?: string;
  initialModelIndex?: number;
  messages?: string[];
  modelBaseUrl?: string;
  modelManifest?: ModelManifest;
  modelManifestUrl?: string;
  models?: ModelEntry[];
  onMessage?: (message: string) => void;
  onModelChange?: (event: ModelChangeEvent) => void;
  position?: Live2DWidgetPosition;
  runtimeScriptUrl?: string;
  serviceManifestPath?: string;
  serviceModelsPath?: string;
  /** 为 true（默认）时，Next / Shuffle / Talk 走服务端接口，与 `serviceUrl` 配套 */
  useServiceNavigation?: boolean;
  serviceNextPath?: string;
  serviceRandomPath?: string;
  serviceHitokotoPath?: string;
  serviceUrl?: string;
  storageKeyPrefix?: string;
  tips?: Partial<WidgetTipsConfig>;
  tipsUrl?: string;
  /** 显示宽度基准（像素），见 `height` 说明。 */
  width?: number;
  zIndex?: number;
  /**
   * 画布在页面上的垂直偏移。默认略向下（约 8% 高度），让人物更贴底、减轻下方留白。
   * 设为 `"0"` 或 `"none"` 可关闭；仍裁顶时可试略负值如 `-2%`。
   */
  canvasOffsetY?: string;
}

export interface Live2DWidgetInstance {
  ready: Promise<void>;
  destroy(): void;
  getState(): Live2DWidgetState;
  hide(persist?: boolean): void;
  mount(): Promise<void>;
  nextModel(): Promise<void>;
  randomizeModel(): Promise<void>;
  show(): void;
  showMessage(text: TipText, timeoutMs?: number, priority?: number): void;
  switchModel(index: number): Promise<void>;
}
