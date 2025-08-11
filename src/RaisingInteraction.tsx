import React, { useRef, useEffect } from "react";

interface CharacteristicChange {
  characteristicsid: number;
  name: string;
  amount: number;
}

interface InventoryItem {
  inventoryid: number;
  inventoryname: string;
  inventoryimage: string;
  inventorydescription: string;
  quantity: number;
}

interface RaisingInteractionProps {
  videoUrl: string;
  text: string;
  characteristicsChanges: CharacteristicChange[];
  inventoryItems: InventoryItem[];
  onClose: () => void;
}

const RaisingInteraction: React.FC<RaisingInteractionProps> = ({
  videoUrl,
  text,
  characteristicsChanges,
  inventoryItems,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // единые классы ширины для всех основных блоков
  const commonWidth = "w-full max-w-[92%] md:max-w-[80%] lg:max-w-[75%]";

  useEffect(() => {
    // прокрутка в самый верх при открытии
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    if (videoRef.current) videoRef.current.volume = 0.2;
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-200 to-orange-200 p-2 sm:p-4">
      <div className="bg-gradient-to-r from-purple-500 to-orange-500 text-white text-2xl sm:text-3xl font-handwritten text-center py-2 mb-4">
        Воспитательное взаимодействие
      </div>

      {/* Видео: ширина = ширина всех остальных блоков */}
      <div className="flex justify-center mb-4">
        <div className={commonWidth}>
          <video
            ref={videoRef}
            className="w-full h-auto rounded-md shadow-md"
            src={videoUrl}
            autoPlay
            muted={false}
            controls={false}
            onEnded={(e) => {
              const v = e.target as HTMLVideoElement;
              v.currentTime = v.duration;
            }}
          />
        </div>
      </div>

      {/* Бейдж с текстом: та же ширина */}
      <div className="flex justify-center mb-4">
        <div
          className={`bg-purple-100 p-4 border border-gray-300 shadow-md ${commonWidth}`}
        >
          <p className="text-base sm:text-lg font-bold text-purple-800">
            {text}
          </p>
        </div>
      </div>

      {/* Таблица изменений характеристик: та же ширина + защита на узких экранах */}
      <div className="flex justify-center mb-4">
        <div
          className={`bg-purple-100 p-2 sm:p-4 border border-gray-300 shadow-md ${commonWidth} overflow-x-auto`}
        >
          <table className="w-full min-w-[260px]">
            <tbody>
              {characteristicsChanges.map((change) => (
                <tr
                  key={change.characteristicsid}
                  className="border-b border-gray-300"
                >
                  <td className="py-2 px-3 sm:px-4 whitespace-nowrap">
                    {change.name}
                  </td>
                  <td
                    className={`py-2 px-3 sm:px-4 text-right ${
                      change.amount >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {Math.abs(change.amount)}
                  </td>
                  <td className="py-2 px-3 sm:px-4 text-right">
                    <span
                      className={
                        change.amount >= 0 ? "text-green-600" : "text-red-600"
                      }
                    >
                      {change.amount >= 0 ? "↑" : "↓"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Полученные предметы: та же ширина, адаптивная сетка */}
      {inventoryItems.length > 0 && (
        <div className="flex justify-center mb-4">
          <div
            className={`bg-purple-100 p-4 border border-gray-300 shadow-md ${commonWidth}`}
          >
            <h2 className="text-xl font-bold text-orange-600 mb-4 text-center">
              Полученные предметы
            </h2>
            <div className="grid gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3">
              {inventoryItems.map((item) => (
                <div
                  key={item.inventoryid}
                  className="relative bg-orange-50 p-4 border border-orange-300 rounded-lg shadow-sm"
                >
                  <div className="absolute top-2 left-2 bg-orange-500 text-white text-sm font-semibold px-2 py-1 rounded">
                    {item.quantity}
                  </div>
                  <img
                    src={item.inventoryimage}
                    alt={item.inventoryname}
                    className="w-24 h-24 mx-auto mb-2 object-contain"
                    onError={(e) => {
                      console.error(
                        `Ошибка загрузки изображения: ${item.inventoryimage}`
                      );
                      e.currentTarget.src = "/fallback-image.png";
                    }}
                  />
                  <p className="text-base font-semibold text-orange-800 text-center">
                    {item.inventoryname}
                  </p>
                  <p className="text-sm text-orange-600 text-center">
                    {item.inventorydescription}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <button
          onClick={onClose}
          className="bg-purple-500 text-white px-5 py-2 rounded"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
};

export default RaisingInteraction;
