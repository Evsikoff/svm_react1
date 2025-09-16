import React, { useEffect } from "react";

// Используем существующие типы из хука
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

const YandexAdTest: React.FC = () => {
  useEffect(() => {
    // Инициализируем yaContextCb
    window.yaContextCb = window.yaContextCb || [];

    // Загружаем скрипт если его еще нет
    if (
      !document.querySelector(
        'script[src="https://yandex.ru/ads/system/context.js"]'
      )
    ) {
      const script = document.createElement("script");
      script.src = "https://yandex.ru/ads/system/context.js";
      script.async = true;
      document.head.appendChild(script);
    }

    // Добавляем функцию для показа рекламы
    const showTestAd = () => {
      console.log("Attempting to show test ad");
      if (window.Ya?.Context?.AdvManager) {
        try {
          window.Ya.Context.AdvManager.render({
            blockId: "R-A-17258459-2",
            type: "fullscreen",
            platform: "desktop",
          });
          console.log("Test ad render called");
        } catch (error) {
          console.error("Test ad error:", error);
        }
      } else {
        console.log("AdvManager not available for test");
      }
    };

    // Пробуем показать через callback
    window.yaContextCb.push(showTestAd);

    // И пробуем показать сразу, если уже загружено
    setTimeout(showTestAd, 1000);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded shadow-lg z-50">
      <h3 className="font-bold mb-2">Тест рекламы Яндекс</h3>
      <button
        onClick={() => {
          console.log("Manual ad test");
          if (window.Ya?.Context?.AdvManager) {
            try {
              window.Ya.Context.AdvManager.render({
                blockId: "R-A-17258459-2",
                type: "fullscreen",
                platform: "desktop",
              });
            } catch (error) {
              console.error("Manual test error:", error);
            }
          } else {
            console.log("AdvManager not available");
          }
        }}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Показать рекламу вручную
      </button>
      <div className="mt-2 text-xs">
        <div>Ya: {window.Ya ? "✓" : "✗"}</div>
        <div>Context: {window.Ya?.Context ? "✓" : "✗"}</div>
        <div>AdvManager: {window.Ya?.Context?.AdvManager ? "✓" : "✗"}</div>
      </div>
    </div>
  );
};

export default YandexAdTest;
