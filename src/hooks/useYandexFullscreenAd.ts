import { useCallback, useEffect, useRef, useState } from "react";

const SCRIPT_SRC = "https://yandex.ru/ads/system/context.js";
const BLOCK_ID = "R-A-17258459-2";
const MOBILE_USER_AGENT_REGEX = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

declare global {
  interface Window {
    Ya?: {
      Context?: {
        AdvManager?: {
          render: (options: {
            blockId: string;
            type: string;
            platform: string;
          }) => void;
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
  const scriptLoadedRef = useRef(false);
  const [isShowingAd, setIsShowingAd] = useState(false);

  const ensureScript = useCallback((): Promise<void> => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return Promise.resolve();
    }

    // Инициализируем yaContextCb
    window.yaContextCb = window.yaContextCb || [];

    // Если скрипт уже загружен, возвращаем успех
    if (scriptLoadedRef.current || document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      scriptLoadedRef.current = true;
      return Promise.resolve();
    }

    // Возвращаем промис загрузки скрипта
    return new Promise<void>((resolve) => {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      
      script.onload = () => {
        scriptLoadedRef.current = true;
        console.log("Yandex Ads script loaded successfully");
        resolve();
      };
      
      script.onerror = () => {
        console.error("Failed to load Yandex Ads script");
        resolve(); // Резолвим даже при ошибке, чтобы не блокировать закрытие
      };
      
      document.head.appendChild(script);
    });
  }, []);

  useEffect(() => {
    // Загружаем скрипт только для десктопов при монтировании компонента
    if (isDesktopDevice()) {
      ensureScript();
    }
  }, [ensureScript]);

  const showAd = useCallback(async (): Promise<void> => {
    // Если уже показываем рекламу, просто возвращаем резолв
    if (isShowingAd) {
      console.log("Ad is already being shown, skipping...");
      return Promise.resolve();
    }

    // Для мобильных устройств сразу резолвим
    if (!isDesktopDevice() || typeof window === "undefined") {
      console.log("Skipping ad - not a desktop device");
      return Promise.resolve();
    }

    // Устанавливаем флаг, что начали показ рекламы
    setIsShowingAd(true);

    try {
      // Убеждаемся, что скрипт загружен
      await ensureScript();

      return new Promise<void>((resolve) => {
        // Устанавливаем короткий таймаут для тестовой среды
        const timeoutMs = window.location.hostname === 'localhost' || 
                         window.location.hostname.includes('codesandbox') ||
                         window.location.hostname.includes('stackblitz') ? 500 : 3000;

        const timeoutId = window.setTimeout(() => {
          console.log("Ad display timeout - proceeding without ad");
          setIsShowingAd(false);
          resolve();
        }, timeoutMs);

        const finishWithAd = () => {
          window.clearTimeout(timeoutId);
          console.log("Ad display completed");
          setIsShowingAd(false);
          resolve();
        };

        try {
          if (window.Ya?.Context?.AdvManager) {
            console.log("Attempting to show Yandex fullscreen ad");
            
            // Показываем рекламу
            window.Ya.Context.AdvManager.render({
              blockId: BLOCK_ID,
              type: "fullscreen",
              platform: "desktop"
            });
            
            // Даем небольшое время на отображение
            setTimeout(finishWithAd, 100);
          } else {
            console.log("Ya.Context.AdvManager not available, adding to callback queue");
            
            // Если API еще не готово, добавляем в очередь
            window.yaContextCb = window.yaContextCb || [];
            
            // Создаем одноразовый callback
            const adCallback = () => {
              console.log("Showing ad from callback queue");
              try {
                window.Ya?.Context?.AdvManager?.render({
                  blockId: BLOCK_ID,
                  type: "fullscreen",
                  platform: "desktop"
                });
              } catch (error) {
                console.error("Error showing ad from callback:", error);
              }
              
              // Удаляем себя из очереди после выполнения
              const index = window.yaContextCb?.indexOf(adCallback);
              if (index !== undefined && index > -1) {
                window.yaContextCb?.splice(index, 1);
              }
              
              finishWithAd();
            };
            
            window.yaContextCb.push(adCallback);
          }
        } catch (error) {
          console.error("Error showing Yandex ad:", error);
          finishWithAd();
        }
      });
    } finally {
      // Гарантируем сброс флага в случае ошибки
      setTimeout(() => {
        setIsShowingAd(false);
      }, 5000);
    }
  }, [ensureScript, isShowingAd]);

  return { 
    showAd, 
    isDesktop: isDesktopDevice(),
    isShowingAd // Экспортируем состояние для отладки
  };
};