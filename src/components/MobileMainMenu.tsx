import React, { useState } from "react";
import { MobileMainMenuProps } from "../types";

const MobileMainMenu: React.FC<MobileMainMenuProps> = ({
  items,
  selectedName,
  notificationCount,
  onSelect,
  onToggleNotifications,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      {/* Верхняя компактная панель */}
      <div className="flex items-center justify-between bg-purple-600 text-white px-3 py-2">
        <button
          aria-label="Открыть меню"
          className="p-2 active:scale-95"
          onClick={() => setOpen(true)}
        >
          {/* Иконка «бургер» */}
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 6h18M3 12h18M3 18h18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="text-lg font-semibold truncate px-2">
          {selectedName ?? "Меню"}
        </div>

        <div className="relative">
          <img
            src="https://storage.yandexcloud.net/svm/img/bell.png"
            alt="Уведомления"
            className="w-7 h-7 cursor-pointer"
            onClick={onToggleNotifications}
          />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full px-1.5 text-xs leading-5">
              {notificationCount}
            </span>
          )}
        </div>
      </div>

      {/* Затемнение + «шторка» снизу */}
      {open && (
        <div className="fixed inset-0 z-[90]">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 right-0 bottom-0 bg-white rounded-t-2xl shadow-2xl p-4">
            <div className="mx-auto mb-3 h-1.5 w-12 bg-gray-300 rounded-full" />
            <div className="grid grid-cols-3 gap-3">
              {items.map((item) => (
                <button
                  key={item.name}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-3 active:scale-95 ${
                    selectedName === item.name
                      ? "border-purple-600 bg-purple-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                  onClick={() => {
                    onSelect(item);
                    setOpen(false);
                  }}
                >
                  <img
                    src={item.iconURL}
                    alt={item.name}
                    className="w-10 h-10 object-contain"
                  />
                  <span className="text-xs text-gray-800 text-center">
                    {item.name}
                  </span>
                </button>
              ))}
            </div>

            <button
              className="mt-4 w-full rounded-xl bg-purple-600 text-white py-2 font-medium active:scale-95"
              onClick={() => setOpen(false)}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileMainMenu;
