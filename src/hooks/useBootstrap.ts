import { useState, useEffect } from "react";
import { ApiService } from "../services/api";
import { BootTask, BootTaskKey } from "../types";
import { BOOT_TASKS_ORDER } from "../constants";

interface UseBootstrapResult {
  booting: boolean;
  bootTasks: BootTask[];
  userId: number | null;
  monstersId: number[];
  menuItems: any[];
  selectedMenuItem: string | null;
  selectedMenuSequence: number | null;
  notificationCount: number;
  monsters: any[];
  selectedMonsterId: number | null;
  teachEnergy: number;
  nextReplenishment: string;
  characteristics: any[];
  impacts: any[];
  monsterImage: string;
  roomImage: string;
  roomItems: any[];
}

export const useBootstrap = (apiService: ApiService): UseBootstrapResult => {
  const [booting, setBooting] = useState<boolean>(true);
  const [bootTasks, setBootTasks] = useState<BootTask[]>(
    BOOT_TASKS_ORDER.map((t) => ({ ...t }))
  );

  // Все остальные состояния
  const [userId, setUserId] = useState<number | null>(null);
  const [monstersId, setMonstersId] = useState<number[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState<string | null>(null);
  const [selectedMenuSequence, setSelectedMenuSequence] = useState<
    number | null
  >(null);
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const [monsters, setMonsters] = useState<any[]>([]);
  const [selectedMonsterId, setSelectedMonsterId] = useState<number | null>(
    null
  );
  const [teachEnergy, setTeachEnergy] = useState<number>(0);
  const [nextReplenishment, setNextReplenishment] = useState<string>("");
  const [characteristics, setCharacteristics] = useState<any[]>([]);
  const [impacts, setImpacts] = useState<any[]>([]);
  const [monsterImage, setMonsterImage] = useState<string>("");
  const [roomImage, setRoomImage] = useState<string>("");
  const [roomItems, setRoomItems] = useState<any[]>([]);

  const markTaskDone = (key: BootTaskKey) => {
    setBootTasks((prev) =>
      prev.map((t) => (t.key === key ? { ...t, done: true } : t))
    );
  };

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        setBooting(true);

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
        const sortedItems = items.sort(
          (a: any, b: any) => a.sequence - b.sequence
        );
        setMenuItems(sortedItems);
        const def = sortedItems.find((it: any) => it.index);
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
          (a: any, b: any) => a.sequence - b.sequence
        );
        setMonsters(sorted);
        const def2 = sorted.findIndex((m: any) => m.index);
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
  }, [apiService]);

  return {
    booting,
    bootTasks,
    userId,
    monstersId,
    menuItems,
    selectedMenuItem,
    selectedMenuSequence,
    notificationCount,
    monsters,
    selectedMonsterId,
    teachEnergy,
    nextReplenishment,
    characteristics,
    impacts,
    monsterImage,
    roomImage,
    roomItems,
  };
};
