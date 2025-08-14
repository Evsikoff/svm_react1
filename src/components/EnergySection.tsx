import React from "react";
import { IMAGES } from "../constants";
import { formatTimer } from "../utils";

interface EnergySectionProps {
  teachEnergy: number;
  timer: number;
}

const EnergySection: React.FC<EnergySectionProps> = ({
  teachEnergy,
  timer,
}) => {
  return (
    <div className="flex flex-col justify-between h-full items-center border border-gray-300 p-3 bg-purple-50 w-full md:w-auto md:min-w-[200px]">
      {/* Группа для иконки и значения энергии */}
      <div className="flex items-center gap-2">
        <img src={IMAGES.energy} alt="Teach Energy" className="w-8 h-8" />
        <span className="font-semibold text-lg text-purple-800">
          Энергия: {teachEnergy}
        </span>
      </div>

      {/* Таймер */}
      {teachEnergy < 10 && (
        <span className="text-sm text-gray-600">
          До пополнения: {formatTimer(timer)}
        </span>
      )}

      {/* Кнопка */}
      <button className="w-full mt-2 bg-gray-300 text-gray-500 px-4 py-2 rounded cursor-not-allowed">
        Пополнить энергию
      </button>
    </div>
  );
};

export default EnergySection;
