// Функция для сброса кеша изображений
export const invalidateImageCache = (url: string): string => {
  const timestamp = Date.now();
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}t=${timestamp}`;
};

// Форматирование таймера
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

// Универсальная обёртка с повторами
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
