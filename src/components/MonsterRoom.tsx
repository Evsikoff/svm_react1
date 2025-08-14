import React, { useRef, useEffect, useState } from "react";
import { RoomItem, MonsterCharacteristic } from "../types";
import Spinner from "./Spinner";

interface MonsterRoomProps {
  roomImage: string;
  monsterImage: string;
  roomItems: RoomItem[];
  characteristics: MonsterCharacteristic[];
  isLoading: boolean;
}

const MonsterRoom: React.FC<MonsterRoomProps> = ({
  roomImage,
  monsterImage,
  roomItems,
  characteristics,
  isLoading,
}) => {
  const roomBgRef = useRef<HTMLImageElement>(null);
  const [roomBgSize, setRoomBgSize] = useState<{
    width: number;
    height: number;
  }>({
    width: 1,
    height: 1,
  });
  const [roomItemSizes, setRoomItemSizes] = useState<
    Record<number, { width: number; height: number }>
  >({});

  // Загрузка размеров спрайтов предметов
  useEffect(() => {
    if (roomItems.length === 0) {
      setRoomItemSizes({});
      return;
    }

    let isMounted = true;
    const sizes: Record<number, { width: number; height: number }> = {};
    const promises = roomItems.map((item) => {
      return new Promise<void>((resolve) => {
        const img = new window.Image();
        img.onload = () => {
          sizes[item.id] = { width: img.width, height: img.height };
          resolve();
        };
        img.onerror = () => {
          console.warn(
            `Ошибка загрузки спрайта для предмета ${item.id}: ${item.spriteUrl}`
          );
          sizes[item.id] = { width: 0, height: 0 };
          resolve();
        };
        img.src = item.spriteUrl;
      });
    });

    Promise.all(promises).then(() => {
      if (isMounted) setRoomItemSizes(sizes);
    });

    return () => {
      isMounted = false;
    };
  }, [roomItems]);

  // Обновление размера фоновой картинки
  useEffect(() => {
    function updateSize() {
      if (roomBgRef.current) {
        setRoomBgSize({
          width: roomBgRef.current.clientWidth,
          height: roomBgRef.current.clientHeight,
        });
      }
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => {
      window.removeEventListener("resize", updateSize);
    };
  }, [roomImage]);

  return (
    <div className="w-full md:w-1/2 border border-gray-300 bg-orange-100">
      {roomImage && monsterImage && (
        <div
          className="relative"
          style={{
            width: "100%",
            aspectRatio: "4/3",
            background: "#fff",
          }}
        >
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
              <Spinner size="medium" />
            </div>
          ) : (
            <>
              <img
                src={roomImage}
                alt="Room"
                ref={roomBgRef}
                className="w-full h-full object-contain"
                style={{
                  display: "block",
                  zIndex: 1,
                  position: "relative",
                  pointerEvents: "none",
                  background: "#fff",
                }}
                onLoad={() => {
                  if (roomBgRef.current) {
                    setRoomBgSize({
                      width: roomBgRef.current.clientWidth,
                      height: roomBgRef.current.clientHeight,
                    });
                  }
                }}
              />
              {/* Предметы */}
              {roomItems.map((item) => {
                const size = roomItemSizes[item.id];
                if (!size || size.width === 0 || size.height === 0) return null;

                const bgW = roomBgSize.width;
                const bgH = roomBgSize.height;
                const cx = (item.xaxis / 100) * bgW;
                const cy = (item.yaxis / 100) * bgH;
                const leftPx = cx - size.width / 2;
                const topPx = cy - size.height / 2;

                return (
                  <img
                    key={item.id}
                    src={item.spriteUrl}
                    alt={item.name}
                    title={item.name}
                    style={{
                      position: "absolute",
                      left: `${leftPx}px`,
                      top: `${topPx}px`,
                      width: `${size.width}px`,
                      height: `${size.height}px`,
                      zIndex: 5,
                      pointerEvents: "auto",
                    }}
                  />
                );
              })}
              {/* Монстр поверх */}
              <img
                src={monsterImage}
                alt="Monster"
                className="absolute bottom-[10%] left-1/2 w-1/2 transform -translate-x-1/2"
                style={{ zIndex: 10 }}
              />
            </>
          )}
        </div>
      )}

      {/* Характеристики */}
      <div className="mt-4 space-y-2 p-2">
        {characteristics
          .slice()
          .sort((a, b) => b.value - a.value)
          .map((char) => (
            <div
              key={char.id}
              className="flex items-center space-x-2 bg-purple-100 p-2 shadow border border-gray-300"
            >
              <img src={char.icon} alt={char.name} className="w-8 h-8" />
              <span className="text-purple-700 font-semibold">
                {char.name}: {char.value}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
};

export default MonsterRoom;
