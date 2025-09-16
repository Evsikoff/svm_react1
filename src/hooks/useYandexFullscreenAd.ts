import { useCallback, useEffect } from "react";

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
  const ensureScript = useCallback(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    window.yaContextCb = window.yaContextCb || [];

    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!isDesktopDevice()) {
      return;
    }

    ensureScript();
  }, [ensureScript]);

  const showAd = useCallback((): Promise<void> => {
    if (!isDesktopDevice() || typeof window === "undefined") {
      return Promise.resolve();
    }

    ensureScript();

    return new Promise<void>((resolve) => {
      let resolved = false;
      const finish = () => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      };

      const timeoutId = window.setTimeout(finish, 3000);

      const renderAd = () => {
        window.clearTimeout(timeoutId);
        try {
          window.Ya?.Context?.AdvManager?.render({
            blockId: BLOCK_ID,
            type: "fullscreen",
            platform: "desktop",
          });
        } catch (error) {
          console.error("Не удалось отобразить рекламу Яндекса", error);
        }
        finish();
      };

      if (window.Ya?.Context?.AdvManager) {
        renderAd();
        return;
      }

      window.yaContextCb = window.yaContextCb || [];
      window.yaContextCb.push(renderAd);
    });
  }, [ensureScript]);

  return { showAd };
};
