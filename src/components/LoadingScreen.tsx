import React from "react";
import { BootTask } from "../types";
import { IMAGES } from "../constants";

interface LoadingScreenProps {
  bootTasks: BootTask[];
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ bootTasks }) => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b from-purple-200 to-orange-200">
      <img
        src={IMAGES.loading}
        alt="Loading"
        className="w-[60%] h-auto mb-6 max-w-xl"
      />
      <div className="text-3xl font-bold tracking-wider text-purple-700 mb-6">
        ЗАГРУЗКА
      </div>

      {/* Прогресс-бар с делениями = числу методов */}
      <div className="w-[90%] max-w-3xl">
        <div className="flex gap-2 mb-3">
          {bootTasks.map((t, i) => (
            <div key={t.key} className="flex-1">
              <div
                className={`h-3 rounded ${
                  t.done ? "bg-purple-600" : "bg-purple-200"
                }`}
                title={`${i + 1}. ${t.label}`}
              />
            </div>
          ))}
        </div>
        {/* Вертикальный список задач для мобильных устройств */}
        <div className="mt-2 space-y-1 text-xs text-gray-600">
          {bootTasks.map((t, i) => (
            <div key={t.key} className="flex items-center">
              <span className="mr-2">{i + 1}.</span>
              <span className="truncate">{t.label}</span>
              {t.done && <span className="ml-2">✅</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
