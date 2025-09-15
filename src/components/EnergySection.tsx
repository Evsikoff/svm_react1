import React, { useState } from "react";
import { IMAGES } from "../constants";
import { formatTimer } from "../utils";
import EnergyReplenishment from "./EnergyReplenishment";

interface EnergySectionProps {
  teachEnergy: number;
  timer: number;
  userId: number | null;
}

const EnergySection: React.FC<EnergySectionProps> = ({
  teachEnergy,
  timer,
  userId,
}) => {
  const [showEnergyModal, setShowEnergyModal] = useState(false);
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
      <button
        onClick={() => setShowEnergyModal(true)}
        className="w-full mt-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
      >
        Пополнить энергию
      </button>
      {showEnergyModal && (
        <EnergyReplenishment
          onClose={() => setShowEnergyModal(false)}
          userId={userId}
        />
      )}
    </div>
  );
};

export default EnergySection;
