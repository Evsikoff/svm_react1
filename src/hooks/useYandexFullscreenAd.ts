// useYandexFullscreenAd.ts
import { useCallback, useEffect, useRef, useState } from "react";

const SCRIPT_SRC = "https://yandex.ru/ads/system/context.js";
const BLOCK_ID = "R-A-17258459-2";
const MOBILE_USER_AGENT_REGEX =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

declare global {
  interface Window {
    Ya?: {
      Context?: {
        AdvManager?: {
          render: (options: {
            blockId: string;
            type: string;
            platform: string;
            onRender?: () => void;
            onError?: (error: any) => void;
            onClose?: () => void;
          }) => void;
          isAllowed?: () => boolean;
        };
      };
    };
    yaContextCb?: Array<() => void>;
  }
}

const isDesktopDevice = (): boolean => {
  if (typeof navigator === "undefined") {
    return false;
  }
  return !MOBILE_USER_AGENT_REGEX.test(navigator.userAgent);
};

export const useYandexFullscreenAd = () => {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isShowingAd, setIsShowingAd] = useState(false);
  const initAttemptedRef = useRef(false);

  // Загрузка скрипта
  useEffect(() => {
    if (!isDesktopDevice() || typeof window === "undefined") {
      return;
    }

    // Проверяем, загружен ли скрипт
    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      setIsScriptLoaded(true);
      return;
    }

    // Инициализируем yaContextCb до загрузки скрипта
    window.yaContextCb = window.yaContextCb || [];

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;

    script.onload = () => {
      console.log("Yandex Ads script loaded");
      setIsScriptLoaded(true);
    };

    script.onerror = (error) => {
      console.error("Failed to load Yandex Ads script:", error);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup если необходимо
    };
  }, []);

  // Инициализация рекламного менеджера после загрузки скрипта
  useEffect(() => {
    if (!isScriptLoaded || !isDesktopDevice() || initAttemptedRef.current) {
      return;
    }

    const initializeAdManager = () => {
      if (window.Ya?.Context?.AdvManager) {
        console.log("Ya.Context.AdvManager is available");
        initAttemptedRef.current = true;

        // Проверяем, разрешена ли реклама
        if (window.Ya.Context.AdvManager.isAllowed?.()) {
          console.log("Реклама разрешена на этой странице");
        } else {
          console.warn(
            "Реклама заблокирована. Возможные причины: не HTTPS, localhost, сайт не прошел модерацию в РСЯ или блокировка браузером."
          );
        }
      } else {
        console.log("Ya.Context.AdvManager not available yet, will retry");
      }
    };

    // Пробуем инициализировать сразу
    if (window.Ya?.Context?.AdvManager) {
      initializeAdManager();
    } else {
      // Если не готово, добавляем в очередь callbacks
      window.yaContextCb = window.yaContextCb || [];
      window.yaContextCb.push(() => {
        console.log("Initializing from yaContextCb");
        initializeAdManager();
      });
    }
  }, [isScriptLoaded]);

  const showAd = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!isDesktopDevice()) {
        console.log("Пропуск рекламы — мобильное устройство");
        resolve();
        return;
      }

      if (isShowingAd) {
        console.log("Реклама уже показывается");
        resolve();
        return;
      }

      if (!window.Ya?.Context?.AdvManager?.isAllowed?.()) {
        console.warn(
          "Пропуск рекламы — isAllowed() вернул false. Проверьте HTTPS, модерацию сайта в РСЯ или настройки браузера."
        );
        resolve(); // Или reject(new Error("Реклама не разрешена")) для обработки как ошибки
        return;
      }

      setIsShowingAd(true);

      const completeAdDisplay = (reason: string, isError: boolean = false) => {
        console.log(`Показ рекламы завершен: ${reason}`);
        setIsShowingAd(false);
        if (isError) {
          reject(new Error(reason));
        } else {
          resolve();
        }
      };

      const timeoutId = setTimeout(() => {
        completeAdDisplay("таймаут", true);
      }, 5000); // Увеличьте до 5000 мс для большего времени ожидания

      const attemptShowAd = () => {
        try {
          if (!window.Ya?.Context?.AdvManager) {
            completeAdDisplay("AdvManager недоступен", true);
            return;
          }

          console.log(
            "Вызов Ya.Context.AdvManager.render() с blockId:",
            BLOCK_ID
          );

          window.Ya.Context.AdvManager.render({
            blockId: BLOCK_ID,
            type: "fullscreen",
            platform: "desktop",
            onRender: () => {
              console.log("Реклама успешно отрендерена");
              clearTimeout(timeoutId);
              completeAdDisplay("отрендерено");
            },
            onError: (error: any) => {
              console.error("Ошибка рендера рекламы:", error);
              clearTimeout(timeoutId);
              completeAdDisplay("ошибка", true);
            },
            onClose: () => {
              console.log("Реклама закрыта пользователем");
              clearTimeout(timeoutId);
              completeAdDisplay("закрыто");
            },
          });
        } catch (error) {
          console.error("Исключение при вызове render:", error);
          clearTimeout(timeoutId);
          completeAdDisplay("исключение", true);
        }
      };

      if (window.Ya?.Context?.AdvManager) {
        attemptShowAd();
      } else if (window.yaContextCb) {
        window.yaContextCb.push(attemptShowAd);
      } else {
        completeAdDisplay("скрипт не готов", true);
      }
    });
  }, [isShowingAd]);

  return {
    showAd,
    isDesktop: isDesktopDevice(),
    isReady: isScriptLoaded && !!window.Ya?.Context?.AdvManager,
  };
};
