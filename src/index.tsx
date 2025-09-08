import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { SpeedInsights } from "@vercel/speed-insights/react";

// Существующие компоненты
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
import CompositeRoomRenderer from "./components/CompositeRoomRenderer";

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
import { formatTimer, withInfiniteRetryAndTimeout } from "./utils";

const YANDEX_CLIENT_ID = "3d7ec2c7ceb34ed59b445d7fb152ac9f";
const YANDEX_CLIENT_SECRET = "1d85ca9e132b4e419c960c38832f8d71";

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

  // --- состояние экрана загрузки ---
  const [booting, setBooting] = useState<boolean>(true);
  const [bootTasks, setBootTasks] = useState<BootTask[]>(
    BOOT_TASKS_ORDER.map((t) => ({ ...t }))
  );

  // --- состояния для оптимизации энергии ---
  const [isLoadingEnergy, setIsLoadingEnergy] = useState<boolean>(false);
  const [lastEnergyUpdate, setLastEnergyUpdate] = useState<number>(0);

  // Api: СТАБИЛЬНЫЙ экземпляр на весь жизненный цикл компонента
  const apiService = useMemo(
    () => new ApiService((err: string) => setError(err)),
    []
  );

  // --- отметка выполненной задачи на прогресс-баре ---
  const markTaskDone = (key: BootTaskKey) => {
    setBootTasks((prev) =>
      prev.map((t) => (t.key === key ? { ...t, done: true } : t))
    );
  };

  // --- загрузчики данных (без параметров, используют selectedMonsterId) ---

  const loadTeachEnergy = useCallback(
    async (forceUpdate: boolean = false) => {
      if (!userId) return;
      if (isLoadingEnergy) return;

      const now = Date.now();
      if (!forceUpdate && now - lastEnergyUpdate < 30000) return;

      setIsLoadingEnergy(true);
      try {
        const energyRes = await apiService.getTeachEnergy(userId, forceUpdate);
        setTeachEnergy(energyRes.teachenergy);
        setNextReplenishment(energyRes.nextfreereplenishment);
        setLastEnergyUpdate(now);
      } catch (e) {
        console.error("Ошибка загрузки энергии:", e);
      } finally {
        setIsLoadingEnergy(false);
      }
    },
    [userId, isLoadingEnergy, lastEnergyUpdate, apiService]
  );

  const loadCharacteristics = useCallback(async () => {
    if (!selectedMonsterId) return;
    const characteristicsRes = await apiService.getCharacteristics(
      selectedMonsterId
    );
    setCharacteristics(characteristicsRes.monstercharacteristics || []);
  }, [selectedMonsterId, apiService]);

  const loadMonsterRoom = useCallback(async () => {
    if (!selectedMonsterId) return;
    const roomRes = await apiService.getMonsterRoom(selectedMonsterId);
    setMonsterImage(roomRes.monsterimage);
    setRoomImage(roomRes.roomimage);
    setRoomItems(roomRes.roomitems || []);
  }, [selectedMonsterId, apiService]);

  const loadImpacts = useCallback(async () => {
    if (!selectedMonsterId) return;
    const impactsRes = await apiService.getImpacts(selectedMonsterId);
    setImpacts(impactsRes.monsterimpacts || []);
  }, [selectedMonsterId, apiService]);

  const loadMonsters = useCallback(async () => {
    if (!monstersId.length) return;
    const monstersRes = await apiService.getMonsters(monstersId);
    const sorted = (monstersRes.monsters || []).sort(
      (a, b) => a.sequence - b.sequence
    );
    setMonsters(sorted);
  }, [monstersId, apiService]);

  const loadMainMenu = useCallback(async () => {
    if (!monstersId.length) return;
    const mainMenuRes = await apiService.getMainMenu(monstersId);
    const items = mainMenuRes.menuitems || [];
    const sortedItems = items.sort((a, b) => a.sequence - b.sequence);
    setMenuItems(sortedItems);
  }, [monstersId, apiService]);

  // --- обработчик клика по пунктам главного меню ---
  const handleMenuClick = useCallback(
    async (item: MenuItem) => {
      setSelectedMenuItem(item.name);
      setSelectedMenuSequence(item.sequence);

      if (item.sequence === MENU_SEQUENCES.RAISING) {
        setShowRaisingInteraction(false);
        setIsLoading(true);
        try {
          // Обновляем только то, что не дублирует пакетную загрузку монстра
          await Promise.all([loadTeachEnergy(), loadMonsters()]);
        } catch {
          setError("Ошибка при обновлении данных");
        } finally {
          setIsLoading(false);
        }
      }
    },
    [loadTeachEnergy, loadMonsters]
  );

  // --- обработчик переключения монстра ---
  const handleMonsterSwitch = useCallback(
    (newMonsterId: number) => {
      if (newMonsterId === selectedMonsterId || isMonsterLoading) return;

      // Сбрасываем визуал
      setMonsterImage("");
      setRoomImage("");
      setRoomItems([]);

      // Только меняем выбранного монстра — эффект ниже загрузит пакет
      setSelectedMonsterId(newMonsterId);
    },
    [selectedMonsterId, isMonsterLoading]
  );

  // --- единая точка загрузки “пакета монстра”: характеристики + комната + воздействия ---
  useEffect(() => {
    if (!selectedMonsterId) return;

    let cancelled = false;
    setIsMonsterLoading(true);

    Promise.all([loadCharacteristics(), loadMonsterRoom(), loadImpacts()])
      .catch(() => {
        if (!cancelled) setError("Ошибка при обновлении данных");
      })
      .finally(() => {
        if (!cancelled) setIsMonsterLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedMonsterId, loadCharacteristics, loadMonsterRoom, loadImpacts]);

  // ---- Bootstrap первоначальной загрузки приложения ----
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        setBooting(true);
        setError("");

        // 1) init
        const initRes = await withInfiniteRetryAndTimeout(
          () => apiService.init(),
          5000,
          "init",
          setError
        );
        if (cancelled) return;
        setUserId(initRes.userId);
        setMonstersId(initRes.monstersId);
        markTaskDone("init");

        // 2) Параллельно тянем главное меню, уведомления, монстров и энергию
        const [mainMenuRes, notificationRes, monstersRes, energyRes] =
          await Promise.all([
            withInfiniteRetryAndTimeout(
              () => apiService.getMainMenu(initRes.monstersId),
              5000,
              "mainmenu",
              setError
            ).then((res) => {
              markTaskDone("mainmenu");
              return res;
            }),
            withInfiniteRetryAndTimeout(
              () => apiService.getNotifications(initRes.userId),
              5000,
              "notifications",
              setError
            ).then((res) => {
              markTaskDone("notifications");
              return res;
            }),
            withInfiniteRetryAndTimeout(
              () => apiService.getMonsters(initRes.monstersId),
              5000,
              "monsters",
              setError
            ).then((res) => {
              markTaskDone("monsters");
              return res;
            }),
            withInfiniteRetryAndTimeout(
              () => apiService.getTeachEnergy(initRes.userId),
              5000,
              "teachenergy",
              setError
            ).then((res) => {
              markTaskDone("teachenergy");
              return res;
            }),
          ]);
        if (cancelled) return;

        // Меню
        const items = mainMenuRes.menuitems || [];
        const sortedItems = items.sort((a, b) => a.sequence - b.sequence);
        setMenuItems(sortedItems);
        const def = sortedItems.find((it) => it.index);
        if (def) {
          setSelectedMenuItem(def.name);
          setSelectedMenuSequence(def.sequence);
        }

        // Уведомления
        setNotificationCount(notificationRes.notificationquantity);

        // Монстры
        const sorted = (monstersRes.monsters || []).sort(
          (a, b) => a.sequence - b.sequence
        );
        setMonsters(sorted);

        // Выбор монстра
        const defaultMonster = sorted.find((m) => m.index);
        let selectedMonsterLocal: number | null = null;
        if (defaultMonster) {
          selectedMonsterLocal = (defaultMonster as any).monsterId;
        } else if (sorted.length > 0) {
          selectedMonsterLocal = (sorted[0] as any).monsterId;
        }
        setSelectedMonsterId(selectedMonsterLocal);
        if (selectedMonsterLocal == null) {
          throw new Error("Не удалось определить выбранного монстра");
        }

        // Энергия (фиксируем время последнего обновления)
        setTeachEnergy(energyRes.teachenergy);
        setNextReplenishment(energyRes.nextfreereplenishment);
        setLastEnergyUpdate(Date.now());

        // Важно: не грузим характер/комнату/воздействия здесь — это сделает единый эффект на selectedMonsterId
        setBooting(false);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Ошибка загрузки приложения";
        setError(errorMessage);
        setBooting(false);
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [apiService]);

  // Обработка возврата с авторизации Yandex
  useEffect(() => {
    const url = new URL(window.location.href);
    const state = url.searchParams.get("state");
    const code = url.searchParams.get("code");
    const errorParam = url.searchParams.get("error");

    const clearParams = () => {
      url.searchParams.delete("code");
      url.searchParams.delete("error");
      url.searchParams.delete("state");
      window.history.replaceState(
        null,
        "",
        url.pathname +
          (url.searchParams.toString()
            ? `?${url.searchParams.toString()}`
            : "") +
          url.hash
      );
    };

    if (state !== "yandex_auth") return;

    if (errorParam) {
      setError("Авторизация Yandex не удалась");
      clearParams();
      return;
    }

    if (code && userId) {
      const fetchYandexAuth = async () => {
        try {
          const tokenResponse = await fetch("https://oauth.yandex.ru/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              grant_type: "authorization_code",
              code,
              client_id: YANDEX_CLIENT_ID,
              client_secret: YANDEX_CLIENT_SECRET,
            }),
          });

          if (!tokenResponse.ok) {
            throw new Error(`HTTP error! status: ${tokenResponse.status}`);
          }

          const tokenData = await tokenResponse.json();
          const accessToken = tokenData.access_token;

          const infoResponse = await fetch(
            "https://login.yandex.ru/info?format=json",
            {
              headers: { Authorization: `OAuth ${accessToken}` },
            }
          );

          if (!infoResponse.ok) {
            throw new Error(`HTTP error! status: ${infoResponse.status}`);
          }

          const info = await infoResponse.json();
          const avatarUrl = info.is_avatar_empty
            ? ""
            : `https://avatars.yandex.net/get-yapic/${info.default_avatar_id}/islands-200`;

          const response = await fetch(
            "https://functions.yandexcloud.net/d4el0k9669mrdg265k5r",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId,
                newserviceid: info.id,
                newservicename: info.display_name || info.login,
                newserviceimage: avatarUrl,
                service: "yandex",
              }),
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();

          if (result.userId) {
            clearParams();
            window.location.reload();
            return;
          }

          setError(result.text || "Авторизация Yandex не удалась");
        } catch (err) {
          console.error("Ошибка при авторизации через Yandex:", err);
          setError("Ошибка при авторизации Yandex");
        } finally {
          clearParams();
        }
      };

      fetchYandexAuth();
    }
  }, [userId]);

  // Эффект для предпросмотра/кеша размеров предметов
  useEffect(() => {
    if (roomItems.length === 0) return;

    const loadDimensions = async () => {
      for (const item of roomItems) {
        try {
          const img = new Image();
          await new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = item.spriteUrl;
          });
        } catch {
          // no-op
        }
      }
    };

    loadDimensions();
  }, [roomItems]);

  // Таймер пополнения энергии
  useEffect(() => {
    if (booting || !nextReplenishment) return;

    const updateTimer = () => {
      const replenishDate = new Date(nextReplenishment);
      const now = new Date();
      const diff = Math.max(
        0,
        Math.floor((replenishDate.getTime() - now.getTime()) / 1000)
      );
      setTimer(diff);

      if (diff === 0 && Date.now() - lastEnergyUpdate > 30000) {
        loadTeachEnergy(true);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [booting, nextReplenishment, lastEnergyUpdate, loadTeachEnergy]);

  // --- обработчик клика по воздействию ---
  const handleImpactClick = useCallback(
    async (impact: MonsterImpact) => {
      if (
        !impact.available ||
        teachEnergy < impact.energyprice ||
        !selectedMonsterId ||
        !userId
      ) {
        return;
      }

      setIsLoading(true);
      try {
        const response = await apiService.applyImpact(
          selectedMonsterId,
          impact.id,
          userId
        );
        setInteractionData(response);
        setShowRaisingInteraction(true);

        await Promise.all([
          loadTeachEnergy(true),
          loadCharacteristics(),
          // при необходимости: loadMonsterRoom(), loadImpacts()
          loadMainMenu(),
        ]);
      } catch {
        setError("Ошибка при обновлении данных");
      } finally {
        setIsLoading(false);
      }
    },
    [
      teachEnergy,
      selectedMonsterId,
      userId,
      apiService,
      loadTeachEnergy,
      loadCharacteristics,
      loadMainMenu,
    ]
  );

  // --- UI ---
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-200 to-orange-200">
      {/* Экран первичной загрузки */}
      {booting && !error && <LoadingScreen bootTasks={bootTasks} />}
      {/* Спиннер для выполнения взаимодействий */}
      {isLoading && <Spinner overlay />}
      {/* Окно ошибок */}
      {error && <ErrorModal error={error} onClose={() => setError("")} />}

      {/* Заголовок */}
      <div className="bg-gradient-to-r from-purple-500 to-orange-500 text-white text-4xl font-handwritten text-center py-4">
        СИМУЛЯТОР ВОСПИТАНИЯ МОНСТРОВ
      </div>

      {/* Мобильное меню */}
      <MobileMainMenu
        items={menuItems}
        selectedName={selectedMenuItem}
        notificationCount={notificationCount}
        onSelect={handleMenuClick}
        onToggleNotifications={() => setShowNotifications(!showNotifications)}
      />

      {/* Десктопное меню */}
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

      {/* Воспитательное взаимодействие */}
      {showRaisingInteraction && interactionData && (
        <RaisingInteraction
          videoUrl={interactionData.video || ""}
          text={interactionData.text || ""}
          characteristicsChanges={interactionData.characteristicschanges || []}
          inventoryItems={interactionData.inventoryitems || []}
          itemEffects={interactionData.itemeffects || []}
          itemBonuses={interactionData.impactitembonuses || []}
          onClose={() => {
            setShowRaisingInteraction(false);
            setInteractionData(null);
          }}
        />
      )}

      {/* Раздел "Воспитание" */}
      {!showRaisingInteraction &&
        selectedMenuSequence === MENU_SEQUENCES.RAISING && (
          <div className="p-4">
            {/* Переключатель монстров + энергия */}
            <div className="flex flex-col gap-4 md:flex-row md:justify-between">
              <div
                className={`flex space-x-1 overflow-x-auto pb-1 ${
                  isMonsterLoading ? "opacity-50" : ""
                }`}
              >
                {monsters.map((monster) => {
                  const monsterId = (monster as any).monsterId;
                  return (
                    <div
                      key={`${monster.name}-${monsterId}`}
                      className={`relative min-w-[229px] w-[229px] h-[200px] bg-orange-50 shadow-lg p-2 border border-gray-300 ${
                        selectedMonsterId === monsterId
                          ? "border-2 border-purple-500"
                          : ""
                      } ${
                        isMonsterLoading
                          ? "cursor-not-allowed pointer-events-none"
                          : "cursor-pointer"
                      }`}
                      onClick={() =>
                        !isMonsterLoading && handleMonsterSwitch(monsterId)
                      }
                    >
                      <img
                        src={monster.face}
                        alt={monster.name}
                        className="w-[229px] h-[129px]"
                      />
                      <div className="text-center font-handwritten text-lg">
                        {monster.name}
                      </div>
                      <div className="text-xs text-gray-500 text-center">
                        ID: {monsterId}
                      </div>
                    </div>
                  );
                })}
              </div>

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
              {/* Комната + характеристики */}
              <div className="w-full md:w-1/2 border border-gray-300 bg-orange-100 flex flex-col">
                <CompositeRoomRenderer
                  roomImage={roomImage}
                  monsterImage={monsterImage}
                  roomItems={roomItems}
                  isLoading={isMonsterLoading}
                  className="w-full"
                />

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

              {/* Воздействия */}
              <div className="w-full md:w-1/2 mt-4 md:mt-0 grid grid-cols-2 md:grid-cols-4 gap-1 bg-purple-200">
                {impacts.map((impact) => {
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
        selectedMenuSequence === MENU_SEQUENCES.ARENA && (
          <Arena userId={userId} />
        )}
      {!showRaisingInteraction &&
        selectedMenuSequence === MENU_SEQUENCES.SHOP && (
          <Shop userId={userId} />
        )}
      {!showRaisingInteraction &&
        selectedMenuSequence === MENU_SEQUENCES.INVENTORY && (
          <Inventory userId={userId} />
        )}
      {!showRaisingInteraction &&
        selectedMenuSequence === MENU_SEQUENCES.ACCOUNT && (
          <Account userId={userId} />
        )}

      {/* Подвал с ссылкой на оферту */}
      <footer className="bg-gradient-to-r from-purple-500 to-orange-500 text-white py-2 mt-8">
        <div className="text-center">
          <a
            href="https://docs.google.com/document/d/e/2PACX-1vTOXF-D4HZnMxHe9v1JXwQQTdb_Ys1Hx1EqGPhEV0aoRQsZ8aHdLb1r7TGQqg-mml-kcyhOomch6YgQ/pub"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white text-sm underline hover:text-purple-200 transition-colors duration-200"
          >
            Оферта
          </a>
        </div>
      </footer>

      <SpeedInsights />
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
