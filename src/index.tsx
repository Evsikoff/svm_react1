import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./index.css";
import { SpeedInsights } from "@vercel/speed-insights/react";
import RaisingInteraction from "./RaisingInteraction";

// ...все твои интерфейсы ниже (можно не менять):

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
  placement: string; // placement не используется
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

const App: React.FC = () => {
  // ---- state ----
  const [userId, setUserId] = useState<number | null>(null);
  const [monstersId, setMonstersId] = useState<number[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState<string | null>(null);
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [enduranceIcon, setEnduranceIcon] = useState<string>("");

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

  // ---- инициализация и загрузки ----
  useEffect(() => {
    const initApp = async () => {
      try {
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
      } catch (err) {
        setError("Ошибка при инициализации приложения");
      }
    };
    initApp();
  }, []);

  useEffect(() => {
    if (monstersId.length > 0) {
      const loadMainMenu = async () => {
        try {
          const response = await axios.post<MainMenuResponse>(
            "https://d5ddiovnmsbs5p6merq9.8wihnuyr.apigw.yandexcloud.net/mainmenu",
            { monstersId }
          );
          const items = response.data.menuitems;
          const indexItems = items.filter((item) => item.index);
          if (indexItems.length > 1) {
            setError("Ошибка: Несколько пунктов меню с index=true");
            return;
          }
          setMenuItems(items.sort((a, b) => a.sequence - b.sequence));
          const defaultItem = items.find((item) => item.index);
          if (defaultItem) setSelectedMenuItem(defaultItem.name);
        } catch (err) {
          setError("Ошибка при загрузке главного меню");
        }
      };
      loadMainMenu();
    }
  }, [monstersId]);

  useEffect(() => {
    if (userId) {
      const loadNotifications = async () => {
        try {
          const response = await axios.get<NotificationResponse>(
            `https://d5ddiovnmsbs5p6merq9.8wihnuyr.apigw.yandexcloud.net/notificationcounter?userId=${userId}`
          );
          setNotificationCount(response.data.notificationquantity);
        } catch (err) {
          setError("Ошибка при загрузке уведомлений");
        }
      };
      loadNotifications();
    }
  }, [userId]);

  useEffect(() => {
    if (monstersId.length > 0) {
      const loadMonsters = async () => {
        try {
          const response = await axios.post<MonstersResponse>(
            "https://d5ddiovnmsbs5p6merq9.8wihnuyr.apigw.yandexcloud.net/monsters",
            { monstersId }
          );
          const sortedMonsters = response.data.monsters.sort(
            (a, b) => a.sequence - b.sequence
          );
          setMonsters(sortedMonsters);
          const defaultMonster = sortedMonsters.find((m) => m.index);
          if (defaultMonster) {
            setSelectedMonsterId(
              monstersId[sortedMonsters.findIndex((m) => m.index)]
            );
          }
        } catch (err) {
          setError("Ошибка при загрузке монстров");
        }
      };
      loadMonsters();
    }
  }, [monstersId]);

  const loadTeachEnergy = async () => {
    if (!userId) return;
    try {
      const response = await axios.post<TeachEnergyResponse>(
        "https://functions.yandexcloud.net/d4ek0gg34e57hosr45u8",
        { userId }
      );
      setTeachEnergy(response.data.teachenergy);
      setNextReplenishment(response.data.nextfreereplenishment);
    } catch (err) {
      setError("Ошибка при загрузке энергии");
    }
  };

  useEffect(() => {
    loadTeachEnergy();
  }, [userId]);

  useEffect(() => {
    if (nextReplenishment) {
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
    }
  }, [nextReplenishment, userId]);

  const loadCharacteristics = async () => {
    if (!selectedMonsterId) return;
    try {
      const response = await axios.post<MonsterCharacteristicsResponse>(
        "https://functions.yandexcloud.net/d4eja3aglipp5f8hfb73",
        { monsterId: selectedMonsterId }
      );
      setCharacteristics(response.data.monstercharacteristics);
      const enduranceChar = response.data.monstercharacteristics.find(
        (char) => char.id === 10012
      );
      if (enduranceChar) setEnduranceIcon(enduranceChar.icon);
    } catch (err) {
      setError("Ошибка при загрузке характеристик монстра");
    }
  };
  useEffect(() => {
    loadCharacteristics();
  }, [selectedMonsterId]);

  const loadMonsterRoom = async () => {
    if (!selectedMonsterId || characteristics.length === 0) return;
    try {
      const response = await axios.post<MonsterRoomResponse>(
        "https://functions.yandexcloud.net/d4eqemr3g0g9i1kbt5u0",
        {
          monsterId: selectedMonsterId,
          monstercharacteristics: characteristics.map((c) => ({
            id: c.id,
            value: c.value,
          })),
        }
      );
      setMonsterImage(response.data.monsterimage);
      setRoomImage(response.data.roomimage);
      setRoomItems(response.data.roomitems || []);
    } catch (err) {
      setError("Ошибка при загрузке изображений монстра и комнаты");
    }
  };
  useEffect(() => {
    loadMonsterRoom();
  }, [selectedMonsterId, characteristics]);

  const loadImpacts = async () => {
    if (!selectedMonsterId) return;
    try {
      const response = await axios.post<MonsterImpactsResponse>(
        "https://functions.yandexcloud.net/d4en3p6tiu5kcoe261mj",
        { monsterId: selectedMonsterId }
      );
      setImpacts(response.data.monsterimpacts);
    } catch (err) {
      setError("Ошибка при загрузке взаимодействий");
    }
  };
  useEffect(() => {
    loadImpacts();
  }, [selectedMonsterId]);

  const handleImpactClick = async (impact: MonsterImpact) => {
    if (
      !impact.available ||
      teachEnergy < impact.energyprice ||
      !userId ||
      !selectedMonsterId
    )
      return;
    setIsLoading(true);
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
      } else {
        setInteractionData(response.data);
        setShowRaisingInteraction(true);
        await Promise.all([loadTeachEnergy(), loadCharacteristics()]);
      }
    } catch (err) {
      setError("Ошибка при выполнении взаимодействия");
    } finally {
      setIsLoading(false);
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
    } catch (err) {
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

  // --- UI ---
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-200 to-orange-200">
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {error && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg">
            <div className="text-red-500 text-center mb-4">{error}</div>
            <button
              onClick={closeError}
              className="bg-purple-500 text-white px-4 py-2 rounded"
            >
              OK
            </button>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-purple-500 to-orange-500 text-white text-4xl font-handwritten text-center py-4">
        СИМУЛЯТОР ВОСПИТАНИЯ МОНСТРОВ
      </div>

      <div className="flex items-center bg-purple-600 text-white p-4">
        <div className="flex space-x-4">
          {menuItems.map((item) => (
            <div
              key={item.name}
              className={`flex items-center space-x-2 p-2 cursor-pointer ${
                selectedMenuItem === item.name ? "bg-purple-800" : ""
              }`}
              onClick={() => setSelectedMenuItem(item.name)}
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

      {!showRaisingInteraction && selectedMenuItem && (
        <div className="p-4">
          <div className="flex justify-between">
            <div className="flex space-x-1">
              {monsters.map((monster, index) => (
                <div
                  key={monster.name}
                  className={`relative w-[229px] h-[200px] bg-orange-50 shadow-lg p-2 cursor-pointer border border-gray-300 ${
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
            <div className="flex items-center space-x-2 border border-gray-300 p-2 bg-purple-50">
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
                  {/* Теперь рендер предметов */}
                  {roomItems.map((item) => {
                    const size = roomItemSizes[item.id];
                    if (!size) return null; // Ждем загрузки
                    // Ширина/высота фонового изображения
                    const bgW = roomBgSize.width;
                    const bgH = roomBgSize.height;
                    // Перевод процентов в пиксели
                    const cx = (item.xaxis / 100) * bgW;
                    const cy = (item.yaxis / 100) * bgH;
                    // Чтобы центр совпал с точкой:
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
                  {/* Монстр (оставь как было, если он должен быть поверх предметов): */}
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
            <div className="w-full md:w-1/2 mt-4 md:mt-0 grid grid-cols-4 gap-1 bg-purple-200">
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
                  <div className="text-center text-purple-800 my-0">
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
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import { createRoot } from "react-dom/client";
const root = createRoot(document.getElementById("root")!);
root.render(<App />);
