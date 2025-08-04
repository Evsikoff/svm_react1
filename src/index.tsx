import React, { useState, useEffect, useMemo } from "react"; // Убедитесь, что useMemo импортирован
import ReactDOM from "react-dom";
import axios from "axios";
import "./index.css";
import { SpeedInsights } from "@vercel/speed-insights/react";
import RaisingInteraction from "./RaisingInteraction";

// ... (все интерфейсы до App: React.FC остаются без изменений)
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
  placement:
    | "ceiling_above_the_bed"
    | "shelf_2"
    | "shelf_1"
    | "floor_is_on_the_righ"
    | "floor_is_on_the_left"
    | "shelf_3"
    | "shelf_6"
    | "shelf_10"
    | "shelf_9"
    | "left_side_of_the_room"
    | "table"
    | "board"
    | "shelf 5";
}

interface MonsterRoomResponse {
  monsterimage: string;
  roomimage: string;
  roomitems: RoomItem[];
}

interface ImpactResponse {
  errortext: string;
  video?: string;
  text?: string;
  characteristicschanges?: { name: string; amount: number }[];
}

// ИЗМЕНЕНИЕ 1: Добавим новый интерфейс для удобства
interface StyledRoomItem extends RoomItem {
  style: React.CSSProperties;
}

const App: React.FC = () => {
  // ... (все хуки useState, useEffect и функции до placementZones остаются без изменений)
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
          if (defaultItem) {
            setSelectedMenuItem(defaultItem.name);
          }
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
      if (enduranceChar) {
        setEnduranceIcon(enduranceChar.icon);
      }
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
    ) {
      return;
    }
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

  const placementZones: { [key: string]: React.CSSProperties } = {
    ceiling_above_the_bed: {
      top: "10%",
      left: "50%",
      width: "60%",
      height: "20%",
    },
    shelf_1: {
      top: "8.90%",
      left: "7.62%",
      width: "11.20%",
      height: "11.13%",
    },
    shelf_2: {
      top: "10.91%",
      left: "19.79%",
      width: "11.07%",
      height: "11.33%",
    },
    shelf_3: {
      top: "21.56%",
      left: "8.01%",
      width: "10.81%",
      height: "36.04%",
    },
    shelf_5: {
      top: "61.11%",
      left: "7.94%",
      width: "11.26%",
      height: "5.37%",
    },
    shelf_6: {
      top: "56.71%",
      left: "20.12%",
      width: "10.55%",
      height: "7.62%",
    },
    shelf_9: {
      top: "30.64%",
      left: "30.60%",
      width: "13.15%",
      height: "9.86%",
    },
    shelf_10: {
      top: "40.89%",
      left: "32.49%",
      width: "11.33%",
      height: "7.32%",
    },
    floor_is_on_the_right: {
      top: "86.05%",
      left: "89.78%",
      width: "9.57%",
      height: "12.99%",
    },
    floor_is_on_the_left: {
      top: "87.61%",
      left: "3.26%",
      width: "43.42%",
      height: "11.91%",
    },
    left_side_of_the_room: {
      top: "4.99%",
      left: "0.91%",
      width: "5.14%",
      height: "93.26%",
    },
    table: {
      top: "37.51%",
      left: "71.68%",
      width: "24.15%",
      height: "14.26%",
    },
    board: {
      top: "37.51%",
      left: "71.68%",
      width: "24.15%",
      height: "14.26%",
    },
  };

  // ИЗМЕНЕНИЕ 2: Обновляем useMemo с использованием Type Guard
  const memoizedItemsWithStyles = useMemo((): StyledRoomItem[] => {
    return roomItems
      .map((item): StyledRoomItem | null => {
        const zoneStyle = placementZones[item.placement];
        if (!zoneStyle) {
          console.warn(`Нет стиля для зоны размещения: ${item.placement}`);
          return null;
        }

        const topBase = parseFloat(zoneStyle.top as string);
        const leftBase = parseFloat(zoneStyle.left as string);
        const heightBase = parseFloat(zoneStyle.height as string);
        const widthBase = parseFloat(zoneStyle.width as string);

        // Ограничиваем случайные смещения, чтобы предметы оставались в зоне
        const maxOffsetX = widthBase * 0.8; // 80% от ширины зоны
        const maxOffsetY = heightBase * 0.8; // 80% от высоты зоны
        const randomTopOffset = Math.random() * maxOffsetY;
        const randomLeftOffset = Math.random() * maxOffsetX;

        const finalTop = topBase + randomTopOffset;
        const finalLeft = leftBase + randomLeftOffset;

        const itemStyle: React.CSSProperties = {
          position: "absolute",
          top: `${finalTop}%`,
          left: `${finalLeft}%`,
          width: "10%", // Можно настроить размер предметов
          transform: "translate(-50%, -50%)", // Центрируем предмет относительно его позиции
          zIndex: 5, // Предметы выше фона (zIndex: 1), но ниже монстра (zIndex: 10)
        };

        return { ...item, style: itemStyle };
      })
      .filter((item): item is StyledRoomItem => item !== null);
  }, [roomItems]);

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
                  className="relative aspect-[4/3]"
                  style={{ position: "relative", width: "100%" }}
                >
                  {/* Фон - комната */}
                  <img
                    src={roomImage}
                    alt="Room"
                    className="w-full h-full object-cover"
                    style={{ zIndex: 1 }}
                  />

                  {/* --- Новый рендер зон --- */}
                  {Object.entries(placementZones).map(
                    ([zoneName, zoneStyle]) => {
                      const itemsInZone = roomItems.filter(
                        (item) => item.placement === zoneName
                      );
                      if (itemsInZone.length === 0) return null;
                      return (
                        <div
                          key={zoneName}
                          style={{
                            ...zoneStyle,
                            position: "absolute",
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "flex-end",
                            justifyContent: "flex-start",
                            pointerEvents: "none",
                            zIndex: 5,
                          }}
                        >
                          {itemsInZone.map((item, idx) => (
                            <img
                              key={item.id}
                              src={item.spriteUrl}
                              alt={item.name}
                              title={item.name}
                              style={{
                                width: "72%", // увеличено на 80% (40% × 1.8)
                                maxWidth: "108px", // было 60px
                                marginLeft: idx === 0 ? 0 : "4%",
                                objectFit: "contain",
                                pointerEvents: "auto",
                              }}
                            />
                          ))}
                        </div>
                      );
                    }
                  )}

                  {/* Монстр */}
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
