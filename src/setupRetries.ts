import axios, { AxiosError, AxiosRequestConfig } from "axios";

const EXCLUDE_URL = "https://functions.yandexcloud.net/d4euroa2kfgg47hna4f0";

axios.interceptors.request.use((config: AxiosRequestConfig) => {
  if (config.url !== EXCLUDE_URL && !config.timeout) {
    config.timeout = 5000;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config;
    if (
      error.code === "ECONNABORTED" &&
      config &&
      config.url !== EXCLUDE_URL
    ) {
      return axios(config);
    }
    return Promise.reject(error);
  }
);

if (typeof window !== "undefined" && window.fetch) {
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input.url;
    if (url === EXCLUDE_URL) {
      return originalFetch(input, init);
    }
    const attempt = (): Promise<Response> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const finalInit = { ...(init || {}), signal: controller.signal };
      return originalFetch(input, finalInit)
        .then((res) => {
          clearTimeout(timeoutId);
          return res;
        })
        .catch((err) => {
          clearTimeout(timeoutId);
          if (err.name === "AbortError") {
            return attempt();
          }
          throw err;
        });
    };
    return attempt();
  };
}

export {}; // ensure this file is treated as a module
