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
          console.log("Ads are allowed on this page");
        } else {
          console.warn("Ads might be blocked on this page");
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
    return new Promise((resolve) => {
      // Для мобильных устройств сразу резолвим
      if (!isDesktopDevice()) {
        console.log("Skipping ad - mobile device");
        resolve();
        return;
      }

      // Проверяем, не показываем ли уже рекламу
      if (isShowingAd) {
        console.log("Ad is already being shown");
        resolve();
        return;
      }

      setIsShowingAd(true);

      // Функция для завершения показа рекламы
      const completeAdDisplay = (reason: string) => {
        console.log(`Ad display completed: ${reason}`);
        setIsShowingAd(false);
        resolve();
      };

      // Устанавливаем таймаут
      const timeoutId = setTimeout(() => {
        completeAdDisplay("timeout");
      }, 3000);

      // Функция для попытки показа рекламы
      const attemptShowAd = () => {
        try {
          if (!window.Ya?.Context?.AdvManager) {
            console.warn("Ya.Context.AdvManager not available");
            completeAdDisplay("no AdvManager");
            return;
          }

          console.log("Calling Ya.Context.AdvManager.render()");

          // Вызываем render с callbacks
          window.Ya.Context.AdvManager.render({
            blockId: BLOCK_ID,
            type: "fullscreen",
            platform: "desktop",
            onRender: () => {
              console.log("Ad rendered successfully");
              clearTimeout(timeoutId);
              // Даем время на показ рекламы
              setTimeout(() => completeAdDisplay("rendered"), 1000);
            },
            onError: (error: any) => {
              console.error("Ad render error:", error);
              clearTimeout(timeoutId);
              completeAdDisplay("error");
            },
            onClose: () => {
              console.log("Ad closed by user");
              clearTimeout(timeoutId);
              completeAdDisplay("closed");
            },
          });

          // Если callbacks не сработали через 500мс, считаем что реклама показана
          setTimeout(() => {
            if (isShowingAd) {
              clearTimeout(timeoutId);
              completeAdDisplay("assumed shown");
            }
          }, 500);
        } catch (error) {
          console.error("Error calling render:", error);
          clearTimeout(timeoutId);
          completeAdDisplay("exception");
        }
      };

      // Пробуем показать рекламу
      if (window.Ya?.Context?.AdvManager) {
        attemptShowAd();
      } else if (isScriptLoaded) {
        // Если скрипт загружен, но AdvManager еще не готов, ждем
        window.yaContextCb = window.yaContextCb || [];
        window.yaContextCb.push(() => {
          attemptShowAd();
        });
      } else {
        // Если скрипт еще не загружен
        console.warn("Script not loaded yet");
        completeAdDisplay("script not loaded");
      }
    });
  }, [isShowingAd, isScriptLoaded]);

  return {
    showAd,
    isDesktop: isDesktopDevice(),
    isReady: isScriptLoaded && !!window.Ya?.Context?.AdvManager,
  };
};
