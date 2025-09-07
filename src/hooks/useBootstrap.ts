import { useState, useEffect } from "react";
import { ApiService } from "../services/api";
import { BootTask, BootTaskKey } from "../types";
import { BOOT_TASKS_ORDER } from "../constants";
import { withInfiniteRetryAndTimeout } from "../utils";

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

        // Этап 1: Инициация
        const initRes = await withInfiniteRetryAndTimeout(
          () => apiService.init(),
          5000,
          "init",
          (error) => console.error(error)
        );
        if (cancelled) return;
        setUserId(initRes.userId);
        setMonstersId(initRes.monstersId);
        markTaskDone("init");

        // Этап 2: Параллельная загрузка
        const [mainMenuRes, notificationRes, monstersRes, energyRes] =
          await Promise.all([
            withInfiniteRetryAndTimeout(
              () => apiService.getMainMenu(initRes.monstersId),
              5000,
              "mainmenu",
              (error) => console.error(error)
            ).then((res) => {
              markTaskDone("mainmenu");
              return res;
            }),
            withInfiniteRetryAndTimeout(
              () => apiService.getNotifications(initRes.userId),
              5000,
              "notifications",
              (error) => console.error(error)
            ).then((res) => {
              markTaskDone("notifications");
              return res;
            }),
            withInfiniteRetryAndTimeout(
              () => apiService.getMonsters(initRes.monstersId),
              5000,
              "monsters",
              (error) => console.error(error)
            ).then((res) => {
              markTaskDone("monsters");
              return res;
            }),
            withInfiniteRetryAndTimeout(
              () => apiService.getTeachEnergy(initRes.userId),
              5000,
              "teachenergy",
              (error) => console.error(error)
            ).then((res) => {
              markTaskDone("teachenergy");
              return res;
            }),
          ]);
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

        setNotificationCount(notificationRes.notificationquantity);

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

        if (selectedMonsterLocal == null) {
          throw new Error("Не удалось определить выбранного монстра");
        }

        setTeachEnergy(energyRes.teachenergy);
        setNextReplenishment(energyRes.nextfreereplenishment);

        // Этап 3: Параллельная загрузка
        const [characteristicsRes, roomRes, impactsRes] = await Promise.all([
          withInfiniteRetryAndTimeout(
            () => apiService.getCharacteristics(selectedMonsterLocal),
            5000,
            "characteristics",
            (error) => console.error(error)
          ).then((res) => {
            markTaskDone("characteristics");
            return res;
          }),
          withInfiniteRetryAndTimeout(
            () => apiService.getMonsterRoom(selectedMonsterLocal),
            5000,
            "monsterroom",
            (error) => console.error(error)
          ).then((res) => {
            markTaskDone("monsterroom");
            return res;
          }),
          withInfiniteRetryAndTimeout(
            () => apiService.getImpacts(selectedMonsterLocal),
            5000,
            "impacts",
            (error) => console.error(error)
          ).then((res) => {
            markTaskDone("impacts");
            return res;
          }),
        ]);
        if (cancelled) return;

        setCharacteristics(characteristicsRes.monstercharacteristics || []);
        setMonsterImage(roomRes.monsterimage);
        setRoomImage(roomRes.roomimage);
        setRoomItems(roomRes.roomitems || []);
        setImpacts(impactsRes.monsterimpacts || []);

        setBooting(false);
      } catch (err) {
        console.error("Bootstrap error:", err);
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
