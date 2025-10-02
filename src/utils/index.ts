// Обновленные утилиты в src/utils/index.ts

// Кеш для предотвращения дублированных запросов
const requestCache = new Map<
  string,
  { promise: Promise<any>; timestamp: number }
>();
const CACHE_TTL = 10000; // 10 секунд

// Функция для очистки устаревших записей в кеше
const cleanCache = () => {
  const now = Date.now();
  for (const [key, value] of requestCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      requestCache.delete(key);
    }
  }
};

// Новая функция для бесконечных ретраев с кешированием
export async function withInfiniteRetryAndTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number = 5000,
  labelForError: string,
  onError?: (error: string) => void,
  enableCache: boolean = true
): Promise<T> {
  // Очищаем устаревший кеш
  cleanCache();

  // Создаем ключ для кеширования на основе функции и метки
  const cacheKey = enableCache
    ? `${labelForError}_${fn.toString().slice(0, 100)}`
    : null;

  // Проверяем кеш
  if (cacheKey && requestCache.has(cacheKey)) {
    const cached = requestCache.get(cacheKey)!;
    const age = Date.now() - cached.timestamp;

    // Если запрос свежий (младше 5 секунд), возвращаем его
    if (age < 5000) {
      try {
        return await cached.promise;
      } catch (error) {
        // Если кешированный запрос упал, удаляем его из кеша
        requestCache.delete(cacheKey);
      }
    } else {
      // Удаляем устаревший запрос
      requestCache.delete(cacheKey);
    }
  }

  // Создаем новый запрос
  const executeRequest = async (): Promise<T> => {
    while (true) {
      try {
        const result = await Promise.race([
          fn(),
          new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), timeoutMs)
          ),
        ]);
        return result;
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Unknown error";
        if (errorMessage === "Timeout") {
          console.warn(`Timeout for ${labelForError}, retrying...`);
          await new Promise((resolve) => setTimeout(resolve, 300));
          continue;
        }
        const text = `${labelForError}: ${errorMessage}`;
        if (onError) {
          onError(text);
        }
        throw new Error(text);
      }
    }
  };

  const requestPromise = executeRequest();

  // Сохраняем в кеш только если кеширование включено
  if (cacheKey) {
    requestCache.set(cacheKey, {
      promise: requestPromise,
      timestamp: Date.now(),
    });
  }

  return requestPromise;
}

export const getVKParams = (): {
  VK: boolean;
  VKdesktop: boolean;
  sign: string | null;
  vkUserId: string | null;
} => {
  if (typeof window === "undefined") {
    return {
      VK: false,
      VKdesktop: false,
      sign: null,
      vkUserId: null,
    };
  }

  const search = window.location?.search ?? "";
  const params = new URLSearchParams(search);

  const platform = params.get("vk_platform");
  const VKdesktop = platform === "desktop_web";

  if (!params.has("vk_user_id")) {
    return {
      VK: false,
      VKdesktop,
      sign: null,
      vkUserId: null,
    };
  }

  const VK = true;

  return {
    VK,
    VKdesktop,
    sign: params.get("sign"),
    vkUserId: params.get("vk_user_id"),
  };
};

// Остальные функции остаются без изменений
export const invalidateImageCache = (url: string): string => {
  const timestamp = Date.now();
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}t=${timestamp}`;
};

export const getFingerprint = (): string => {
  const components = [
    navigator.userAgent,
    navigator.language,
    String(screen.colorDepth),
    String(screen.width),
    String(screen.height),
    String(screen.availWidth),
    String(screen.availHeight),
    String(new Date().getTimezoneOffset()),
  ];
  return btoa(components.join("|"));
};

export const formatTimer = (timeInSeconds: number): string => {
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = timeInSeconds % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} часов`);
  if (minutes > 0 || hours > 0) parts.push(`${minutes} минут`);
  parts.push(`${seconds} секунд`);
  return parts.join(" ");
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  isValid: (v: T) => boolean,
  labelForError: string,
  onError?: (error: string) => void
): Promise<T> {
  let lastErr: any = null;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fn();
      if (!isValid(res)) {
        throw new Error("Пустой или некорректный ответ");
      }
      return res;
    } catch (e) {
      lastErr = e;
      if (attempt < 4) {
        await new Promise((r) => setTimeout(r, 300));
        continue;
      }
    }
  }

  const text =
    typeof lastErr?.message === "string"
      ? `${labelForError}: ${lastErr.message}`
      : `${labelForError}`;

  if (onError) {
    onError(text);
  }

  throw lastErr;
}

export const getImageDimensions = (
  imageUrl: string
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.onerror = () => {
      reject(new Error(`Не удалось загрузить изображение: ${imageUrl}`));
    };
    img.src = imageUrl;
  });
};

export const getMultipleImageDimensions = async (
  imageUrls: string[]
): Promise<Record<string, { width: number; height: number }>> => {
  const results: Record<string, { width: number; height: number }> = {};
  const promises = imageUrls.map(async (url) => {
    try {
      const dimensions = await getImageDimensions(url);
      results[url] = dimensions;
    } catch (error) {
      console.warn(`Ошибка получения размеров для ${url}:`, error);
      results[url] = { width: 50, height: 50 };
    }
  });
  await Promise.all(promises);
  return results;
};

export const calculateDisplaySize = (
  originalWidth: number,
  originalHeight: number,
  maxSize: number = 80
): { width: number; height: number; scale: number } => {
  const scale = Math.min(maxSize / originalWidth, maxSize / originalHeight, 1);
  return {
    width: Math.round(originalWidth * scale),
    height: Math.round(originalHeight * scale),
    scale,
  };
};
