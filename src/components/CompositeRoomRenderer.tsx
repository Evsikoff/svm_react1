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
  onReady?: () => void;
}

const CompositeRoomRenderer: React.FC<CompositeRoomRendererProps> = ({
  roomImage,
  monsterImage,
  roomItems,
  isLoading,
  className = "",
  onReady,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [aspect, setAspect] = useState<string>("4/3");
  const [monsterLoaded, setMonsterLoaded] = useState<boolean>(false);

  // Функция для загрузки изображения с обработкой CORS
  const loadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    // Возвращаем уже созданный промис, если изображение уже загружается или загружено
    if (imageCache.has(src)) {
      return imageCache.get(src)!;
    }

    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();

      // Настройка CORS - пробуем разные варианты
      img.crossOrigin = "anonymous";

      img.onload = () => {
        resolve(img);
      };

      img.onerror = (error) => {
        console.warn(`Ошибка загрузки изображения ${src}:`, error);
        // Пробуем загрузить без CORS
        const imgFallback = new Image();
        imgFallback.onload = () => resolve(imgFallback);
        imgFallback.onerror = () =>
          reject(new Error(`Не удалось загрузить изображение: ${src}`));
        imgFallback.src = src;
      };

      img.src = src;
    }).catch((err) => {
      // Если загрузка провалилась, удаляем запись из кэша, чтобы можно было повторить
      imageCache.delete(src);
      throw err;
    });

    imageCache.set(src, promise);
    return promise;
  }, []);

  // Основная функция генерации композитного изображения
  const generateCompositeImage = useCallback(async () => {
    if (!roomImage || !canvasRef.current) return;

    setIsGenerating(true);
    setError(null);
    setIsReady(false);

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Не удалось получить контекст canvas");

      // 1. Загружаем фоновое изображение
      console.log("Загружаем фоновое изображение:", roomImage);
      const backgroundImg = await loadImage(roomImage);

      // Устанавливаем размер canvas равным размеру фонового изображения
      canvas.width = backgroundImg.naturalWidth;
      canvas.height = backgroundImg.naturalHeight;

      // Устанавливаем aspect ratio
      setAspect(`${backgroundImg.naturalWidth / backgroundImg.naturalHeight}`);

      console.log(`Размер canvas: ${canvas.width}x${canvas.height}`);

      // 2. Рисуем фон
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(backgroundImg, 0, 0);

      // 3. Загружаем все спрайты предметов параллельно
      console.log(`Загружаем ${roomItems.length} спрайтов предметов`);
      const spritePromises = roomItems.map(async (item) => {
        try {
          console.log(`Загружаем спрайт: ${item.name} - ${item.spriteUrl}`);
          const spriteImg = await loadImage(item.spriteUrl);
          return { item, spriteImg };
        } catch (error) {
          console.warn(`Ошибка загрузки спрайта ${item.name}:`, error);
          return null;
        }
      });

      const loadedSprites = (await Promise.all(spritePromises)).filter(
        (result): result is { item: RoomItem; spriteImg: HTMLImageElement } =>
          result !== null
      );
      console.log(
        `Успешно загружено ${loadedSprites.length} из ${roomItems.length} спрайтов`
      );

      // 4. Накладываем спрайты на фон
      loadedSprites.forEach((spriteData) => {
        const { item, spriteImg } = spriteData;

        // Вычисляем позицию центра спрайта на canvas
        const centerX = (item.xaxis / 100) * canvas.width;
        const centerY = (item.yaxis / 100) * canvas.height;

        // Вычисляем координаты левого верхнего угла спрайта
        const spriteX = centerX - spriteImg.naturalWidth / 2;
        const spriteY = centerY - spriteImg.naturalHeight / 2;

        console.log(
          `Размещаем спрайт ${item.name} в позиции (${centerX}, ${centerY}), размер: ${spriteImg.naturalWidth}x${spriteImg.naturalHeight}`
        );

        // Рисуем спрайт
        ctx.drawImage(
          spriteImg,
          spriteX,
          spriteY,
          spriteImg.naturalWidth,
          spriteImg.naturalHeight
        );
      });

      // Поскольку мы отображаем canvas напрямую, нет нужды в toDataURL
      setIsReady(true);
      console.log("Композитное изображение создано успешно");
    } catch (err) {
      console.error("Ошибка при генерации композитного изображения:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Неизвестная ошибка при создании композитного изображения"
      );
      onReady?.();
    } finally {
      setIsGenerating(false);
    }
  }, [roomImage, roomItems, loadImage, onReady]);

  // Запускаем генерацию при изменении данных
  useEffect(() => {
    if (roomImage) {
      generateCompositeImage();
    }
  }, [roomImage, roomItems, generateCompositeImage]);

  // Сброс флага загрузки монстра при смене изображения
  useEffect(() => {
    setMonsterLoaded(false);
  }, [monsterImage]);

  // Сообщаем родителю, когда и фон, и монстр загружены
  useEffect(() => {
    if (isReady && monsterLoaded && roomImage && monsterImage) {
      onReady?.();
    }
  }, [isReady, monsterLoaded, roomImage, monsterImage, onReady]);

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
                onLoad={() => setMonsterLoaded(true)}
                onError={() => {
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
