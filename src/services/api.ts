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
  getVKParams,
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

const BAD_REQUEST_STATUS = 400;
const BAD_REQUEST_RETRY_DELAY = 300;

export class ApiService {
  private onError?: (error: string) => void;
  private lastEnergyRequest: number = 0;

  constructor(onError?: (error: string) => void) {
    this.onError = onError;
  }

  private normalizeMonstersId(
    monstersId: Array<number | string | null | undefined>
  ): number[] {
    if (!Array.isArray(monstersId)) {
      return [];
    }

    return monstersId
      .map((id) => {
        if (typeof id === "number") {
          return Number.isFinite(id) ? id : null;
        }

        if (typeof id === "string" && id.trim() !== "") {
          const parsed = Number(id);
          return Number.isFinite(parsed) ? parsed : null;
        }

        return null;
      })
      .filter((id): id is number => id != null);
  }

  async init(): Promise<InitResponse> {
    const { VK, sign, vkUserId } = getVKParams();
    const payload: Record<string, string> = {};

    if (VK && sign && vkUserId) {
      payload.fingerprint = sign;
      payload.vkUserId = vkUserId;
    } else {
      payload.fingerprint = getFingerprint();
    }

    return withInfiniteRetryAndTimeout(
      async () => {
        const response = await axios.post<InitResponse>(API_URLS.init, payload);
        return response.data;
      },
      5000,
      "Ошибка при инициализации приложения",
      this.onError,
      false // Отключаем кеширование для init
    );
  }

  async getMainMenu(_monstersId: number[]): Promise<MainMenuResponse> {
    const { VK } = getVKParams();
    const filteredMenuItems = VK
      ? STATIC_MAIN_MENU_RESPONSE.menuitems.filter(
          (item) => item.name !== "Аккаунт"
        )
      : STATIC_MAIN_MENU_RESPONSE.menuitems;

    return {
      menuitems: filteredMenuItems.map((item) => ({
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

  async getMonsters(
    monstersId: Array<number | string | null | undefined>
  ): Promise<MonstersResponse> {
    const normalizedIds = this.normalizeMonstersId(monstersId);

    if (!normalizedIds.length) {
      console.warn(
        "Попытка вызвать getMonsters без валидных идентификаторов. Запрос пропущен."
      );
      return { monsters: [] };
    }

    return withInfiniteRetryAndTimeout(
      async () => {
        const maxAttempts = 2;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            const response = await axios.post<MonstersResponse>(
              API_URLS.monsters,
              {
                monstersId: normalizedIds,
              }
            );
            return response.data;
          } catch (error) {
            const axiosError = axios.isAxiosError(error) ? error : null;
            const isBadRequest =
              axiosError?.response?.status === BAD_REQUEST_STATUS;

            if (attempt < maxAttempts && isBadRequest) {
              console.warn(
                `Монстры вернули 400 (попытка ${attempt}/${maxAttempts}). Повтор запроса...`
              );
              await new Promise((resolve) =>
                setTimeout(resolve, BAD_REQUEST_RETRY_DELAY)
              );
              continue;
            }

            throw error;
          }
        }

        throw new Error("Не удалось загрузить монстров");
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
