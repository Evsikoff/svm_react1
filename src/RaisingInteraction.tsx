import React, { useRef, useEffect } from "react";

interface CharacteristicChange {
  name: string;
  amount: number;
}

interface RaisingInteractionProps {
  videoUrl: string;
  text: string;
  characteristicsChanges: CharacteristicChange[];
  onClose: () => void;
}

const RaisingInteraction: React.FC<RaisingInteractionProps> = ({
  videoUrl,
  text,
  characteristicsChanges,
  onClose,
}) => {
  // Создаем реф для элемента video
  const videoRef = useRef<HTMLVideoElement>(null);

  // Устанавливаем громкость видео на 20% при монтировании
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = 0.2; // Устанавливаем громкость 20%
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-200 to-orange-200 p-4">
      {/* Заголовок блока */}
      <div className="bg-gradient-to-r from-purple-500 to-orange-500 text-white text-2xl font-handwritten text-center py-2 mb-4">
        Воспитательное взаимодействие
      </div>

      {/* Фрейм "Видео" */}
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
            videoElement.currentTime = videoElement.duration; // Оставляем последний кадр
          }}
        />
      </div>

      {/* Фрейм "Текст" */}
      <div className="flex justify-center mb-4">
        <div className="bg-purple-100 p-4 border border-gray-300 shadow-md w-[75%] max-w-[80%]">
          <p className="text-lg font-bold text-purple-800">{text}</p>
        </div>
      </div>

      {/* Фрейм "Список измененных характеристик монстра" */}
      <div className="flex justify-center mb-4">
        <div className="bg-purple-100 p-4 border border-gray-300 shadow-md w-[75%] max-w-[80%]">
          <table className="w-full">
            <tbody>
              {characteristicsChanges.map((change, index) => (
                <tr key={index} className="border-b border-gray-300">
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

      {/* Кнопка закрытия */}
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
