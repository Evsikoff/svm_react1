import axios from "axios";
import {
  InitResponse,
  MainMenuResponse,
  NotificationResponse,
  MonstersResponse,
  TeachEnergyResponse,
  MonsterCharacteristicsResponse,
  MonsterRoomResponse,
  MonsterImpactsResponse,
  ImpactResponse,
} from "../types";
import { API_URLS } from "../constants";
import { withRetry, invalidateImageCache } from "../utils";

export class ApiService {
  private onError?: (error: string) => void;

  constructor(onError?: (error: string) => void) {
    this.onError = onError;
  }

  async init(): Promise<InitResponse> {
    return withRetry(
      async () => {
        const response = await axios.post<InitResponse>(API_URLS.init, {
          yandexUserId: "ajeksdnx-somerandomid-29112024",
          yandexUserName: "Иван Петров",
          yandexUserPhotoURL:
            "https://avatars.yandex.net/get-yapic/12345/some-image-id/islands-200",
        });
        return response.data;
      },
      (d) => !!d && typeof d.userId === "number" && Array.isArray(d.monstersId),
      "Ошибка при инициализации приложения",
      this.onError
    );
  }

  async getMainMenu(monstersId: number[]): Promise<MainMenuResponse> {
    return withRetry(
      async () => {
        const response = await axios.post<MainMenuResponse>(API_URLS.mainmenu, {
          monstersId,
        });
        return response.data;
      },
      (d) => !!d && Array.isArray(d.menuitems),
      "Ошибка при загрузке главного меню",
      this.onError
    );
  }

  async getNotifications(userId: number): Promise<NotificationResponse> {
    return withRetry(
      async () => {
        const response = await axios.get<NotificationResponse>(
          `${API_URLS.notifications}?userId=${userId}`
        );
        return response.data;
      },
      (d) => d != null && typeof d.notificationquantity === "number",
      "Ошибка при загрузке уведомлений",
      this.onError
    );
  }

  async getMonsters(monstersId: number[]): Promise<MonstersResponse> {
    return withRetry(
      async () => {
        const response = await axios.post<MonstersResponse>(API_URLS.monsters, {
          monstersId,
        });
        return response.data;
      },
      (d) => !!d && Array.isArray(d.monsters),
      "Ошибка при загрузке монстров",
      this.onError
    );
  }

  async getTeachEnergy(userId: number): Promise<TeachEnergyResponse> {
    return withRetry(
      async () => {
        const response = await axios.post<TeachEnergyResponse>(
          API_URLS.teachenergy,
          {
            userId,
          }
        );
        return response.data;
      },
      (d) => d != null && typeof d.teachenergy === "number",
      "Ошибка при загрузке энергии",
      this.onError
    );
  }

  async getCharacteristics(
    monsterId: number
  ): Promise<MonsterCharacteristicsResponse> {
    return withRetry(
      async () => {
        const response = await axios.post<MonsterCharacteristicsResponse>(
          API_URLS.characteristics,
          { monsterId }
        );
        return response.data;
      },
      (d) => !!d && Array.isArray(d.monstercharacteristics),
      "Ошибка при загрузке характеристик монстра",
      this.onError
    );
  }

  async getMonsterRoom(monsterId: number): Promise<MonsterRoomResponse> {
    return withRetry(
      async () => {
        const response = await axios.post<MonsterRoomResponse>(
          API_URLS.monsterroom,
          {
            monsterId,
          }
        );

        // Применяем invalidateImageCache для всех изображений
        const data = response.data;
        return {
          ...data,
          monsterimage: invalidateImageCache(data.monsterimage),
          roomimage: invalidateImageCache(data.roomimage),
          roomitems: (data.roomitems || []).map((item: any) => {
            const rawSprite = item.spriteUrl || item.spriteurl || "";
            return {
              ...item,
              // backend may provide either `spriteUrl` or `spriteurl`
              spriteUrl: rawSprite ? invalidateImageCache(rawSprite) : "",
            };
          }),
        };
      },
      (d) => !!d && !!d.monsterimage && !!d.roomimage,
      "Ошибка при загрузке изображений монстра и комнаты",
      this.onError
    );
  }

  async getImpacts(monsterId: number): Promise<MonsterImpactsResponse> {
    return withRetry(
      async () => {
        const response = await axios.post<MonsterImpactsResponse>(
          API_URLS.impacts,
          {
            monsterId,
          }
        );
        return response.data;
      },
      (d) => !!d && Array.isArray(d.monsterimpacts),
      "Ошибка при загрузке взаимодействий",
      this.onError
    );
  }

  async executeImpact(
    monsterId: number,
    impactId: number,
    userId: number
  ): Promise<ImpactResponse> {
    return withRetry(
      async () => {
        const response = await axios.post<ImpactResponse>(API_URLS.impact, {
          monsterId,
          impactId,
          userId,
        });
        return response.data;
      },
      () => true,
      "Ошибка при выполнении взаимодействия",
      this.onError
    );
  }
}
