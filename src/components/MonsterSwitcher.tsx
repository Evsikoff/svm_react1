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
          className={`relative min-w-[229px] w-[229px] h-[200px] bg-orange-50 shadow-lg p-2 cursor-pointer border border-gray-300 ${
            selectedMonsterId === monstersId[index]
              ? "border-2 border-purple-500"
              : ""
          }`}
          onClick={() => onMonsterSwitch(monstersId[index])}
        >
          <img
            src={monster.face}
            alt={monster.name}
            className="w-[229px] h-[129px]"
          />
          <div className="text-center font-handwritten text-lg">
            {monster.name}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MonsterSwitcher;
