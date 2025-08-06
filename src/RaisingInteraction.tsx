import React, { useRef, useEffect, useState } from "react";

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

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = 0.2;
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-200 to-orange-200 p-4">
      <div className="bg-gradient-to-r from-purple-500 to-orange-500 text-white text-2xl font-handwritten text-center py-2 mb-4">
        Воспитательное взаимодействие
      </div>
      <div className="flex justify-center mb-4">
        <video
          ref={videoRef}
          className="max-w-[40%] h-auto"
          src={videoUrl}
          autoPlay
          muted={false}
          controls={false}
          onEnded={(e) => {
            const videoElement = e.target as HTMLVideoElement;
            videoElement.currentTime = videoElement.duration;
          }}
        />
      </div>
      <div className="flex justify-center mb-4">
        <div className="bg-purple-100 p-4 border border-gray-300 shadow-md w-[75%] max-w-[80%]">
          <p className="text-lg font-bold text-purple-800">{text}</p>
        </div>
      </div>
      <div className="flex justify-center mb-4">
        <div className="bg-purple-100 p-4 border border-gray-300 shadow-md w-[75%] max-w-[80%]">
          <table className="w-full">
            <tbody>
              {characteristicsChanges.map((change) => (
                <tr
                  key={change.characteristicsid}
                  className="border-b border-gray-300"
                >
                  <td className="py-2 px-4">{change.name}</td>
                  <td
                    className={`py-2 px-4 ${
                      change.amount >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {Math.abs(change.amount)}
                  </td>
                  <td className="py-2 px-4">
                    <span
                      className={`${
                        change.amount >= 0 ? "text-green-600" : "text-red-600"
                      }`}
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
      {inventoryItems.length > 0 && (
        <div className="flex justify-center mb-4">
          <div className="bg-purple-100 p-4 border border-gray-300 shadow-md w-[75%] max-w-[80%]">
            <h2 className="text-xl font-bold text-orange-600 mb-4 text-center">
              Полученные предметы
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              {inventoryItems.map((item) => (
                <div
                  key={item.inventoryid}
                  className="relative bg-orange-50 p-4 border border-orange-300 rounded-lg shadow-sm w-64"
                >
                  <div className="absolute top-2 left-2 bg-orange-500 text-white text-sm font-semibold px-2 py-1 rounded">
                    {item.quantity}
                  </div>
                  <img
                    src={item.inventoryimage}
                    alt={item.inventoryname}
                    className="w-24 h-24 mx-auto mb-2"
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
          className="bg-purple-500 text-white px-4 py-2 rounded"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
};

export default RaisingInteraction;
