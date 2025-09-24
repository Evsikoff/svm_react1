// Обновленный API сервис в src/services/api.ts

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

const STATIC_MAIN_MENU_RESPONSE: MainMenuResponse = {
  menuitems: [
    {
      name: "Воспитание",
      iconURL: "https://storage.yandexcloud.net/svm/img/upbringing.png",
      sequence: 1,
      index: true,
    },
    {
      name: "Арена",
      iconURL: "https://storage.yandexcloud.net/svm/img/arena.png",
      sequence: 2,
      index: false,
    },
    {
      name: "Магазин",
      iconURL: "https://storage.yandexcloud.net/svm/img/shop.png",
      sequence: 3,
      index: false,
    },
    {
      name: "Инвентарь",
      iconURL: "https://storage.yandexcloud.net/svm/img/invent2.png",
      sequence: 4,
      index: false,
    },
    {
      name: "Аккаунт",
      iconURL: "https://storage.yandexcloud.net/svm/img/profile.png",
      sequence: 5,
      index: false,
    },
  ],
};

export class ApiService {
  private onError?: (error: string) => void;
  private lastEnergyRequest: number = 0;

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
      this.onError,
      false // Отключаем кеширование для init
    );
  }

  async getMainMenu(_monstersId: number[]): Promise<MainMenuResponse> {
    return {
      menuitems: STATIC_MAIN_MENU_RESPONSE.menuitems.map((item) => ({
        ...item,
      })),
    };
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

  async getTeachEnergy(
    userId: number,
    forceRefresh: boolean = false
  ): Promise<TeachEnergyResponse> {
    // Предотвращаем частые запросы энергии
    const now = Date.now();
    if (!forceRefresh && now - this.lastEnergyRequest < 15000) {
      console.log("Пропускаем запрос энергии - слишком рано");
      // Возвращаем Promise, который никогда не разрешится, чтобы не нарушить цепочку
      return new Promise(() => {});
    }

    this.lastEnergyRequest = now;

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
      this.onError,
      false // Отключаем кеширование для энергии
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
      this.onError,
      false // Отключаем кеширование для характеристик
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
      this.onError,
      false // Отключаем кеширование для комнаты
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
      this.onError,
      false // Отключаем кеширование для воздействий
    );
  }

  async applyImpact(
    monsterId: number,
    impactId: number,
    // Идентификатор пользователя обязателен для корректного вызова
    userId: number
  ): Promise<ImpactResponse> {
    // Сбрасываем время последнего запроса энергии при применении воздействия
    this.lastEnergyRequest = 0;

    return withInfiniteRetryAndTimeout(
      async () => {
        const response = await axios.post<ImpactResponse>(API_URLS.impact, {
          monsterId,
          impactId,
          userId,
        });
        return response.data;
      },
      5000,
      "Ошибка при выполнении взаимодействия",
      this.onError,
      false // Отключаем кеширование для воздействий
    );
  }
}
