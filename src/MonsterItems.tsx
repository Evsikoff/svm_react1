// MonsterItems.tsx — компонент фрейма "Предметы монстров"
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

// ===== Типы данных =====
interface ItemAction {
  actionname: string;
  actionicon: string;
  actionfunction: string;
  actionargument: string;
}

interface MonsterInventoryItem {
  inventoryid: number;
  inventoryname: string;
  inventoryimage: string;
  inventoryfunction: string | null;
  inventorydescription: string;
  inventorytype: number;
  inventorysaleprice: number;
  quantity: number;
  activity: boolean;
  itemactions: ItemAction[];
}

interface Monster {
  monsterid: number;
  monstername: string;
  monsterface: string;
  monsteritems: MonsterInventoryItem[];
}

interface MonsterItemsResponse {
  monsters: Monster[];
}

interface MonsterItemsProps {
  userId: number | null;
  onRefreshAllFrames: () => Promise<void>;
}

// ===== Универсальная функция с ретраями =====
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
const MonsterItems: React.FC<MonsterItemsProps> = ({
  userId,
  onRefreshAllFrames,
}) => {
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string>("");
  const [showModal, setShowModal] = useState(false);

  // ===== Загрузка предметов монстров =====
  const loadMonsterItems = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setError("userId отсутствует");
      return;
    }

    setLoading(true);
    try {
      const response = await withRetry(
        () =>
          axios.post<MonsterItemsResponse>(
            "https://functions.yandexcloud.net/d4ei3ql908qcgv45ikmo",
            { userId }
          ),
        (r) => r != null && Array.isArray((r as any)?.data?.monsters),
        "Ошибка при загрузке предметов монстров"
      );

      const monstersData = response.data.monsters || [];
      setMonsters(monstersData);

      // Автоматически выбираем первую вкладку только если activeTab еще не установлен
      // и только если у нас есть монстры
      if (monstersData.length > 0 && activeTab === null) {
        setActiveTab(monstersData[0].monsterid);
      }

      setError("");
    } catch (e: any) {
      setError(e.message || "Ошибка при загрузке предметов монстров");
    } finally {
      setLoading(false);
    }
  }, [userId]); // Убираем activeTab из зависимостей

  useEffect(() => {
    loadMonsterItems();
  }, [loadMonsterItems]);

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

  // ===== Получение цвета бейджа по типу предмета =====
  const getBadgeStyle = (type: number): string => {
    switch (type) {
      case 1:
        return "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200";
      case 2:
        return "bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200";
      case 3:
        return "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200";
      case 4:
        return "bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200";
      case 5:
        return "bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200";
      case 6:
        return "bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200";
      case 7:
        return "bg-gradient-to-br from-violet-50 to-violet-100 border-violet-200";
      case 8:
        return "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200";
      case 9:
        return "bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200";
      case 10:
        return "bg-gradient-to-br from-lime-50 to-lime-100 border-lime-200";
      case 11:
        return "bg-gradient-to-br from-sky-50 to-sky-100 border-sky-200";
      case 12:
        return "bg-gradient-to-br from-fuchsia-50 to-fuchsia-100 border-fuchsia-200";
      default:
        return "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200";
    }
  };

  const activeMonster = monsters.find((m) => m.monsterid === activeTab);

  // ===== Рендер =====
  return (
    <div className="mt-6">
      {/* Спиннер загрузки */}
      {loading && (
        <div className="w-full flex items-center justify-center py-16">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && (
        <div className="max-w-6xl mx-auto">
          {/* Ошибка */}
          {error && (
            <div className="bg-red-100 text-red-700 border border-red-300 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Фрейм "Предметы монстров" */}
          <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-xl shadow-lg border border-emerald-200 p-6">
            <h2 className="text-2xl font-bold text-emerald-800 mb-6 text-center">
              Предметы монстров
            </h2>

            {/* Сообщение об отсутствии монстров */}
            {!error && monsters.length === 0 && (
              <div className="text-center py-12">
                <div className="text-emerald-400 text-4xl mb-4">🐾</div>
                <div className="text-emerald-700 text-lg font-medium mb-2">
                  У монстров еще нет предметов
                </div>
                <div className="text-emerald-600 text-sm">
                  Передавайте предметы монстрам из вашего инвентаря
                </div>
              </div>
            )}

            {/* Вкладки монстров */}
            {monsters.length > 0 && (
              <>
                <div className="flex flex-wrap gap-2 mb-6 border-b border-emerald-200 pb-4">
                  {monsters.map((monster) => (
                    <button
                      key={monster.monsterid}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium
                        ${
                          activeTab === monster.monsterid
                            ? "bg-emerald-500 text-white shadow-md"
                            : "bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50"
                        }
                      `}
                      onClick={() => setActiveTab(monster.monsterid)}
                    >
                      <img
                        src={monster.monsterface}
                        alt={monster.monstername}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          console.error(
                            `Ошибка загрузки фото монстра: ${monster.monsterface}`
                          );
                          e.currentTarget.src = "/placeholder-monster.png";
                        }}
                      />
                      <span className="text-sm">{monster.monstername}</span>
                      {monster.monsteritems.length > 0 && (
                        <span className="bg-emerald-600 text-white text-xs px-2 py-1 rounded-full">
                          {monster.monsteritems.length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Содержимое активной вкладки */}
                {activeMonster && (
                  <div>
                    {activeMonster.monsteritems.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-emerald-400 text-3xl mb-3">📦</div>
                        <div className="text-emerald-700 font-medium">
                          У монстра еще нет предметов
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap justify-center gap-6">
                        {activeMonster.monsteritems.map((item) => {
                          const isClickable = item.activity;
                          const isDropdownOpen =
                            selectedItem ===
                            `${activeMonster.monsterid}-${item.inventoryid}`;

                          return (
                            <div key={item.inventoryid} className="relative">
                              {/* Основной бейдж предмета */}
                              <div
                                className={`
                                  ${getBadgeStyle(item.inventorytype)}
                                  border-2 rounded-xl p-4 shadow-md transition-all duration-200 w-64 min-h-[280px]
                                  ${
                                    isClickable
                                      ? "cursor-pointer hover:shadow-lg hover:scale-105 active:scale-95"
                                      : "opacity-60 cursor-not-allowed"
                                  }
                                  ${
                                    isDropdownOpen
                                      ? "ring-2 ring-emerald-500"
                                      : ""
                                  }
                                `}
                                onClick={() => {
                                  if (
                                    isClickable &&
                                    item.itemactions.length > 0
                                  ) {
                                    const itemKey = `${activeMonster.monsterid}-${item.inventoryid}`;
                                    setSelectedItem(
                                      isDropdownOpen ? null : itemKey
                                    );
                                  }
                                }}
                              >
                                {/* Количество предметов (бейдж в углу) */}
                                {item.quantity > 1 && (
                                  <div className="absolute -top-2 -right-2 bg-cyan-500 text-white text-sm font-bold px-2 py-1 rounded-full shadow-md border-2 border-white">
                                    {item.quantity}
                                  </div>
                                )}

                                {/* Изображение предмета */}
                                <div className="flex justify-center mb-3">
                                  <img
                                    src={item.inventoryimage}
                                    alt={item.inventoryname}
                                    className="w-16 h-16 object-contain"
                                    onError={(e) => {
                                      console.error(
                                        `Ошибка загрузки изображения: ${item.inventoryimage}`
                                      );
                                      e.currentTarget.src =
                                        "/placeholder-item.png";
                                    }}
                                  />
                                </div>

                                {/* Название предмета */}
                                <h3 className="text-sm font-bold text-gray-800 text-center mb-2 leading-tight">
                                  {item.inventoryname}
                                </h3>

                                {/* Описание предмета */}
                                <p className="text-xs text-gray-600 text-center leading-relaxed">
                                  {item.inventorydescription}
                                </p>

                                {/* Индикатор доступности действий */}
                                {isClickable && item.itemactions.length > 0 && (
                                  <div className="flex justify-center mt-3">
                                    <div className="flex space-x-1">
                                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                      <div
                                        className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"
                                        style={{ animationDelay: "0.2s" }}
                                      ></div>
                                      <div
                                        className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse"
                                        style={{ animationDelay: "0.4s" }}
                                      ></div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Выпадающий список действий */}
                              {isDropdownOpen &&
                                item.itemactions.length > 0 && (
                                  <>
                                    {/* Затемнение фона */}
                                    <div
                                      className="fixed inset-0 bg-black bg-opacity-25 z-40"
                                      onClick={() => setSelectedItem(null)}
                                    />

                                    {/* Выпадающий список */}
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                                      {item.itemactions.map((action, index) => (
                                        <button
                                          key={index}
                                          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 border-b border-gray-100 last:border-b-0 ${
                                            actionLoading === action.actionname
                                              ? "bg-gray-50 cursor-not-allowed"
                                              : ""
                                          }`}
                                          onClick={() =>
                                            handleItemAction(action)
                                          }
                                          disabled={
                                            actionLoading === action.actionname
                                          }
                                        >
                                          {/* Иконка действия */}
                                          <img
                                            src={action.actionicon}
                                            alt=""
                                            className="w-6 h-6 object-contain flex-shrink-0"
                                          />

                                          {/* Текст действия */}
                                          <span className="text-sm text-gray-700 flex-grow">
                                            {action.actionname}
                                          </span>

                                          {/* Спиннер для загружающегося действия */}
                                          {actionLoading ===
                                            action.actionname && (
                                            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                                          )}
                                        </button>
                                      ))}
                                    </div>
                                  </>
                                )}

                              {/* НОВЫЙ: Глобальный спиннер поверх карточки при выполнении действия */}
                              {actionLoading &&
                                item.itemactions.some(
                                  (action) =>
                                    action.actionname === actionLoading
                                ) && (
                                  <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-xl z-60">
                                    <div className="flex flex-col items-center gap-2">
                                      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                      <span className="text-sm text-emerald-600 font-medium">
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
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Модальное окно с сообщением о результате действия */}
      {showModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
          onClick={() => {
            setShowModal(false);
            // Обновляем все фреймы при закрытии по клику вне модального окна
            onRefreshAllFrames();
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-semibold mb-4 text-gray-800">
              Результат
            </div>
            <div className="text-gray-700 whitespace-pre-wrap mb-6">
              {actionMessage}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowModal(false);
                  // Обновляем все фреймы после закрытия модального окна
                  onRefreshAllFrames();
                }}
                className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors duration-200"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonsterItems;
