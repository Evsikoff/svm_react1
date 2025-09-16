import React, { useRef, useEffect, useCallback } from "react";
import { useYandexFullscreenAd } from "./hooks/useYandexFullscreenAd";

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

interface ItemEffect {
  effecttext: string;
  itemname: string;
  itemimage: string;
}

interface ItemBonusChange {
  characteristicname: string;
  amount: number;
}

interface ItemBonus {
  itemname: string;
  itemimage: string;
  characteristicschanges: ItemBonusChange[];
}

interface RaisingInteractionProps {
  videoUrl: string;
  text: string;
  characteristicsChanges: CharacteristicChange[];
  inventoryItems: InventoryItem[];
  itemEffects?: ItemEffect[];
  itemBonuses?: ItemBonus[];
  onClose: () => void;
}

const RaisingInteraction: React.FC<RaisingInteractionProps> = ({
  videoUrl,
  text,
  characteristicsChanges,
  inventoryItems,
  itemEffects = [],
  itemBonuses = [],
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { showAd, isDesktop, isReady } = useYandexFullscreenAd();
  const [isClosing, setIsClosing] = React.useState(false);

  const commonWidth = "w-full max-w-[92%] md:max-w-[80%] lg:max-w-[75%]";

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    if (videoRef.current) {
      videoRef.current.volume = 0.2;
    }

    console.log("RaisingInteraction props:", {
      videoUrl,
      text,
      characteristicsChanges,
      inventoryItems,
      itemEffects,
      itemBonuses,
    });

    console.log("RaisingInteraction mounted. Ad state:", {
      isDesktop,
      isReady,
      yaContext: !!window.Ya?.Context,
      advManager: !!window.Ya?.Context?.AdvManager,
    });
  }, [
    isDesktop,
    isReady,
    videoUrl,
    text,
    characteristicsChanges,
    inventoryItems,
    itemEffects,
    itemBonuses,
  ]);

  const handleClose = useCallback(async () => {
    if (isClosing) {
      console.log("Уже закрывается, игнорируем клик");
      return;
    }

    setIsClosing(true);

    if (isDesktop) {
      console.log("Обнаружен десктоп — попытка показа рекламы", { isReady });
      try {
        await showAd();
        console.log("Реклама успешно отрендерена и закрыта");
      } catch (error) {
        console.error("Ошибка при показе рекламы:", error);
      }
    } else {
      console.log("Мобильное устройство — пропуск рекламы");
    }

    onClose();
    setIsClosing(false);
  }, [showAd, isDesktop, isReady, onClose, isClosing]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-200 to-orange-200 p-2 sm:p-4">
      <div className="bg-gradient-to-r from-purple-500 to-orange-500 text-white text-2xl sm:text-3xl font-handwritten text-center py-2 mb-4">
        Воспитательное взаимодействие
      </div>

      {videoUrl ? (
        <div className="flex justify-center mb-4">
          <div className={commonWidth}>
            <video
              ref={videoRef}
              className="w-full h-auto rounded-md shadow-md"
              src={videoUrl}
              autoPlay
              playsInline
              preload="auto"
              muted={false}
              controls={false}
              onEnded={(e) => {
                const v = e.target as HTMLVideoElement;
                v.currentTime = v.duration;
              }}
            />
          </div>
        </div>
      ) : (
        <div className="flex justify-center mb-4">
          <div className={commonWidth}>
            <p className="text-red-600 text-center">Видео недоступно</p>
          </div>
        </div>
      )}

      {text ? (
        <div className="flex justify-center mb-4">
          <div
            className={`bg-purple-100 p-4 border border-gray-300 shadow-md ${commonWidth}`}
          >
            <p className="text-base sm:text-lg font-bold text-purple-800">
              {text}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex justify-center mb-4">
          <div
            className={`bg-purple-100 p-4 border border-gray-300 shadow-md ${commonWidth}`}
          >
            <p className="text-red-600 text-center">
              Текст взаимодействия отсутствует
            </p>
          </div>
        </div>
      )}

      {characteristicsChanges.length > 0 ? (
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
                    <td className="py-2 px-3 sm:px-4 break-words text-xs xs:text-sm sm:text-base">
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
      ) : (
        <div className="flex justify-center mb-4">
          <div
            className={`bg-purple-100 p-4 border border-gray-300 shadow-md ${commonWidth}`}
          >
            <p className="text-red-600 text-center">
              Изменения характеристик отсутствуют
            </p>
          </div>
        </div>
      )}

      {itemEffects.length > 0 && (
        <div className="flex justify-center mb-4">
          <div
            className={`bg-gradient-to-br from-cyan-50 to-teal-50 p-4 border border-cyan-300 shadow-md ${commonWidth}`}
          >
            <h2 className="text-lg sm:text-xl font-bold text-teal-700 mb-4 text-center border-b-2 border-teal-200 pb-2">
              Изменения в ходе воспитательного взаимодействия благодаря наличию
              у монстра некоторых предметов
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              {itemEffects.map((effect, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-teal-100 to-cyan-100 border border-teal-400 rounded-xl p-3 shadow-sm w-full sm:w-[320px] lg:w-[360px] transition-transform hover:scale-105"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <img
                      src={effect.itemimage}
                      alt={effect.itemname}
                      className="w-12 h-12 object-contain rounded-lg bg-white/60 p-1 shadow-sm"
                      onError={(e) => {
                        console.error(
                          `Ошибка загрузки изображения предмета: ${effect.itemimage}`
                        );
                        e.currentTarget.src = "/fallback-item.png";
                      }}
                    />
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-teal-800 leading-tight">
                        {effect.itemname}
                      </h3>
                    </div>
                  </div>
                  <div className="bg-white/50 rounded-lg p-2 border border-teal-200">
                    <p className="text-sm text-teal-700 font-medium leading-relaxed">
                      {effect.effecttext}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {itemBonuses.length > 0 && (
        <div className="flex justify-center mb-4">
          <div
            className={`bg-gradient-to-br from-lime-50 to-emerald-50 p-4 border border-lime-300 shadow-md ${commonWidth}`}
          >
            <h2 className="text-lg sm:text-xl font-bold text-lime-700 mb-4 text-center border-b-2 border-lime-200 pb-2">
              Дополнительные бонусы от владения предметами
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              {itemBonuses.map((bonus, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-emerald-100 to-lime-100 border border-lime-400 rounded-xl p-3 shadow-sm w-full sm:w-[320px] lg:w-[360px]"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <img
                      src={bonus.itemimage}
                      alt={bonus.itemname}
                      className="w-12 h-12 object-contain rounded-lg bg-white/60 p-1 shadow-sm"
                      onError={(e) => {
                        console.error(
                          `Ошибка загрузки изображения предмета: ${bonus.itemimage}`
                        );
                        e.currentTarget.src = "/fallback-item.png";
                      }}
                    />
                    <h3 className="text-sm font-bold text-lime-800 leading-tight">
                      {bonus.itemname}
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[200px]">
                      <tbody>
                        {bonus.characteristicschanges.map((change, idx) => (
                          <tr key={idx} className="border-b border-lime-200">
                            <td className="py-1 px-2 text-xs xs:text-sm text-lime-800">
                              {change.characteristicname}
                            </td>
                            <td className="py-1 px-2 text-right text-lime-600">
                              +{change.amount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {inventoryItems.length > 0 && (
        <div className="flex justify-center mb-4">
          <div
            className={`bg-purple-100 p-4 border border-gray-300 shadow-md ${commonWidth}`}
          >
            <h2 className="text-xl font-bold text-orange-600 mb-4 text-center">
              Полученные предметы
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              {inventoryItems.map((item) => (
                <div
                  key={item.inventoryid}
                  className="relative bg-orange-50 p-4 border border-orange-300 rounded-lg shadow-sm w-[320px] sm:w-[360px]"
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
          onClick={handleClose}
          disabled={isClosing}
          className={`px-5 py-2 rounded transition-all duration-200 flex items-center gap-2 ${
            isClosing
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-purple-500 hover:bg-purple-600 text-white"
          }`}
        >
          {isClosing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Закрытие...</span>
            </>
          ) : (
            "Закрыть"
          )}
        </button>
      </div>
    </div>
  );
};

export default RaisingInteraction;
