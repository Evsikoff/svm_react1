import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./index.css";
import { SpeedInsights } from "@vercel/speed-insights/react";
import RaisingInteraction from "./RaisingInteraction";
import Arena from "./Arena";
import Invent from "./Invent";
import Account from "./Account";

// Автоматическое поджатие текста под ширину контейнера (в одну строку)
// Автоматическое поджатие текста: сначала в одну строку,
// если дошли до минимума и всё равно не влезло — включаем переносы.
const AutoFitText: React.FC<{
  children: React.ReactNode;
  min?: number;
  max?: number;
  className?: string;
}> = ({ children, min = 10, max = 16, className }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Сброс стилей
    el.style.whiteSpace = "nowrap";
    el.style.overflow = "hidden";
    el.style.fontSize = `${max}px`;
    el.style.lineHeight = "1.1";
    el.style.display = "block";
    el.style.width = "100%";

    // Этап 1: ужимаем в одну строку
    let font = max;
    while (font > min && el.scrollWidth > el.clientWidth) {
      font -= 1;
      el.style.fontSize = `${font}px`;
    }

    // Этап 2: если достигли минимума и текст всё ещё шире контейнера,
    // включаем переносы строк с дефисами
    if (el.scrollWidth > el.clientWidth) {
      el.style.whiteSpace = "normal";
      (el.style as any).overflowWrap = "anywhere"; // страхует длинные слова
      (el.style as any).wordBreak = "break-word";
      (el.style as any).hyphens = "auto";
    }
  }, [children, min, max]);

  return (
    <div ref={ref} className={`w-full text-center ${className || ""}`}>
      {children}
    </div>
  );
};

// --- типы данных ---
interface InitResponse {
  userId: number;
  monstersId: number[];
  newUser: boolean;
}
interface MenuItem {
  name: string;
  sequence: number;
  iconURL: string;
  index: boolean;
}
interface MainMenuResponse {
  menuitems: MenuItem[];
}
interface NotificationResponse {
  notificationquantity: number;
}
interface Monster {
  face: string;
  name: string;
  sequence: number;
  index: boolean;
}
interface MonstersResponse {
  monsters: Monster[];
}
interface TeachEnergyResponse {
  teachenergy: number;
  nextfreereplenishment: string;
}
interface MonsterCharacteristic {
  id: number;
  value: number;
  icon: string;
  name: string;
}
interface MonsterCharacteristicsResponse {
  monstercharacteristics: MonsterCharacteristic[];
}
interface MonsterImpact {
  id: number;
  image: string;
  name: string;
  comment: string;
  available: boolean;
  energyprice: number;
  minendurance?: number;
}
interface MonsterImpactsResponse {
  monsterimpacts: MonsterImpact[];
}

interface RoomItem {
  id: number;
  name: string;
  spriteUrl: string;
  placement: string;
  xaxis: number;
  yaxis: number;
}

interface MonsterRoomResponse {
  monsterimage: string;
  roomimage: string;
  roomitems: RoomItem[];
}

interface InventoryItem {
  inventoryid: number;
  inventoryname: string;
  inventoryimage: string;
  inventorydescription: string;
  quantity: number;
}

interface ImpactResponse {
  errortext: string;
  video?: string;
  text?: string;
  characteristicschanges?: {
    characteristicsid: number;
    name: string;
    amount: number;
  }[];
  inventoryitems?: InventoryItem[];
}

// --- вспомогательные типы для полосы загрузки ---
type BootTaskKey =
  | "init"
  | "mainmenu"
  | "notifications"
  | "monsters"
  | "teachenergy"
  | "characteristics"
  | "monsterroom"
  | "impacts";

type BootTask = { key: BootTaskKey; label: string; done: boolean };

const BOOT_TASKS_ORDER: BootTask[] = [
  { key: "init", label: "Инициализация", done: false },
  { key: "mainmenu", label: "Главное меню", done: false },
  { key: "notifications", label: "Уведомления", done: false },
  { key: "monsters", label: "Монстры", done: false },
  { key: "teachenergy", label: "Энергия", done: false },
  { key: "characteristics", label: "Характеристики", done: false },
  { key: "monsterroom", label: "Комната и монстр", done: false },
  { key: "impacts", label: "Взаимодействия", done: false },
];

const MobileMainMenu: React.FC<{
  items: MenuItem[];
  selectedName: string | null;
  notificationCount: number;
  onSelect: (item: MenuItem) => void;
  onToggleNotifications: () => void;
}> = ({
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
  const [roomImage, setRoomImage] = useState<string>("");
  const [roomItems, setRoomItems] = useState<RoomItem[]>([]);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [showRaisingInteraction, setShowRaisingInteraction] =
    useState<boolean>(false);
  const [interactionData, setInteractionData] = useState<ImpactResponse | null>(
    null
  );

  const [isLoading, setIsLoading] = useState<boolean>(false); // спиннер для взаимодействий

  // --- состояние экрана загрузки ---
  const [booting, setBooting] = useState<boolean>(true);
  const [bootTasks, setBootTasks] = useState<BootTask[]>(
    BOOT_TASKS_ORDER.map((t) => ({ ...t }))
  );

  // Для хранения размеров каждой картинки-предмета (по id)
  const [roomItemSizes, setRoomItemSizes] = useState<
    Record<number, { width: number; height: number }>
  >({});
  // Для размеров фонового изображения комнаты
  const roomBgRef = useRef<HTMLImageElement>(null);
  const [roomBgSize, setRoomBgSize] = useState<{
    width: number;
    height: number;
  }>({ width: 1, height: 1 }); // не 0 чтобы избежать деления на ноль

  // -------- универсальная обёртка с повторами --------
  async function withRetry<T>(
    fn: () => Promise<T>,
    isValid: (v: T) => boolean,
    labelForError: string
  ): Promise<T> {
    let lastErr: any = null;
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        const res = await fn();
        // "ничего не выдал" — считаем невалидным
        if (!isValid(res)) {
          throw new Error("Пустой или некорректный ответ");
        }
        return res;
      } catch (e) {
        lastErr = e;
        if (attempt < 4) {
          // небольшая пауза между повторами
          await new Promise((r) => setTimeout(r, 300));
          continue;
        }
      }
    }
    // 4-я попытка провалилась — показываем уже разработанную ошибку
    const text =
      typeof lastErr?.message === "string"
        ? `${labelForError}: ${lastErr.message}`
        : `${labelForError}`;
    setError(text);
    setBooting(false);
    throw lastErr;
  }

  // -------- методы загрузки --------
  const api = {
    init: async () =>
      withRetry(
        async () => {
          const response = await axios.post<InitResponse>(
            "https://d5ddiovnmsbs5p6merq9.8wihnuyr.apigw.yandexcloud.net/init",
            {
              yandexUserId: "ajeksdnx-somerandomid-29112024",
              yandexUserName: "Иван Петров",
              yandexUserPhotoURL:
                "https://avatars.yandex.net/get-yapic/12345/some-image-id/islands-200",
            }
          );
          setUserId(response.data.userId);
          setMonstersId(response.data.monstersId);
          return response.data;
        },
        (d) =>
          !!d && typeof d.userId === "number" && Array.isArray(d.monstersId),
        "Ошибка при инициализации приложения"
      ),

    mainmenu: async (monstersIdParam: number[]) =>
      withRetry(
        async () => {
          const response = await axios.post<MainMenuResponse>(
            "https://d5ddiovnmsbs5p6merq9.8wihnuyr.apigw.yandexcloud.net/mainmenu",
            { monstersId: monstersIdParam }
          );
          const items = response.data.menuitems || [];
          const indexItems = items.filter((item) => item.index);
          if (indexItems.length > 1) {
            throw new Error("Несколько пунктов меню с index=true");
          }
          const sortedItems = items.sort((a, b) => a.sequence - b.sequence);
          setMenuItems(sortedItems);
          const def = sortedItems.find((it) => it.index);
          if (def) {
            setSelectedMenuItem(def.name);
            setSelectedMenuSequence(def.sequence);
          }
          return response.data;
        },
        (d) => !!d && Array.isArray(d.menuitems),
        "Ошибка при загрузке главного меню"
      ),

    notifications: async (userIdParam: number) =>
      withRetry(
        async () => {
          const response = await axios.get<NotificationResponse>(
            `https://d5ddiovnmsbs5p6merq9.8wihnuyr.apigw.yandexcloud.net/notificationcounter?userId=${userIdParam}`
          );
          setNotificationCount(response.data.notificationquantity);
          return response.data;
        },
        (d) => d != null && typeof d.notificationquantity === "number",
        "Ошибка при загрузке уведомлений"
      ),

    monsters: async (monstersIdParam: number[]) =>
      withRetry(
        async () => {
          const response = await axios.post<MonstersResponse>(
            "https://d5ddiovnmsbs5p6merq9.8wihnuyr.apigw.yandexcloud.net/monsters",
            { monstersId: monstersIdParam }
          );
          const sorted = (response.data.monsters || []).sort(
            (a, b) => a.sequence - b.sequence
          );
          setMonsters(sorted);
          const def = sorted.findIndex((m) => m.index);
          if (def >= 0) setSelectedMonsterId(monstersIdParam[def]);
          return response.data;
        },
        (d) => !!d && Array.isArray(d.monsters),
        "Ошибка при загрузке монстров"
      ),

    teachenergy: async (userIdParam: number) =>
      withRetry(
        async () => {
          const response = await axios.post<TeachEnergyResponse>(
            "https://functions.yandexcloud.net/d4ek0gg34e57hosr45u8",
            { userId: userIdParam }
          );
          setTeachEnergy(response.data.teachenergy);
          setNextReplenishment(response.data.nextfreereplenishment);
          return response.data;
        },
        (d) => d != null && typeof d.teachenergy === "number",
        "Ошибка при загрузке энергии"
      ),

    characteristics: async (monsterIdParam: number) =>
      withRetry(
        async () => {
          const response = await axios.post<MonsterCharacteristicsResponse>(
            "https://functions.yandexcloud.net/d4eja3aglipp5f8hfb73",
            { monsterId: monsterIdParam }
          );
          setCharacteristics(response.data.monstercharacteristics || []);
          return response.data;
        },
        (d) => !!d && Array.isArray(d.monstercharacteristics),
        "Ошибка при загрузке характеристик монстра"
      ),

    monsterroom: async (
      monsterIdParam: number,
      characteristicsParam: MonsterCharacteristic[]
    ) =>
      withRetry(
        async () => {
          const response = await axios.post<MonsterRoomResponse>(
            "https://functions.yandexcloud.net/d4eqemr3g0g9i1kbt5u0",
            {
              monsterId: monsterIdParam,
              monstercharacteristics: characteristicsParam.map((c) => ({
                id: c.id,
                value: c.value,
              })),
            }
          );
          setMonsterImage(response.data.monsterimage);
          setRoomImage(response.data.roomimage);
          setRoomItems(response.data.roomitems || []);
          return response.data;
        },
        (d) => !!d && !!d.monsterimage && !!d.roomimage,
        "Ошибка при загрузке изображений монстра и комнаты"
      ),

    impacts: async (monsterIdParam: number) =>
      withRetry(
        async () => {
          const response = await axios.post<MonsterImpactsResponse>(
            "https://functions.yandexcloud.net/d4en3p6tiu5kcoe261mj",
            { monsterId: monsterIdParam }
          );
          setImpacts(response.data.monsterimpacts || []);
          return response.data;
        },
        (d) => !!d && Array.isArray(d.monsterimpacts),
        "Ошибка при загрузке взаимодействий"
      ),
  };

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
        const initRes = await api.init();
        if (cancelled) return;
        markTaskDone("init");

        // 2) main menu
        await api.mainmenu(initRes.monstersId);
        if (cancelled) return;
        markTaskDone("mainmenu");

        // 3) notifications
        await api.notifications(initRes.userId);
        if (cancelled) return;
        markTaskDone("notifications");

        // 4) monsters
        const monstersRes = await api.monsters(initRes.monstersId);
        if (cancelled) return;
        markTaskDone("monsters");

        // определяем выбранного монстра
        let selectedMonsterLocal: number | null = null;
        if (Array.isArray(monstersRes.monsters)) {
          const idx = monstersRes.monsters.findIndex((m) => m.index);
          selectedMonsterLocal =
            idx >= 0 ? initRes.monstersId[idx] : initRes.monstersId[0];
        } else {
          selectedMonsterLocal = initRes.monstersId[0];
        }

        if (selectedMonsterLocal == null) {
          throw new Error("Не удалось определить выбранного монстра");
        }

        // 5) teach energy
        await api.teachenergy(initRes.userId);
        if (cancelled) return;
        markTaskDone("teachenergy");

        // 6) characteristics
        const charRes = await api.characteristics(selectedMonsterLocal);
        if (cancelled) return;
        markTaskDone("characteristics");

        // 7) monster room (нужны характеристики)
        await api.monsterroom(
          selectedMonsterLocal,
          charRes.monstercharacteristics || []
        );
        if (cancelled) return;
        markTaskDone("monsterroom");

        // 8) impacts
        await api.impacts(selectedMonsterLocal);
        if (cancelled) return;
        markTaskDone("impacts");

        setBooting(false);
      } catch {
        // setError уже выставлен в withRetry, тут просто убедимся, что загрузчик скрыт
        setBooting(false);
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  // --- дальнейшие эффекты (НЕ работают во время bootstrap, чтобы не было дублей) ---
  // Главное меню (реакция на monstersId) — после бутстрапа может пригодиться при смене монстров
  useEffect(() => {
    if (booting) return;
    if (monstersId.length === 0) return;
    (async () => {
      try {
        await api.mainmenu(monstersId);
      } catch {
        /* ошибка уже показана */
      }
    })();
  }, [monstersId, booting]);

  // Уведомления — при наличии userId
  useEffect(() => {
    if (booting) return;
    if (!userId) return;
    (async () => {
      try {
        await api.notifications(userId);
      } catch {
        /* ошибка уже показана */
      }
    })();
  }, [userId, booting]);

  // Монстры — при смене monstersId
  useEffect(() => {
    if (booting) return;
    if (monstersId.length === 0) return;
    (async () => {
      try {
        await api.monsters(monstersId);
      } catch {
        /* ошибка уже показана */
      }
    })();
  }, [monstersId, booting]);

  // Энергия пользователя
  const loadTeachEnergy = async () => {
    if (!userId) return;
    try {
      await api.teachenergy(userId);
    } catch {
      /* ошибка уже показана */
    }
  };
  useEffect(() => {
    if (booting) return;
    loadTeachEnergy();
  }, [userId, booting]);

  // Таймер пополнения энергии
  useEffect(() => {
    if (booting) return;
    if (!nextReplenishment) return;
    const targetTime = new Date(nextReplenishment).getTime();
    const updateTimer = () => {
      const now = new Date().getTime();
      const timeLeft = Math.max(0, Math.floor((targetTime - now) / 1000));
      setTimer(timeLeft);
      if (timeLeft <= 0) {
        loadTeachEnergy();
      }
    };
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [nextReplenishment, userId, booting]);

  // Характеристики выбранного монстра
  const loadCharacteristics = async () => {
    if (!selectedMonsterId) return;
    try {
      await api.characteristics(selectedMonsterId);
    } catch {
      /* ошибка уже показана */
    }
  };
  useEffect(() => {
    if (booting) return;
    loadCharacteristics();
  }, [selectedMonsterId, booting]);

  // Комната монстра
  const loadMonsterRoom = async () => {
    if (!selectedMonsterId || characteristics.length === 0) return;
    try {
      await api.monsterroom(selectedMonsterId, characteristics);
    } catch {
      /* ошибка уже показана */
    }
  };
  useEffect(() => {
    if (booting) return;
    loadMonsterRoom();
  }, [selectedMonsterId, characteristics, booting]);

  // Взаимодействия
  const loadImpacts = async () => {
    if (!selectedMonsterId) return;
    try {
      await api.impacts(selectedMonsterId);
    } catch {
      /* ошибка уже показана */
    }
  };
  useEffect(() => {
    if (booting) return;
    loadImpacts();
  }, [selectedMonsterId, booting]);

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
      const response = await axios.post<ImpactResponse>(
        "https://functions.yandexcloud.net/d4een4tv1fhjs9o05ogj",
        {
          monsterId: selectedMonsterId,
          impactId: impact.id,
          userId: userId,
        }
      );

      if (response.data.errortext) {
        setError(response.data.errortext);
        return;
      }

      setInteractionData(response.data);
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

  const formatTimer = (timeInSeconds: number): string => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;
    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours} часов`);
    if (minutes > 0 || hours > 0) parts.push(`${minutes} минут`);
    parts.push(`${seconds} секунд`);
    return parts.join(" ");
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
      ]);
    } catch {
      setError("Ошибка при обновлении данных");
    } finally {
      setIsLoading(false);
      setShowRaisingInteraction(false);
      setInteractionData(null);
    }
  };

  // --- загрузка размеров спрайтов предметов ---
  useEffect(() => {
    if (roomItems.length === 0) {
      setRoomItemSizes({});
      return;
    }
    let isMounted = true;
    const sizes: Record<number, { width: number; height: number }> = {};
    const promises = roomItems.map((item) => {
      return new Promise<void>((resolve) => {
        const img = new window.Image();
        img.onload = () => {
          sizes[item.id] = { width: img.width, height: img.height };
          resolve();
        };
        img.onerror = () => resolve();
        img.src = item.spriteUrl;
      });
    });
    Promise.all(promises).then(() => {
      if (isMounted) setRoomItemSizes(sizes);
    });
    return () => {
      isMounted = false;
    };
  }, [roomItems]);

  // --- обновление размера фоновой картинки (на случай ресайза окна) ---
  useEffect(() => {
    function updateSize() {
      if (roomBgRef.current) {
        setRoomBgSize({
          width: roomBgRef.current.clientWidth,
          height: roomBgRef.current.clientHeight,
        });
      }
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => {
      window.removeEventListener("resize", updateSize);
    };
  }, [roomImage]);

  // --- вычисления для enduranceIcon (иконка выносливости) ---
  const enduranceIcon = characteristics.find((c) => c.id === 10012)?.icon || "";

  // --- обработчик клика по пунктам главного меню ---
  const handleMenuClick = async (item: MenuItem) => {
    setSelectedMenuItem(item.name);
    setSelectedMenuSequence(item.sequence);

    if (item.sequence === 1) {
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

  // --- UI ---
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-200 to-orange-200">
      {/* ЭКРАН ПЕРВИЧНОЙ ЗАГРУЗКИ */}
      {booting && !error && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b from-purple-200 to-orange-200">
          <img
            src="https://storage.yandexcloud.net/svm/loading.gif"
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
            <div className="flex justify-between text-xs text-gray-600">
              {bootTasks.map((t) => (
                <span key={t.key} className="truncate w-[12%]">
                  {t.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Спиннер для выполнения взаимодействий */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Окно ошибок */}
      {error && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[120]">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-[90%]">
            <div className="text-red-500 text-center mb-4">{error}</div>
            <button
              onClick={() => setError("")}
              className="bg-purple-500 text-white px-4 py-2 rounded w-full"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Основное содержимое приложения (скрыто под экраном загрузки) */}
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

      <div className="hidden md:flex items-center bg-purple-600 text-white p-4">
        <div className="flex space-x-4">
          {menuItems.map((item) => (
            <div
              key={item.name}
              className={`flex items-center space-x-2 p-2 cursor-pointer ${
                selectedMenuItem === item.name ? "bg-purple-800" : ""
              }`}
              onClick={() => handleMenuClick(item)}
            >
              <img src={item.iconURL} alt={item.name} className="w-8 h-8" />
              <span>{item.name}</span>
            </div>
          ))}
        </div>
        <div className="ml-auto relative">
          <img
            src="https://storage.yandexcloud.net/svm/img/bell.png"
            alt="Notifications"
            className="w-8 h-8 cursor-pointer"
            onClick={() => setShowNotifications(!showNotifications)}
          />
          {notificationCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full px-2">
              {notificationCount}
            </span>
          )}
        </div>
      </div>

      {showNotifications && (
        <div className="bg-orange-100 p-4 shadow-md">Оповещения</div>
      )}

      {showRaisingInteraction && interactionData && (
        <RaisingInteraction
          videoUrl={interactionData.video || ""}
          text={interactionData.text || ""}
          characteristicsChanges={interactionData.characteristicschanges || []}
          inventoryItems={interactionData.inventoryitems || []}
          onClose={closeRaisingInteraction}
        />
      )}

      {/* Раздел "Воспитание" — sequence=1 */}
      {!showRaisingInteraction && selectedMenuSequence === 1 && (
        <div className="p-4">
          {/* БЛОК С ПЕРЕКЛЮЧАТЕЛЕМ МОНСТРОВ И ЭНЕРГИЕЙ */}
          <div className="flex flex-col gap-2 md:flex-row md:justify-between">
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
                  onClick={() => setSelectedMonsterId(monstersId[index])}
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
            <div className="flex items-center space-x-2 border border-gray-300 p-2 bg-purple-50 w-full md:w-auto">
              <img
                src="https://storage.yandexcloud.net/svm/img/userteachenergy.png"
                alt="Teach Energy"
                className="w-8 h-8"
              />
              <span>Энергия: {teachEnergy}</span>
              {teachEnergy < 10 && (
                <span>До пополнения: {formatTimer(timer)}</span>
              )}
              <button className="bg-gray-300 text-gray-500 px-4 py-2 rounded cursor-not-allowed">
                Пополнить энергию
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-col md:flex-row md:space-x-1">
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
                  <img
                    src={roomImage}
                    alt="Room"
                    ref={roomBgRef}
                    className="w-full h-full object-contain"
                    style={{
                      display: "block",
                      zIndex: 1,
                      position: "relative",
                      pointerEvents: "none",
                      background: "#fff",
                    }}
                    onLoad={() => {
                      if (roomBgRef.current) {
                        setRoomBgSize({
                          width: roomBgRef.current.clientWidth,
                          height: roomBgRef.current.clientHeight,
                        });
                      }
                    }}
                  />
                  {/* Предметы */}
                  {roomItems.map((item) => {
                    const size = roomItemSizes[item.id];
                    if (!size) return null;
                    const bgW = roomBgSize.width;
                    const bgH = roomBgSize.height;
                    const cx = (item.xaxis / 100) * bgW;
                    const cy = (item.yaxis / 100) * bgH;
                    const leftPx = cx - size.width / 2;
                    const topPx = cy - size.height / 2;
                    return (
                      <img
                        key={item.id}
                        src={item.spriteUrl}
                        alt={item.name}
                        title={item.name}
                        style={{
                          position: "absolute",
                          left: `${leftPx}px`,
                          top: `${topPx}px`,
                          width: `${size.width}px`,
                          height: `${size.height}px`,
                          zIndex: 5,
                          pointerEvents: "auto",
                        }}
                      />
                    );
                  })}
                  {/* Монстр поверх */}
                  <img
                    src={monsterImage}
                    alt="Monster"
                    className="absolute bottom-[10%] left-1/2 w-1/2 transform -translate-x-1/2"
                    style={{ zIndex: 10 }}
                  />
                </div>
              )}
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
              {impacts.map((impact) => (
                <div
                  key={impact.name}
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

                  {/* Название авто-ужимается, чтобы не вылезать за пределы бейджа */}
                  <AutoFitText
                    className="text-purple-800 px-1"
                    min={10}
                    max={16}
                  >
                    {impact.name}
                  </AutoFitText>

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
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Простые визуальные заглушки для sequence 2/3/4 */}
      {!showRaisingInteraction && selectedMenuSequence === 2 && <Arena />}
      {!showRaisingInteraction && selectedMenuSequence === 3 && (
        <Invent userId={userId} />
      )}
      {!showRaisingInteraction && selectedMenuSequence === 4 && <Account />}

      <SpeedInsights />
    </div>
  );
};

import { createRoot } from "react-dom/client";
const root = createRoot(document.getElementById("root")!);
root.render(<App />);
