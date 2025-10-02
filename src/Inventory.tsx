// Inventory.tsx — компонент "Инвентарь" с фреймами "Предметы пользователя" и "Предметы монстров"
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import VKDesktopFrame from "./components/VKDesktopFrame";

// Импорт компонента MonsterItems
const MonsterItems = React.lazy(() => import("./MonsterItems"));

// ===== Типы данных =====
interface ItemAction {
  actionname: string;
  actionicon: string;
  actionfunction: string;
  actionargument: string;
}

interface UserInventoryItem {
  inventoryitem: {
    inventoryid: number;
    inventoryname: string;
    inventoryimage: string;
    inventoryfunction: string | null;
    inventorydescription: string;
    inventorytype: number;
    inventorysaleprice: number;
    quantity: string;
    activity: boolean;
    itemactions: ItemAction[];
  };
}

interface UserItemsResponse {
  useritems: UserInventoryItem[];
}

interface InventoryProps {
  userId: number | null;
  isVKDesktop?: boolean;
}

// ===== Функция с бесконечными повторами при таймауте =====
async function withInfiniteRetryOnTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number = 4000,
  label: string
): Promise<T> {
  let attemptCount = 0;

  while (true) {
    attemptCount++;
    console.log(`${label}: попытка #${attemptCount}`);

    try {
      // Создаем Promise для таймаута
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Timeout after ${timeoutMs}ms`));
        }, timeoutMs);
      });

      // Запускаем функцию и таймаут параллельно
      const result = await Promise.race([fn(), timeoutPromise]);

      console.log(`${label}: успешно получен ответ с попытки #${attemptCount}`);
      return result;
    } catch (error: any) {
      if (error.message && error.message.includes("Timeout")) {
        console.warn(
          `${label}: таймаут на попытке #${attemptCount}, повторяем...`
        );
        // Небольшая задержка перед следующей попыткой
        await new Promise((resolve) => setTimeout(resolve, 500));
        continue;
      }
      // Если это не таймаут, а другая ошибка - пробрасываем её
      throw error;
    }
  }
}

// ===== Универсальная функция с ретраями для действий (оставляем как была) =====
async function withRetry<T>(
  fn: () => Promise<T>,
  isValid: (v: T) => boolean,
  label: string
): Promise<T> {
  let lastErr: any = null;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fn();
      if (!isValid(res)) throw new Error("Пустой или некорректный ответ");
      return res;
    } catch (e: any) {
      lastErr = e;
      if (attempt < 4) await new Promise((r) => setTimeout(r, 300));
    }
  }
  const text =
    typeof lastErr?.message === "string"
      ? `${label}: ${lastErr.message}`
      : label;
  throw new Error(text);
}

// ===== Основной компонент =====
const Inventory: React.FC<InventoryProps> = ({
  userId,
  isVKDesktop = false,
}) => {
  const [items, setItems] = useState<UserInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string>("");
  const [showModal, setShowModal] = useState(false);

  // ===== Загрузка предметов пользователя с бесконечными повторами =====
  const loadUserItems = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setError("userId отсутствует");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await withInfiniteRetryOnTimeout(
        () =>
          axios.post<UserItemsResponse>(
            "https://useritemget-production.up.railway.app/inventory",
            { userId }
          ),
        4000,
        "Загрузка предметов пользователя"
      );

      // Проверяем валидность ответа
      if (!response.data || !Array.isArray(response.data.useritems)) {
        throw new Error("Некорректный формат ответа от сервера");
      }

      setItems(response.data.useritems || []);
      setError("");
    } catch (e: any) {
      console.error("Критическая ошибка при загрузке предметов:", e);
      setError(e.message || "Ошибка при загрузке предметов");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUserItems();
  }, [loadUserItems]);

  // ===== Выполнение действия с предметом =====
  const handleItemAction = async (action: ItemAction) => {
    console.log("Начинаем выполнение действия:", action.actionname);

    // Устанавливаем спиннер и закрываем выпадающий список
    setActionLoading(action.actionname);
    setSelectedItem(null);

    try {
      let requestBody: any;
      try {
        requestBody = JSON.parse(action.actionargument);
      } catch {
        requestBody = {};
      }

      console.log("Отправляем запрос к:", action.actionfunction);
      console.log("С данными:", requestBody);

      const response = await withRetry(
        () => axios.post(action.actionfunction, requestBody),
        () => true, // принимаем любой ответ
        "Ошибка при выполнении действия"
      );

      console.log("Получен ответ:", response.data);

      // Показываем сообщение из ответа или стандартное
      const message =
        response.data?.message ||
        response.data?.text ||
        "Действие выполнено успешно";
      setActionMessage(String(message));
      setShowModal(true);
    } catch (e: any) {
      console.error("Ошибка при выполнении действия:", e);
      setActionMessage(e.message || "Произошла ошибка при выполнении действия");
      setShowModal(true);
    } finally {
      console.log("Убираем спиннер");
      setActionLoading(null);
    }
  };

  // ===== Обновление всех фреймов после действия =====
  const refreshAllFrames = useCallback(async () => {
    try {
      // Устанавливаем общий спиннер обновления
      setLoading(true);

      // Перезагружаем предметы пользователя
      await loadUserItems();

      // Фрейм "Предметы монстров" будет обновляться через свой собственный механизм
      // при вызове onRefreshAllFrames
    } catch (e: any) {
      setError(e.message || "Ошибка при обновлении данных");
    } finally {
      setLoading(false);
    }
  }, [loadUserItems]);

  // ===== Получение цвета бейджа по типу предмета =====
  const getBadgeStyle = (type: number): string => {
    switch (type) {
      case 1:
        return "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200";
      case 2:
        return "bg-gradient-to-br from-green-50 to-green-100 border-green-200";
      case 3:
        return "bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200";
      case 4:
        return "bg-gradient-to-br from-red-50 to-red-100 border-red-200";
      case 5:
        return "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200";
      case 6:
        return "bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200";
      case 7:
        return "bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200";
      case 8:
        return "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200";
      case 9:
        return "bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200";
      case 10:
        return "bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200";
      case 11:
        return "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200";
      case 12:
        return "bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200";
      default:
        return "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200";
    }
  };

  const isDesktopView = isVKDesktop;

  const renderContent = () => {
    const loadingWrapperClass = isDesktopView
      ? "w-full flex items-center justify-center py-20"
      : "w-full flex items-center justify-center py-16";
    const contentWrapperClass = isDesktopView
      ? "mx-auto max-w-6xl space-y-10"
      : "max-w-6xl mx-auto";
    const errorAlertClass = isDesktopView
      ? "bg-red-100 text-red-700 border border-red-300 px-6 py-4 rounded-3xl shadow mb-6"
      : "bg-red-100 text-red-700 border border-red-300 px-4 py-3 rounded-lg mb-6";
    const userItemsFrameClass = isDesktopView
      ? "bg-gradient-to-br from-purple-50 to-orange-50 rounded-3xl shadow-xl border border-purple-200 p-8"
      : "bg-gradient-to-br from-purple-50 to-orange-50 rounded-xl shadow-lg border border-purple-200 p-6";
    const userItemsTitleClass = isDesktopView
      ? "text-3xl font-bold text-purple-800 mb-6 text-center"
      : "text-2xl font-bold text-purple-800 mb-6 text-center";
    const emptyStateWrapperClass = isDesktopView
      ? "text-center py-16"
      : "text-center py-12";
    const emptyEmojiClass = isDesktopView
      ? "text-purple-400 text-5xl mb-6"
      : "text-purple-400 text-4xl mb-4";
    const emptyTitleClass = isDesktopView
      ? "text-purple-700 text-xl font-semibold mb-2"
      : "text-purple-700 text-lg font-medium mb-2";
    const emptyDescriptionClass = "text-purple-600 text-sm";
    const itemsGridClass = isDesktopView
      ? "flex flex-wrap justify-center gap-8"
      : "flex flex-wrap justify-center gap-6";
    const itemCardBase = isDesktopView
      ? "border-2 rounded-3xl p-6 shadow-xl transition-all duration-200 w-72 min-h-[320px]"
      : "border-2 rounded-xl p-4 shadow-md transition-all duration-200 w-64 min-h-[280px]";
    const itemImageWrapperClass = isDesktopView
      ? "flex justify-center mb-4"
      : "flex justify-center mb-3";
    const itemImageClass = isDesktopView
      ? "w-20 h-20 object-contain"
      : "w-16 h-16 object-contain";
    const itemNameClass = isDesktopView
      ? "text-base font-bold text-gray-800 text-center mb-2 leading-tight"
      : "text-sm font-bold text-gray-800 text-center mb-2 leading-tight";
    const itemDescriptionClass = isDesktopView
      ? "text-sm text-gray-600 text-center leading-relaxed"
      : "text-xs text-gray-600 text-center leading-relaxed";
    const indicatorWrapperClass = isDesktopView
      ? "flex justify-center mt-4"
      : "flex justify-center mt-3";
    const dropdownContainerClass = isDesktopView
      ? "absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
      : "absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden";
    const dropdownButtonClass = isDesktopView
      ? "w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors duration-150 border-b border-gray-100 last:border-b-0"
      : "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 border-b border-gray-100 last:border-b-0";
    const dropdownIconClass = isDesktopView
      ? "w-7 h-7 object-contain flex-shrink-0"
      : "w-6 h-6 object-contain flex-shrink-0";
    const dropdownSpinnerClass = isDesktopView
      ? "w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin flex-shrink-0"
      : "w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin flex-shrink-0";
    const actionOverlayClass = isDesktopView
      ? "absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-3xl z-60"
      : "absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-xl z-60";
    const actionSpinnerClass = isDesktopView
      ? "w-9 h-9 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"
      : "w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin";
    const monsterFallbackClass = isDesktopView
      ? "w-full flex items-center justify-center py-20"
      : "w-full flex items-center justify-center py-16";
    const modalContainerClass = isDesktopView
      ? "bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4"
      : "bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4";
    const modalTitleClass = isDesktopView
      ? "text-xl font-semibold mb-4 text-gray-800"
      : "text-lg font-semibold mb-4 text-gray-800";
    const modalTextClass = isDesktopView
      ? "text-gray-700 whitespace-pre-wrap mb-6 text-base"
      : "text-gray-700 whitespace-pre-wrap mb-6";
    const modalButtonClass = isDesktopView
      ? "px-8 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors duration-200"
      : "px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors duration-200";

    return (
      <>
        {loading && (
          <div className={loadingWrapperClass}>
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && (
          <div className={contentWrapperClass}>
            {error && <div className={errorAlertClass}>{error}</div>}

            <div className={userItemsFrameClass}>
              <h2 className={userItemsTitleClass}>Предметы пользователя</h2>

              {!error && items.length === 0 && (
                <div className={emptyStateWrapperClass}>
                  <div className={emptyEmojiClass}>📦</div>
                  <div className={emptyTitleClass}>У вас еще нет предметов</div>
                  <div className={emptyDescriptionClass}>
                    Получайте предметы через взаимодействия с монстрами или
                    покупайте в магазине
                  </div>
                </div>
              )}

              {items.length > 0 && (
                <div className={itemsGridClass}>
                  {items.map((userItem) => {
                    const item = userItem.inventoryitem;
                    const isClickable = item.activity;
                    const isDropdownOpen = selectedItem === item.inventoryid;
                    const cardClasses = `${getBadgeStyle(item.inventorytype)} ${itemCardBase} ${
                      isClickable
                        ? "cursor-pointer hover:shadow-2xl hover:-translate-y-1 active:scale-95"
                        : "opacity-60 cursor-not-allowed"
                    } ${isDropdownOpen ? "ring-2 ring-purple-500" : ""}`;

                    return (
                      <div key={item.inventoryid} className="relative">
                        <div
                          className={cardClasses}
                          onClick={() => {
                            if (isClickable && item.itemactions.length > 0) {
                              setSelectedItem(
                                isDropdownOpen ? null : item.inventoryid
                              );
                            }
                          }}
                        >
                          {parseInt(item.quantity) > 1 && (
                            <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-sm font-bold px-2 py-1 rounded-full shadow-md border-2 border-white">
                              {item.quantity}
                            </div>
                          )}

                          <div className={itemImageWrapperClass}>
                            <img
                              src={item.inventoryimage}
                              alt={item.inventoryname}
                              className={itemImageClass}
                              onError={(e) => {
                                console.error(
                                  `Ошибка загрузки изображения: ${item.inventoryimage}`
                                );
                                e.currentTarget.src = "/placeholder-item.png";
                              }}
                            />
                          </div>

                          <h3 className={itemNameClass}>{item.inventoryname}</h3>

                          <p className={itemDescriptionClass}>
                            {item.inventorydescription}
                          </p>

                          {isClickable && item.itemactions.length > 0 && (
                            <div className={indicatorWrapperClass}>
                              <div className="flex space-x-1">
                                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></div>
                                <div
                                  className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"
                                  style={{ animationDelay: "0.2s" }}
                                ></div>
                                <div
                                  className="w-1.5 h-1.5 bg-purple-300 rounded-full animate-pulse"
                                  style={{ animationDelay: "0.4s" }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>

                        {isDropdownOpen && item.itemactions.length > 0 && (
                          <>
                            <div
                              className="fixed inset-0 bg-black bg-opacity-25 z-40"
                              onClick={() => setSelectedItem(null)}
                            />

                            <div className={dropdownContainerClass}>
                              {item.itemactions.map((action, index) => (
                                <button
                                  key={index}
                                  className={`${dropdownButtonClass} ${
                                    actionLoading === action.actionname
                                      ? "bg-gray-50 cursor-not-allowed"
                                      : ""
                                  }`}
                                  onClick={() => handleItemAction(action)}
                                  disabled={actionLoading === action.actionname}
                                >
                                  <img
                                    src={action.actionicon}
                                    alt=""
                                    className={dropdownIconClass}
                                  />
                                  <span className="text-sm text-gray-700 flex-grow">
                                    {action.actionname}
                                  </span>
                                  {actionLoading === action.actionname && (
                                    <div className={dropdownSpinnerClass} />
                                  )}
                                </button>
                              ))}
                            </div>
                          </>
                        )}

                        {actionLoading &&
                          item.itemactions.some(
                            (action) => action.actionname === actionLoading
                          ) && (
                            <div className={actionOverlayClass}>
                              <div className="flex flex-col items-center gap-2">
                                <div className={actionSpinnerClass} />
                                <span className="text-sm text-purple-600 font-medium">
                                  Выполняется...
                                </span>
                              </div>
                            </div>
                          )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <React.Suspense
              fallback={
                <div className={monsterFallbackClass}>
                  <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              }
            >
              <MonsterItems
                userId={userId}
                onRefreshAllFrames={refreshAllFrames}
              />
            </React.Suspense>
          </div>
        )}

        {showModal && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
            onClick={() => {
              setShowModal(false);
              refreshAllFrames();
            }}
          >
            <div
              className={modalContainerClass}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={modalTitleClass}>Результат</div>
              <div className={modalTextClass}>{actionMessage}</div>
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowModal(false);
                    refreshAllFrames();
                  }}
                  className={modalButtonClass}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  if (isDesktopView) {
    return (
      <VKDesktopFrame title="Инвентарь" accent="emerald">
        {renderContent()}
      </VKDesktopFrame>
    );
  }

  return <div className="p-6">{renderContent()}</div>;
};

export default Inventory;
