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
      console.log(
        "Пропуск загрузки скрипта: мобильное устройство или серверный рендеринг"
      );
      return;
    }

    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      setIsScriptLoaded(true);
      console.log("Скрипт Яндекс РСЯ уже загружен");
      return;
    }

    window.yaContextCb = window.yaContextCb || [];

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;

    script.onload = () => {
      console.log("Скрипт Яндекс РСЯ загружен");
      setIsScriptLoaded(true);
    };

    script.onerror = (error) => {
      console.error("Ошибка загрузки скрипта Яндекс РСЯ:", error);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup если необходимо
    };
  }, []);

  // Инициализация рекламного менеджера
  useEffect(() => {
    if (!isScriptLoaded || !isDesktopDevice() || initAttemptedRef.current) {
      return;
    }

    const initializeAdManager = () => {
      if (window.Ya?.Context?.AdvManager) {
        console.log("Ya.Context.AdvManager доступен");
        initAttemptedRef.current = true;

        if (window.Ya.Context.AdvManager.isAllowed?.()) {
          console.log("Реклама разрешена на странице");
        } else {
          console.warn(
            "Реклама заблокирована. Возможные причины: не HTTPS, localhost, " +
              "сайт не прошел модерацию в РСЯ, блокировка браузером или отсутствие инвентаря. " +
              "Текущий URL: " +
              window.location.href
          );
        }
      } else {
        console.log("Ya.Context.AdvManager недоступен, повторная попытка");
      }
    };

    if (window.Ya?.Context?.AdvManager) {
      initializeAdManager();
    } else {
      window.yaContextCb = window.yaContextCb || [];
      window.yaContextCb.push(() => {
        console.log("Инициализация через yaContextCb");
        initializeAdManager();
      });
    }
  }, [isScriptLoaded]);

  const showAd = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!isDesktopDevice()) {
        console.log("Пропуск рекламы: мобильное устройство");
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
          "Пропуск рекламы: isAllowed() вернул false. Проверьте HTTPS, модерацию сайта в РСЯ, " +
            "настройки браузера или наличие инвентаря. URL: " +
            window.location.href
        );
        reject(new Error("Реклама не разрешена"));
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
      }, 5000);

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
