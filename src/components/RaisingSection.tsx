import React, { useState } from "react";
import EnergyReplenishment from "./EnergyReplenishment";

// Локальные типы для избежания проблем с импортами
interface Monster {
  face: string;
  name: string;
  sequence: number;
  index: boolean;
}

interface MonsterCharacteristic {
  id: number;
  value: number;
  icon: string;
  name: string;
}

interface MonsterImpact {
  id: number;
  image: string;
  name: string;
  comment: string;
  available: boolean;
  energyprice: number;
  minendurance?: number;
}

interface RoomItem {
  id: number;
  name: string;
  spriteUrl: string;
  placement: string;
  xaxis: number;
  yaxis: number;
}

interface RaisingSectionProps {
  monsters: Monster[];
  monstersId: number[];
  selectedMonsterId: number | null;
  teachEnergy: number;
  timer: number;
  roomImage: string;
  monsterImage: string;
  roomItems: RoomItem[];
  characteristics: MonsterCharacteristic[];
  impacts: MonsterImpact[];
  isMonsterLoading: boolean;
  onMonsterSwitch: (monsterId: number) => void;
  onImpactClick: (impact: MonsterImpact) => void;
}

const formatTimer = (timeInSeconds: number): string => {
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = timeInSeconds % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} часов`);
  if (minutes > 0 || hours > 0) parts.push(`${minutes} минут`);
  parts.push(`${seconds} секунд`);
  return parts.join(" ");
};

const RaisingSection: React.FC<RaisingSectionProps> = ({
  monsters,
  monstersId,
  selectedMonsterId,
  teachEnergy,
  timer,
  roomImage,
  monsterImage,
  roomItems,
  characteristics,
  impacts,
  isMonsterLoading,
  onMonsterSwitch,
  onImpactClick,
}) => {
  const [showEnergyModal, setShowEnergyModal] = useState(false);
  // Вычисления для enduranceIcon (иконка выносливости)
  const enduranceIcon = characteristics.find((c) => c.id === 10012)?.icon || "";

  return (
    <div className="p-4">
      {/* БЛОК С ПЕРЕКЛЮЧАТЕЛЕМ МОНСТРОВ И ЭНЕРГИЕЙ */}
      <div className="flex flex-col gap-4 md:flex-row md:justify-between">
        {/* Переключатель монстров */}
        <div className="flex space-x-1 overflow-x-auto pb-1">
          {monsters.map((monster, index) => (
            <div
              key={monster.name}
              className={`relative min-w-[229px] w-[229px] h-[200px] bg-orange-50 shadow-lg p-2 border border-gray-300 ${
                selectedMonsterId === monstersId[index]
                  ? "border-2 border-purple-500"
                  : ""
              } ${
                isMonsterLoading
                  ? "cursor-not-allowed pointer-events-none opacity-50"
                  : "cursor-pointer"
              }`}
              onClick={() => {
                if (!isMonsterLoading) onMonsterSwitch(monstersId[index]);
              }}
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

        {/* Энергия на воспитательные взаимодействия */}
        <div className="flex flex-col justify-between h-full items-center border border-gray-300 p-3 bg-purple-50 w-full md:w-auto md:min-w-[200px]">
          <div className="flex items-center gap-2">
            <img
              src="https://storage.yandexcloud.net/svm/img/userteachenergy.png"
              alt="Teach Energy"
              className="w-8 h-8"
            />
            <span className="font-semibold text-lg text-purple-800">
              Энергия: {teachEnergy}
            </span>
          </div>

          {teachEnergy < 10 && (
            <span className="text-sm text-gray-600">
              До пополнения: {formatTimer(timer)}
            </span>
          )}

          <button
            onClick={() => setShowEnergyModal(true)}
            className="w-full mt-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
          >
            Пополнить энергию
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-col md:flex-row md:space-x-1">
        {/* Комната монстра */}
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
              {isMonsterLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                  <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <img
                    src={roomImage}
                    alt="Room"
                    className="w-full h-full object-contain"
                    style={{
                      display: "block",
                      zIndex: 1,
                      position: "relative",
                      pointerEvents: "none",
                      background: "#fff",
                    }}
                  />
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

        {/* Набор доступных воспитательных взаимодействий с монстром */}
        <div className="w-full md:w-1/2 mt-4 md:mt-0 grid grid-cols-2 md:grid-cols-4 gap-1 bg-purple-200">
          {impacts.map((impact) => (
            <div
              key={impact.id}
              className={`relative bg-purple-50 p-0.5 shadow border border-gray-300 flex flex-col items-center justify-between ${
                impact.available && teachEnergy >= impact.energyprice
                  ? "cursor-pointer hover:bg-purple-100 hover:shadow-md"
                  : "opacity-50 hover:opacity-70 hover:shadow-gray-400"
              }`}
              title={impact.comment}
              onClick={() => onImpactClick(impact)}
            >
              <img
                src={impact.image}
                alt={impact.name}
                className="w-full h-auto object-contain"
              />

              <div className="text-purple-800 px-1 text-center text-sm">
                {impact.name}
              </div>

              <div className="flex items-center justify-center mb-1 space-x-2">
                {impact.minendurance !== undefined &&
                  impact.minendurance !== null &&
                  impact.minendurance !== 0 && (
                    <div className="flex items-center">
                      <img
                        src={enduranceIcon}
                        alt="Min Endurance"
                        className="w-[15px] h-[22px]"
                      />
                      <span className="text-green-700 text-sm ml-1">
                        {impact.minendurance}
                      </span>
                    </div>
                  )}
                <div className="flex items-center">
                  <img
                    src="https://storage.yandexcloud.net/svm/img/userteachenergy.png"
                    alt="Energy Price"
                    className="w-[15px] h-[22px]"
                  />
                  <span className="text-yellow-500 text-sm ml-1">
                    {impact.energyprice}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {showEnergyModal && (
        <EnergyReplenishment onClose={() => setShowEnergyModal(false)} />
      )}
    </div>
  );
};

export default RaisingSection;
