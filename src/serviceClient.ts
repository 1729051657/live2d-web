export interface Live2dServiceClientOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
  manifestPath?: string;
  nextPath?: string;
  randomPath?: string;
  hitokotoPath?: string;
  healthPath?: string;
}

function joinUrl(baseUrl: string, path: string): string {
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(path, base).toString();
}

export interface ModelListPayload {
  serviceName?: string;
  models: (string | string[])[];
  messages?: string[];
  modelBaseUrl?: string;
}

export interface NavigateResponse {
  nextIndex: number;
  message?: string;
}

export interface HitokotoPayload {
  hitokoto?: string;
  from?: string;
  creator?: string;
  error?: string;
}

export interface Live2dServiceClient {
  getModelList(): Promise<ModelListPayload>;
  next(prevIndex: number): Promise<NavigateResponse>;
  random(currentIndex: number): Promise<NavigateResponse>;
  hitokoto(): Promise<HitokotoPayload>;
  health(): Promise<unknown>;
}

export function createLive2dServiceClient(options: Live2dServiceClientOptions): Live2dServiceClient {
  const {
    baseUrl,
    fetchImpl = globalThis.fetch.bind(globalThis),
    manifestPath = "api/model-list",
    nextPath = "api/next",
    randomPath = "api/random",
    hitokotoPath = "api/hitokoto",
    healthPath = "api/health"
  } = options;

  async function getModelList(): Promise<ModelListPayload> {
    const response = await fetchImpl(joinUrl(baseUrl, manifestPath));
    if (!response.ok) {
      throw new Error(`model-list failed: ${response.status}`);
    }

    return (await response.json()) as ModelListPayload;
  }

  async function next(prevIndex: number): Promise<NavigateResponse> {
    const url = `${joinUrl(baseUrl, nextPath)}?prev=${encodeURIComponent(String(prevIndex))}`;
    const response = await fetchImpl(url);
    if (!response.ok) {
      throw new Error(`next failed: ${response.status}`);
    }

    return (await response.json()) as NavigateResponse;
  }

  async function random(currentIndex: number): Promise<NavigateResponse> {
    const url = `${joinUrl(baseUrl, randomPath)}?current=${encodeURIComponent(String(currentIndex))}`;
    const response = await fetchImpl(url);
    if (!response.ok) {
      throw new Error(`random failed: ${response.status}`);
    }

    return (await response.json()) as NavigateResponse;
  }

  async function hitokoto(): Promise<HitokotoPayload> {
    const response = await fetchImpl(joinUrl(baseUrl, hitokotoPath));
    if (!response.ok) {
      throw new Error(`hitokoto failed: ${response.status}`);
    }

    return (await response.json()) as HitokotoPayload;
  }

  async function health(): Promise<unknown> {
    const response = await fetchImpl(joinUrl(baseUrl, healthPath));
    if (!response.ok) {
      throw new Error(`health failed: ${response.status}`);
    }

    return response.json();
  }

  return {
    getModelList,
    next,
    random,
    hitokoto,
    health
  };
}
