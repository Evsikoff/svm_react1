import React, { useRef, useEffect, useState, useCallback } from "react";

// Кэш промисов загрузки изображений для предотвращения повторных запросов
const imageCache = new Map<string, Promise<HTMLImageElement>>();

// Локальные типы для предметов в комнате
interface RoomItem {
  id: number;
  name: string;
  spriteUrl: string;
  placement: string;
  xaxis: number;
  yaxis: number;
}

interface CompositeRoomRendererProps {
  roomImage: string;
  monsterImage: string;
  roomItems: RoomItem[];
  isLoading: boolean;
  className?: string;
}

const CompositeRoomRenderer: React.FC<CompositeRoomRendererProps> = ({
  roomImage,
  monsterImage,
  roomItems,
  isLoading,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [aspect, setAspect] = useState<string>("4/3");

  // Функция для загрузки изображения с кэшированием
  const loadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    if (imageCache.has(src)) {
      return imageCache.get(src)!;
    }

    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        // Стартуем декодирование, но не блокируемся на нём,
        // чтобы избежать зависаний из-за неразрешившегося decode()
        img.decode?.().catch(() => {});
        resolve(img);
      };

      img.onerror = () => {
        reject(new Error(`Не удалось загрузить изображение: ${src}`));
      };

      img.src = src;
    }).catch((err) => {
      imageCache.delete(src);
      throw err;
    });

    imageCache.set(src, promise);
    return promise;
  }, []);

  // Основная функция генерации композитного изображения
  const renderId = useRef(0);

  const generateCompositeImage = useCallback(async () => {
    if (!roomImage || !canvasRef.current) return;

    const currentId = ++renderId.current;
    setIsGenerating(true);
    setError(null);
    setIsReady(false);

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Не удалось получить контекст canvas");

      // Загружаем фон и все спрайты параллельно
      const backgroundPromise = loadImage(roomImage);
      const spritesPromise = Promise.all(
        roomItems.map(async (item) => {
          try {
            const spriteImg = await loadImage(item.spriteUrl);
            return { item, spriteImg } as const;
          } catch (error) {
            console.warn(`Ошибка загрузки спрайта ${item.name}:`, error);
            return null;
          }
        })
      );

      const [backgroundImg, loadedSpritesRaw] = await Promise.all([
        backgroundPromise,
        spritesPromise,
      ]);

      if (renderId.current !== currentId) return; // отмена

      const loadedSprites = loadedSpritesRaw.filter(
        (result): result is { item: RoomItem; spriteImg: HTMLImageElement } =>
          result !== null
      );

      // Устанавливаем размеры canvas по фону
      canvas.width = backgroundImg.naturalWidth;
      canvas.height = backgroundImg.naturalHeight;
      setAspect(`${backgroundImg.naturalWidth / backgroundImg.naturalHeight}`);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(backgroundImg, 0, 0);

      loadedSprites.forEach(({ item, spriteImg }) => {
        const centerX = (item.xaxis / 100) * canvas.width;
        const centerY = (item.yaxis / 100) * canvas.height;
        const spriteX = centerX - spriteImg.naturalWidth / 2;
        const spriteY = centerY - spriteImg.naturalHeight / 2;
        ctx.drawImage(
          spriteImg,
          spriteX,
          spriteY,
          spriteImg.naturalWidth,
          spriteImg.naturalHeight
        );
      });

      if (renderId.current !== currentId) return; // проверка отмены после рисования

      setIsReady(true);
    } catch (err) {
      console.error("Ошибка при генерации композитного изображения:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Неизвестная ошибка при создании композитного изображения"
      );
    } finally {
      if (renderId.current === currentId) {
        setIsGenerating(false);
      }
    }
  }, [roomImage, roomItems, loadImage]);

  // Запускаем генерацию при изменении данных
  useEffect(() => {
    if (roomImage && !isLoading) {
      generateCompositeImage();
    }
  }, [roomImage, roomItems, isLoading, generateCompositeImage]);

  // Управление видимостью canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      if (isReady) {
        canvas.style.display = "block";
        canvas.style.width = "100%";
        canvas.style.height = "100%";
      } else {
        canvas.style.display = "none";
      }
    }
  }, [isReady]);

  const showSpinner = isLoading || isGenerating;

  return (
    <div className={`relative ${className}`}>
      {/* Контейнер для отображения */}
      <div
        className="relative w-full bg-white overflow-hidden"
        style={{ aspectRatio: aspect }}
      >
        {/* Canvas всегда в DOM, но visibility управляется через стиль */}
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            display: "none",
          }}
          aria-hidden="true"
        />

        {showSpinner ? (
          // Спиннер во время загрузки/генерации
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-purple-600 font-medium">
                {isLoading
                  ? "Загрузка..."
                  : isGenerating
                  ? "Формирование комнаты..."
                  : "Подготовка..."}
              </span>
            </div>
          </div>
        ) : error ? (
          // Ошибка
          <div className="absolute inset-0 flex items-center justify-center bg-red-50">
            <div className="text-center p-4">
              <div className="text-red-500 text-2xl mb-2">⚠️</div>
              <div className="text-red-700 text-sm font-medium mb-2">
                Ошибка формирования комнаты
              </div>
              <div className="text-red-600 text-xs max-w-xs">{error}</div>
            </div>
          </div>
        ) : (
          // Готовое изображение (canvas видим через стиль)
          <div className="relative w-full h-full">
            {/* Монстр поверх */}
            {monsterImage && (
              <img
                src={monsterImage}
                alt="Monster"
                className="absolute bottom-[10%] left-1/2 w-1/2 transform -translate-x-1/2"
                style={{ zIndex: 10 }}
                onError={(e) => {
                  console.warn(
                    `Ошибка загрузки изображения монстра: ${monsterImage}`
                  );
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompositeRoomRenderer;
