import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { SpeedInsights } from "@vercel/speed-insights/react";

// Существующие компоненты (не меняем)
import RaisingInteraction from "./RaisingInteraction";
import Arena from "./Arena";
import Shop from "./Shop";
import Account from "./Account";
import Inventory from "./Inventory";

// Новые компоненты
import LoadingScreen from "./components/LoadingScreen";
import ErrorModal from "./components/ErrorModal";
import Spinner from "./components/Spinner";
import MobileMainMenu from "./components/MobileMainMenu";
import DesktopMenu from "./components/DesktopMenu";

// Типы
import {
  MenuItem,
  Monster,
  MonsterCharacteristic,
  MonsterImpact,
  RoomItem,
  ImpactResponse,
  BootTask,
  BootTaskKey,
} from "./types";

// Константы
import { BOOT_TASKS_ORDER, MENU_SEQUENCES, IMAGES } from "./constants";

// Сервисы
import { ApiService } from "./services/api";

// Утилиты
import { formatTimer } from "./utils";

const App: React.FC = () => {
  // ---- state ----
  const [userId, setUserId] = useState<number | null>(null);
  const [monstersId, setMonstersId] = useState<number[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState<string | null>(null);
  const [selectedMenuSequence, setSelectedMenuSequence] = useState<
    number | null
  >(null);
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [selectedMonsterId, setSelectedMonsterId] = useState<number | null>(
    null
  );
  const [teachEnergy, setTeachEnergy] = useState<number>(0);
  const [nextReplenishment, setNextReplenishment] = useState<string>("");
  const [timer, setTimer] = useState<number>(0);
  const [characteristics, setCharacteristics] = useState<
    MonsterCharacteristic[]
  >([]);
  const [impacts, setImpacts] = useState<MonsterImpact[]>([]);
  const [monsterImage, setMonsterImage] = useState<string>("");
  const [isMonsterLoading, setIsMonsterLoading] = useState<boolean>(false);
  const [roomImage, setRoomImage] = useState<string>("");
  const [roomItems, setRoomItems] = useState<RoomItem[]>([]);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [showRaisingInteraction, setShowRaisingInteraction] =
    useState<boolean>(false);
  const [interactionData, setInteractionData] = useState<ImpactResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [roomComposite, setRoomComposite] = useState<string>("");

  // --- состояние экрана загрузки ---
  const [booting, setBooting] = useState<boolean>(true);
  const [bootTasks, setBootTasks] = useState<BootTask[]>(
    BOOT_TASKS_ORDER.map((t) => ({ ...t }))
  );

  // Создаем экземпляр API сервиса
  const apiService = new ApiService((error) => setError(error));

  // --- отметка выполненной задачи на прогресс-баре ---
  const markTaskDone = (key: BootTaskKey) => {
    setBootTasks((prev) =>
      prev.map((t) => (t.key === key ? { ...t, done: true } : t))
    );
  };

  // ---- ЕДИНЫЙ Bootstrap первоначальной загрузки приложения ----
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        setBooting(true);
        setError("");

        // 1) init
        const initRes = await apiService.init();
        if (cancelled) return;
        setUserId(initRes.userId);
        setMonstersId(initRes.monstersId);
        markTaskDone("init");

        // 2) main menu
        const mainMenuRes = await apiService.getMainMenu(initRes.monstersId);
        if (cancelled) return;
        const items = mainMenuRes.menuitems || [];
        const sortedItems = items.sort((a, b) => a.sequence - b.sequence);
        setMenuItems(sortedItems);
        const def = sortedItems.find((it) => it.index);
        if (def) {
          setSelectedMenuItem(def.name);
          setSelectedMenuSequence(def.sequence);
        }
        markTaskDone("mainmenu");

        // 3) notifications
        const notificationRes = await apiService.getNotifications(
          initRes.userId
        );
        if (cancelled) return;
        setNotificationCount(notificationRes.notificationquantity);
        markTaskDone("notifications");

        // 4) monsters
        const monstersRes = await apiService.getMonsters(initRes.monstersId);
        if (cancelled) return;
        const sorted = (monstersRes.monsters || []).sort(
          (a, b) => a.sequence - b.sequence
        );
        setMonsters(sorted);
        const def2 = sorted.findIndex((m) => m.index);
        let selectedMonsterLocal: number | null = null;
        if (def2 >= 0) {
          selectedMonsterLocal = initRes.monstersId[def2];
        } else {
          selectedMonsterLocal = initRes.monstersId[0];
        }
        setSelectedMonsterId(selectedMonsterLocal);
        markTaskDone("monsters");

        if (selectedMonsterLocal == null) {
          throw new Error("Не удалось определить выбранного монстра");
        }

        // 5) teach energy
        const energyRes = await apiService.getTeachEnergy(initRes.userId);
        if (cancelled) return;
        setTeachEnergy(energyRes.teachenergy);
        setNextReplenishment(energyRes.nextfreereplenishment);
        markTaskDone("teachenergy");

        // 6) characteristics
        const characteristicsRes = await apiService.getCharacteristics(
          selectedMonsterLocal
        );
        if (cancelled) return;
        setCharacteristics(characteristicsRes.monstercharacteristics || []);
        markTaskDone("characteristics");

        // 7) monster room
        const roomRes = await apiService.getMonsterRoom(selectedMonsterLocal);
        if (cancelled) return;
        setMonsterImage(roomRes.monsterimage);
        setRoomImage(roomRes.roomimage);
        setRoomItems(roomRes.roomitems || []);
        markTaskDone("monsterroom");

        // 8) impacts
        const impactsRes = await apiService.getImpacts(selectedMonsterLocal);
        if (cancelled) return;
        setImpacts(impactsRes.monsterimpacts || []);
        markTaskDone("impacts");

        setBooting(false);
      } catch {
        setBooting(false);
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);
  // Формирование изображения комнаты с предметами
  useEffect(() => {
    if (!roomImage) {
      setRoomComposite("");
      return;
    }

    const generateComposite = async () => {
      try {
        const loadImage = (src: string) =>
          new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load image ${src}`));
            img.src = src;
          });

        const bg = await loadImage(roomImage);
        const canvas = document.createElement("canvas");
        canvas.width = bg.naturalWidth;
        canvas.height = bg.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(bg, 0, 0);

        for (const item of roomItems) {
          try {
            const sprite = await loadImage(item.spriteUrl);
            const x = (item.xaxis / 100) * canvas.width;
            const y = (item.yaxis / 100) * canvas.height;
            ctx.drawImage(
              sprite,
              x - sprite.naturalWidth / 2,
              y - sprite.naturalHeight / 2
            );
          } catch (err) {
            console.warn(`Не удалось загрузить спрайт ${item.spriteUrl}`, err);
          }
        }

        setRoomComposite(canvas.toDataURL());
      } catch (err) {
        console.error("Ошибка формирования изображения комнаты", err);
      }
    };

    setRoomComposite("");
    generateComposite();
  }, [roomImage, roomItems]);

  // Таймер пополнения энергии
  useEffect(() => {
    if (booting) return;
    if (!nextReplenishment) return;

    const targetTime = new Date(nextReplenishment).getTime();
    let hasTriggeredReload = false; // Флаг для предотвращения повторных вызовов

    const updateTimer = () => {
      const now = new Date().getTime();
      const timeLeft = Math.max(0, Math.floor((targetTime - now) / 1000));
      setTimer(timeLeft);

      // Вызываем loadTeachEnergy только один раз когда таймер достигает 0
      if (timeLeft <= 0 && !hasTriggeredReload) {
        hasTriggeredReload = true;
        loadTeachEnergy();
      }
    };

    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [nextReplenishment, userId, booting]);

  // Загрузка энергии пользователя
  const loadTeachEnergy = async () => {
    if (!userId) return;
    try {
      const energyRes = await apiService.getTeachEnergy(userId);
      setTeachEnergy(energyRes.teachenergy);
      setNextReplenishment(energyRes.nextfreereplenishment);
    } catch {
      // ошибка уже показана
    }
  };

  // Загрузка характеристик выбранного монстра
  const loadCharacteristics = async () => {
    if (!selectedMonsterId) return;
    try {
      const characteristicsRes = await apiService.getCharacteristics(
        selectedMonsterId
      );
      setCharacteristics(characteristicsRes.monstercharacteristics || []);
    } catch {
      // ошибка уже показана
    }
  };

  // Загрузка комнаты монстра
  const loadMonsterRoom = async () => {
    if (!selectedMonsterId) return;
    try {
      const roomRes = await apiService.getMonsterRoom(selectedMonsterId);
      setRoomComposite("");
      setMonsterImage(roomRes.monsterimage);
      setRoomImage(roomRes.roomimage);
      setRoomItems(roomRes.roomitems || []);
    } catch {
      // ошибка уже показана
    }
  };

  // Загрузка взаимодействий
  const loadImpacts = async () => {
    if (!selectedMonsterId) return;
    try {
      const impactsRes = await apiService.getImpacts(selectedMonsterId);
      setImpacts(impactsRes.monsterimpacts || []);
    } catch {
      // ошибка уже показана
    }
  };

  // Загрузка данных монстра при смене selectedMonsterId
  useEffect(() => {
    if (booting || !selectedMonsterId) return;

    const loadMonsterData = async () => {
      setIsMonsterLoading(true);
      try {
        await Promise.all([
          loadCharacteristics(),
          loadMonsterRoom(),
          loadImpacts(),
        ]);
      } catch (error) {
        console.error("Ошибка при загрузке данных монстра:", error);
        setError("Ошибка при загрузке данных монстра");
      } finally {
        setIsMonsterLoading(false);
      }
    };

    loadMonsterData();
  }, [selectedMonsterId, booting]);

  // Загрузка главного меню
  const loadMainMenu = async () => {
    if (monstersId.length === 0) return;
    try {
      const mainMenuRes = await apiService.getMainMenu(monstersId);
      const items = mainMenuRes.menuitems || [];
      const sortedItems = items.sort((a, b) => a.sequence - b.sequence);
      setMenuItems(sortedItems);

      // Обновляем выбранный пункт меню, если он изменился
      const currentSelectedItem = sortedItems.find(
        (item) => item.name === selectedMenuItem
      );
      if (currentSelectedItem) {
        setSelectedMenuItem(currentSelectedItem.name);
        setSelectedMenuSequence(currentSelectedItem.sequence);
      }
    } catch {
      // ошибка уже показана
    }
  };

  // --- клик по взаимодействию ---
  const handleImpactClick = async (impact: MonsterImpact) => {
    if (
      !impact.available ||
      teachEnergy < impact.energyprice ||
      !userId ||
      !selectedMonsterId
    )
      return;

    setIsLoading(true);
    let shouldOpenInteraction = false;

    try {
      const response = await apiService.executeImpact(
        selectedMonsterId,
        impact.id,
        userId
      );

      if (response.errortext) {
        setError(response.errortext);
        return;
      }

      setInteractionData(response);
      shouldOpenInteraction = true;

      // Подзагрузим связанные данные, пока крутится спиннер
      await Promise.all([loadTeachEnergy(), loadCharacteristics()]);
    } catch {
      setError("Ошибка при выполнении взаимодействия");
    } finally {
      // ВАЖНО: сначала скрываем спиннер, затем показываем видео-блок
      setIsLoading(false);
      if (shouldOpenInteraction) {
        // Монтируем компонент только после исчезновения спиннера
        setShowRaisingInteraction(true);
      }
    }
  };

  const closeError = () => {
    setError("");
  };

  const closeRaisingInteraction = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadTeachEnergy(),
        loadCharacteristics(),
        loadMonsterRoom(),
        loadImpacts(),
        loadMainMenu(), // Добавляем обновление главного меню
      ]);
    } catch {
      setError("Ошибка при обновлении данных");
    } finally {
      setIsLoading(false);
      setShowRaisingInteraction(false);
      setInteractionData(null);
    }
  };

  // --- обработчик клика по пунктам главного меню ---
  const handleMenuClick = async (item: MenuItem) => {
    setSelectedMenuItem(item.name);
    setSelectedMenuSequence(item.sequence);

    if (item.sequence === MENU_SEQUENCES.RAISING) {
      // Показ/обновление раздела "Воспитание"
      setShowRaisingInteraction(false);
      setIsLoading(true);
      try {
        await Promise.all([
          loadTeachEnergy(),
          loadCharacteristics(),
          loadMonsterRoom(),
          loadImpacts(),
        ]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // --- обработчик переключения монстра ---
  const handleMonsterSwitch = (newMonsterId: number) => {
    if (newMonsterId === selectedMonsterId) return;

    // Сбрасываем старые данные изображений
    setMonsterImage("");
    setRoomImage("");
    setRoomItems([]);

    setSelectedMonsterId(newMonsterId);
  };

  // --- UI ---
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-200 to-orange-200">
      {/* ЭКРАН ПЕРВИЧНОЙ ЗАГРУЗКИ */}
      {booting && !error && <LoadingScreen bootTasks={bootTasks} />}
      {/* Спиннер для выполнения взаимодействий */}
      {isLoading && <Spinner overlay />}
      {/* Окно ошибок */}
      {error && <ErrorModal error={error} onClose={closeError} />}
      {/* Основное содержимое приложения */}
      <div className="bg-gradient-to-r from-purple-500 to-orange-500 text-white text-4xl font-handwritten text-center py-4">
        СИМУЛЯТОР ВОСПИТАНИЯ МОНСТРОВ
      </div>
      {/* Мобильная версия главного меню */}
      <MobileMainMenu
        items={menuItems}
        selectedName={selectedMenuItem}
        notificationCount={notificationCount}
        onSelect={handleMenuClick}
        onToggleNotifications={() => setShowNotifications(!showNotifications)}
      />
      {/* Десктопная версия главного меню */}
      <DesktopMenu
        menuItems={menuItems}
        selectedMenuItem={selectedMenuItem}
        notificationCount={notificationCount}
        onMenuClick={handleMenuClick}
        onToggleNotifications={() => setShowNotifications(!showNotifications)}
      />
      {showNotifications && (
        <div className="bg-orange-100 p-4 shadow-md">Оповещения</div>
      )}
      {showRaisingInteraction && interactionData && (
        <RaisingInteraction
          videoUrl={interactionData.video || ""}
          text={interactionData.text || ""}
          characteristicsChanges={interactionData.characteristicschanges || []}
          inventoryItems={interactionData.inventoryitems || []}
          itemEffects={interactionData.itemeffects || []}
          itemBonuses={interactionData.impactitembonuses || []}
          onClose={closeRaisingInteraction}
        />
      )}
      {/* Раздел "Воспитание" - упрощённая версия без отдельного компонента */}

      {/* Раздел "Воспитание" - полная версия с компонентами */}
      {!showRaisingInteraction &&
        selectedMenuSequence === MENU_SEQUENCES.RAISING && (
          <div className="p-4">
            {/* БЛОК С ПЕРЕКЛЮЧАТЕЛЕМ МОНСТРОВ И ЭНЕРГИЕЙ */}
            <div className="flex flex-col gap-4 md:flex-row md:justify-between">
              {/* Переключатель монстров */}
              <div className="flex space-x-1 overflow-x-auto pb-1">
                {monsters.map((monster, index) => (
                  <div
                    key={monster.name}
                    className={`relative min-w-[229px] w-[229px] h-[200px] bg-orange-50 shadow-lg p-2 cursor-pointer border border-gray-300 ${
                      selectedMonsterId === monstersId[index]
                        ? "border-2 border-purple-500"
                        : ""
                    }`}
                    onClick={() => handleMonsterSwitch(monstersId[index])}
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
                    src={IMAGES.energy}
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

                <button className="w-full mt-2 bg-gray-300 text-gray-500 px-4 py-2 rounded cursor-not-allowed">
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
                    {isMonsterLoading || !roomComposite ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <>
                        <img
                          src={roomComposite}
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
                        {/* Монстр поверх всего */}
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

                {/* Характеристики монстра */}
                <div className="mt-4 space-y-2 p-2">
                  {characteristics
                    .slice()
                    .sort((a, b) => b.value - a.value)
                    .map((char) => (
                      <div
                        key={char.id}
                        className="flex items-center space-x-2 bg-purple-100 p-2 shadow border border-gray-300"
                      >
                        <img
                          src={char.icon}
                          alt={char.name}
                          className="w-8 h-8"
                        />
                        <span className="text-purple-700 font-semibold">
                          {char.name}: {char.value}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Набор доступных воспитательных взаимодействий с монстром */}
              <div className="w-full md:w-1/2 mt-4 md:mt-0 grid grid-cols-2 md:grid-cols-4 gap-1 bg-purple-200">
                {impacts.map((impact) => {
                  // Получаем иконку выносливости для отображения минимальных требований
                  const enduranceIcon =
                    characteristics.find((c) => c.id === 10012)?.icon || "";

                  return (
                    <div
                      key={impact.id}
                      className={`relative bg-purple-50 p-0.5 shadow border border-gray-300 flex flex-col items-center justify-between ${
                        impact.available && teachEnergy >= impact.energyprice
                          ? "cursor-pointer hover:bg-purple-100 hover:shadow-md"
                          : "opacity-50 hover:opacity-70 hover:shadow-gray-400"
                      }`}
                      title={impact.comment}
                      onClick={() => handleImpactClick(impact)}
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
                  );
                })}
              </div>
            </div>
          </div>
        )}
      {/* Остальные разделы */}
      {!showRaisingInteraction &&
        selectedMenuSequence === MENU_SEQUENCES.ARENA && <Arena />}
      {!showRaisingInteraction &&
        selectedMenuSequence === MENU_SEQUENCES.SHOP && (
          <Shop userId={userId} />
        )}
      {!showRaisingInteraction &&
        selectedMenuSequence === MENU_SEQUENCES.INVENTORY && (
          <Inventory userId={userId} />
        )}
      {!showRaisingInteraction &&
        selectedMenuSequence === MENU_SEQUENCES.ACCOUNT && <Account />}
      <SpeedInsights />
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
