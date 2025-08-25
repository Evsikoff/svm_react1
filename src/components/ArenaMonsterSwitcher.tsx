import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { API_URLS } from "../constants";
import { ArenaMonster, ArenaMonstersResponse } from "../types";

const SPRITE_SCALE = 0.12; // коэффициент уменьшения спрайтов
const SPRITE_GAP = 20; // расстояние между спрайтами по горизонтали
const SPRITE_BOTTOM = 20; // положение спрайтов относительно низа фона
const SPRITE_WIDTH = 1280 * SPRITE_SCALE;
const SPRITE_HEIGHT = 853 * SPRITE_SCALE;

const BG_URL = "https://storage.yandexcloud.net/svm/img/lockerroomcycle.png";
const BG_TILE_WIDTH = 500; // ширина одного тайла фонового изображения
const BG_HEIGHT = 250;

interface Props {
  userId: number;
  selectedMonsterId?: number | null;
  onMonsterChange?: (monsterId: number) => void;
}

const ArenaMonsterSwitcher: React.FC<Props> = ({
  userId,
  selectedMonsterId: propSelectedMonsterId,
  onMonsterChange,
}) => {
  const [monsters, setMonsters] = useState<ArenaMonster[]>([]);
  const [internalSelectedId, setInternalSelectedId] = useState<number | null>(
    null
  );
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedId =
    propSelectedMonsterId !== undefined
      ? propSelectedMonsterId
      : internalSelectedId;

  const updateContainerWidth = () => {
    if (containerRef.current) {
      const width = containerRef.current.clientWidth;
      setContainerWidth(width);
    }
  };

  useEffect(() => {
    updateContainerWidth();
    window.addEventListener("resize", updateContainerWidth);
    return () => window.removeEventListener("resize", updateContainerWidth);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.post<ArenaMonstersResponse>(
          API_URLS.arenamonsters,
          { userId }
        );
        const data = res.data.arenamonsters || [];
        setMonsters(data);

        if (data.length > 0 && !isInitialized) {
          const minId = Math.min(...data.map((m) => m.arenamonsterid));
          if (propSelectedMonsterId === undefined) {
            setInternalSelectedId(minId);
          }
          if (onMonsterChange) {
            onMonsterChange(minId);
          }
          setIsInitialized(true);
        }

        setTimeout(updateContainerWidth, 0);
      } catch (e) {
        console.error("Ошибка загрузки монстров арены:", e);
      }
    };
    load();
    // Просто удаляем строку с комментарием eslint-disable-next-line
  }, [userId]);

  const handleMonsterClick = (monsterId: number) => {
    if (propSelectedMonsterId === undefined) {
      setInternalSelectedId(monsterId);
    }
    if (onMonsterChange) {
      onMonsterChange(monsterId);
    }
  };

  const visibleWidth = containerWidth > 32 ? containerWidth - 32 : 0;

  const totalSpritesWidth =
    monsters.length > 0
      ? monsters.length * (SPRITE_WIDTH + SPRITE_GAP) + SPRITE_GAP
      : 0;

  const contentWidth = Math.max(visibleWidth, totalSpritesWidth);

  return (
    <div
      ref={containerRef}
      className="w-full min-w-0 overflow-x-auto rounded-xl border-2 border-green-300 bg-green-50 shadow-md p-4"
    >
      <div
        className="relative"
        style={{
          width: contentWidth,
          height: BG_HEIGHT,
          backgroundImage: `url(${BG_URL})`,
          backgroundRepeat: "repeat-x",
          backgroundSize: `${BG_TILE_WIDTH}px ${BG_HEIGHT}px`,
          backgroundPosition: "left top",
        }}
      >
        {monsters.map((m, index) => {
          const left = SPRITE_GAP + index * (SPRITE_WIDTH + SPRITE_GAP);
          const isSelected = selectedId === m.arenamonsterid;
          return (
            <div
              key={m.arenamonsterid}
              style={{
                position: "absolute",
                left,
                bottom: SPRITE_BOTTOM,
                width: SPRITE_WIDTH,
                textAlign: "center",
                cursor: "pointer",
              }}
              onClick={() => handleMonsterClick(m.arenamonsterid)}
            >
              <div
                className="font-handwritten text-sm md:text-base mb-1 px-1"
                style={{
                  color: isSelected ? "#059669" : "#6b7280",
                  fontWeight: isSelected ? "bold" : "normal",
                  textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
                }}
              >
                {m.arenamonstername}
              </div>
              <img
                src={m.arenamonsterimage}
                alt={m.arenamonstername}
                style={{
                  width: SPRITE_WIDTH,
                  height: SPRITE_HEIGHT,
                  opacity: isSelected ? 1 : 0.5,
                  transition: "opacity 0.3s ease, transform 0.2s ease",
                  transform: isSelected ? "scale(1.05)" : "scale(1)",
                  filter: isSelected ? "brightness(1.1)" : "brightness(0.8)",
                }}
                onError={(e) => {
                  console.error(
                    `Ошибка загрузки изображения монстра: ${m.arenamonsterimage}`
                  );
                  e.currentTarget.src =
                    "https://storage.yandexcloud.net/svm/img/placeholder-monster.png";
                }}
              />
              {isSelected && (
                <div
                  className="absolute -bottom-2 left-1/2 transform -translate-x-1/2"
                  style={{ width: SPRITE_WIDTH * 0.8 }}
                >
                  <div className="h-1 bg-gradient-to-r from-green-400 via-green-500 to-green-400 rounded-full shadow-lg animate-pulse"></div>
                </div>
              )}
            </div>
          );
        })}

        <div className="absolute top-4 left-4 text-green-700 opacity-30">
          <div className="text-xs font-medium">
            Арена монстров ({monsters.length})
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArenaMonsterSwitcher;
