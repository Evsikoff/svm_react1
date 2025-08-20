import React from "react";
import { Monster } from "../types";

interface MonsterSwitcherProps {
  monsters: Monster[];
  monstersId: number[];
  selectedMonsterId: number | null;
  onMonsterSwitch: (monsterId: number) => void;
}

const MonsterSwitcher: React.FC<MonsterSwitcherProps> = ({
  monsters,
  monstersId,
  selectedMonsterId,
  onMonsterSwitch,
}) => {
  return (
    <div className="flex space-x-1 overflow-x-auto pb-1">
      {monsters.map((monster, index) => (
        <div
          key={monster.name}
          className={`relative flex flex-col min-w-[229px] w-[229px] h-[200px] bg-orange-50 shadow-lg p-2 cursor-pointer border border-gray-300 ${
            selectedMonsterId === monstersId[index]
              ? "border-2 border-purple-500"
              : ""
          }`}
          onClick={() => onMonsterSwitch(monstersId[index])}
        >
          <img
            src={monster.face}
            alt={monster.name}
            className="w-full h-[129px] object-cover border border-gray-400"
          />
          <div
            className="flex-1 flex items-center justify-center text-center font-handwritten leading-none"
            style={{ fontSize: "clamp(0.8rem, 5vw, 4rem)" }}
          >
            {monster.name}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MonsterSwitcher;
