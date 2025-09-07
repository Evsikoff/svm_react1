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
import {
  withInfiniteRetryAndTimeout,
  invalidateImageCache,
  getFingerprint,
} from "../utils";

export class ApiService {
  private onError?: (error: string) => void;

  constructor(onError?: (error: string) => void) {
    this.onError = onError;
  }

  async init(): Promise<InitResponse> {
    return withInfiniteRetryAndTimeout(
      async () => {
        const fingerprint = getFingerprint();
        const response = await axios.post<InitResponse>(API_URLS.init, {
          fingerprint,
        });
        return response.data;
      },
      5000,
      "Ошибка при инициализации приложения",
      this.onError
    );
  }

  async getMainMenu(monstersId: number[]): Promise<MainMenuResponse> {
    return withInfiniteRetryAndTimeout(
      async () => {
        const response = await axios.post<MainMenuResponse>(API_URLS.mainmenu, {
          monstersId,
        });
        return response.data;
      },
      5000,
      "Ошибка при загрузке главного меню",
      this.onError
    );
  }

  async getNotifications(userId: number): Promise<NotificationResponse> {
    return withInfiniteRetryAndTimeout(
      async () => {
        const response = await axios.get<NotificationResponse>(
          `${API_URLS.notifications}?userId=${userId}`
        );
        return response.data;
      },
      5000,
      "Ошибка при загрузке уведомлений",
      this.onError
    );
  }

  async getMonsters(monstersId: number[]): Promise<MonstersResponse> {
    return withInfiniteRetryAndTimeout(
      async () => {
        const response = await axios.post<MonstersResponse>(API_URLS.monsters, {
          monstersId,
        });
        return response.data;
      },
      5000,
      "Ошибка при загрузке монстров",
      this.onError
    );
  }

  async getTeachEnergy(userId: number): Promise<TeachEnergyResponse> {
    return withInfiniteRetryAndTimeout(
      async () => {
        const response = await axios.post<TeachEnergyResponse>(
          API_URLS.teachenergy,
          {
            userId,
          }
        );
        return response.data;
      },
      5000,
      "Ошибка при загрузке энергии",
      this.onError
    );
  }

  async getCharacteristics(
    monsterId: number
  ): Promise<MonsterCharacteristicsResponse> {
    return withInfiniteRetryAndTimeout(
      async () => {
        const response = await axios.post<MonsterCharacteristicsResponse>(
          API_URLS.characteristics,
          { monsterId }
        );
        return response.data;
      },
      5000,
      "Ошибка при загрузке характеристик монстра",
      this.onError
    );
  }

  async getMonsterRoom(monsterId: number): Promise<MonsterRoomResponse> {
    return withInfiniteRetryAndTimeout(
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
          roomitems: (data.roomitems || []).map((item) => ({
            ...item,
            spriteUrl: invalidateImageCache(item.spriteUrl),
          })),
        };
      },
      5000,
      "Ошибка при загрузке изображений монстра и комнаты",
      this.onError
    );
  }

  async getImpacts(monsterId: number): Promise<MonsterImpactsResponse> {
    return withInfiniteRetryAndTimeout(
      async () => {
        const response = await axios.post<MonsterImpactsResponse>(
          API_URLS.impacts,
          {
            monsterId,
          }
        );
        return response.data;
      },
      5000,
      "Ошибка при загрузке взаимодействий",
      this.onError
    );
  }

  async applyImpact(
    monsterId: number,
    impactId: number
  ): Promise<ImpactResponse> {
    return withInfiniteRetryAndTimeout(
      async () => {
        const response = await axios.post<ImpactResponse>(API_URLS.impact, {
          monsterId,
          impactId,
        });
        return response.data;
      },
      5000,
      "Ошибка при выполнении взаимодействия",
      this.onError
    );
  }
}
