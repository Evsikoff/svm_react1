import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import "./index.css";
import { SpeedInsights } from "@vercel/speed-insights/react";

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
  image: string;
  name: string;
  comment: string;
  available: boolean;
}

interface MonsterImpactsResponse {
  monsterimpacts: MonsterImpact[];
}

interface MonsterRoomResponse {
  monsterimage: string;
  roomimage: string;
}

const App: React.FC = () => {
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
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Initialize application
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

  // Load main menu
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

  // Load notifications
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

  // Load monsters
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

  // Load teach energy
  useEffect(() => {
    if (userId) {
      const loadTeachEnergy = async () => {
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
      loadTeachEnergy();
    }
  }, [userId]);

  // Timer for energy replenishment
  useEffect(() => {
    if (nextReplenishment) {
      const targetTime = new Date(nextReplenishment).getTime();
      const updateTimer = () => {
        const now = new Date().getTime();
        const timeLeft = Math.max(0, Math.floor((targetTime - now) / 1000));
        setTimer(timeLeft);
        if (timeLeft <= 0) {
          // Reload teach energy
          const loadTeachEnergy = async () => {
            try {
              const response = await axios.post<TeachEnergyResponse>(
                "https://functions.yandexcloud.net/d4ek0gg34e57hosr45u8",
                { userId }
              );
              setTeachEnergy(response.data.teachenergy);
              setNextReplenishment(response.data.nextfreereplenishment);
            } catch (err) {
              setError("Ошибка при обновлении энергии");
            }
          };
          loadTeachEnergy();
        }
      };
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [nextReplenishment, userId]);

  // Load monster characteristics
  useEffect(() => {
    if (selectedMonsterId) {
      const loadCharacteristics = async () => {
        try {
          const response = await axios.post<MonsterCharacteristicsResponse>(
            "https://functions.yandexcloud.net/d4eja3aglipp5f8hfb73",
            { monsterId: selectedMonsterId }
          );
          setCharacteristics(response.data.monstercharacteristics);
        } catch (err) {
          setError("Ошибка при загрузке характеристик монстра");
        }
      };
      loadCharacteristics();
    }
  }, [selectedMonsterId]);

  // Load monster and room image
  useEffect(() => {
    if (selectedMonsterId && characteristics.length > 0) {
      const loadMonsterRoom = async () => {
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
        } catch (err) {
          setError("Ошибка при загрузке изображений монстра и комнаты");
        }
      };
      loadMonsterRoom();
    }
  }, [selectedMonsterId, characteristics]);

  // Load monster impacts
  useEffect(() => {
    if (selectedMonsterId) {
      const loadImpacts = async () => {
        try {
          const response = await axios.get<MonsterImpactsResponse>(
            `https://functions.yandexcloud.net/d4en3p6tiu5kcoe261mj?monsterId=${selectedMonsterId}`
          );
          setImpacts(response.data.monsterimpacts);
        } catch (err) {
          setError("Ошибка при загрузке взаимодействий");
        }
      };
      loadImpacts();
    }
  }, [selectedMonsterId]);

  // Format timer to "X часов Y минут Z секунд"
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

  if (error) {
    return <div className="text-red-500 text-center mt-4">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-200 to-orange-200">
      {/* App Title */}
      <div className="bg-gradient-to-r from-purple-500 to-orange-500 text-white text-4xl font-handwritten text-center py-4">
        СИМУЛЯТОР ВОСПИТАНИЯ МОНСТРОВ
      </div>

      {/* Main Menu */}
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
        {/* Notification Frame */}
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

      {/* Notifications Block */}
      {showNotifications && (
        <div className="bg-orange-100 p-4 shadow-md">Оповещения</div>
      )}

      {/* Raising Block */}
      {selectedMenuItem && (
        <div className="p-4">
          <div className="flex justify-between">
            {/* Monster Switcher Frame */}
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
            {/* Teach Energy Frame */}
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
          <div className="flex mt-4 space-x-1">
            {/* Monster and Room Image Frame */}
            <div className="w-1/2 border border-gray-300 bg-orange-100">
              {roomImage && monsterImage && (
                <div className="relative">
                  <img src={roomImage} alt="Room" className="w-full" />
                  <img
                    src={monsterImage}
                    alt="Monster"
                    className="absolute bottom-[10%] left-1/2 w-1/2 transform -translate-x-1/2"
                  />
                </div>
              )}
              {/* Monster Characteristics Frame */}
              <div className="mt-4 space-y-2 p-2">
                {characteristics.map((char) => (
                  <div
                    key={char.id}
                    className="flex items-center space-x-2 bg-purple-100 p-2 shadow border border-gray-300"
                  >
                    <img src={char.icon} alt={char.name} className="w-8 h-8" />
                    <span className="text-purple-700 font-semibold">
                      {char.name}: {char.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {/* Monster Impacts Frame */}
            <div className="w-1/2 grid grid-cols-4 gap-1 bg-purple-200">
              {impacts.map((impact) => (
                <div
                  key={impact.name}
                  className={`relative bg-purple-50 p-0.5 shadow border border-gray-300 flex flex-col items-center justify-start ${
                    impact.available
                      ? "cursor-pointer hover:bg-purple-100 hover:shadow-md"
                      : "opacity-50 hover:opacity-70 hover:shadow-gray-400"
                  }`}
                  title={impact.comment}
                >
                  <img
                    src={impact.image}
                    alt={impact.name}
                    className="w-full h-auto object-contain"
                  />
                  <div className="text-center text-purple-800 my-0">
                    {impact.name}
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

const root = createRoot(document.getElementById("root")!); // ! для TypeScript, чтобы указать, что элемент не null
root.render(<App />);
