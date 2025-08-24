import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URLS } from "../constants";
import { ArenaMonster, ArenaMonstersResponse } from "../types";

const SPRITE_SCALE = 0.12; // коэффициент уменьшения спрайтов (измените это значение для регулировки размера)
const SPRITE_GAP = 20; // расстояние между спрайтами по горизонтали
const SPRITE_BOTTOM = 20; // положение спрайтов относительно низа фона
const SPRITE_WIDTH = 1280 * SPRITE_SCALE;
const SPRITE_HEIGHT = 853 * SPRITE_SCALE;

const BG_URL = "https://storage.yandexcloud.net/svm/img/lockerroomcycle.png";
const BG_WIDTH = 500;
const BG_HEIGHT = 250;

interface Props {
  userId: number;
}

const ArenaMonsterSwitcher: React.FC<Props> = ({ userId }) => {
  const [monsters, setMonsters] = useState<ArenaMonster[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.post<ArenaMonstersResponse>(
          API_URLS.arenamonsters,
          { userId }
        );
        const data = res.data.arenamonsters || [];
        setMonsters(data);
        if (data.length > 0) {
          const minId = Math.min(...data.map((m) => m.arenamonsterid));
          setSelectedId(minId);
        }
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, [userId]);

  const bgCount = Math.ceil(monsters.length / 3);
  const containerWidth = bgCount * BG_WIDTH;

  return (
    <div className="w-full overflow-x-auto rounded-xl border-2 border-green-300 bg-green-50 shadow-md p-4">
      <div
        className="relative"
        style={{
          width: containerWidth,
          height: BG_HEIGHT,
          backgroundImage: `url(${BG_URL})`,
          backgroundRepeat: "repeat-x",
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
              onClick={() => setSelectedId(m.arenamonsterid)}
            >
              <div className="font-handwritten" style={{ marginBottom: 4 }}>
                {m.arenamonstername}
              </div>
              <img
                src={m.arenamonsterimage}
                alt={m.arenamonstername}
                style={{
                  width: SPRITE_WIDTH,
                  height: SPRITE_HEIGHT,
                  opacity: isSelected ? 1 : 0.5,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ArenaMonsterSwitcher;
