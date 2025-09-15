import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Spinner from "./Spinner";
import { API_URLS } from "../constants";

interface EnergyReplenishmentProps {
  onClose: () => void;
  userId: number | null;
}

interface TeachEnergyBarterEnableResponse {
  teachenergybarterenable: boolean | "true" | "false";
  teachenergybarterenabletime?: string;
}

const OPTIONS = [
  {
    id: "single",
    label: "Одна единица энергии",
    price: "За просмотр рекламы",
    icon: "https://storage.yandexcloud.net/svm/img/oneteachenergy.png",
  },
  {
    id: "ten",
    label: "Десять единиц энергии",
    price: "135 ₽",
    icon: "https://storage.yandexcloud.net/svm/img/averagenumberteacherenergy.png",
  },
  {
    id: "ninety",
    label: "Девяносто единиц энергии",
    price: "990 ₽",
    icon: "https://storage.yandexcloud.net/svm/img/largenumberteachenergy.png",
  },
];

const EnergyReplenishment: React.FC<EnergyReplenishmentProps> = ({
  onClose,
  userId,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOneUnitEnabled, setIsOneUnitEnabled] = useState<boolean>(false);
  const [availabilityTime, setAvailabilityTime] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<string>("");

  const fetchAvailability = useCallback(async () => {
    if (userId === null || userId === undefined) {
      setError("Не удалось определить пользователя.");
      setIsOneUnitEnabled(false);
      setAvailabilityTime(null);
      setCountdown("");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.post<TeachEnergyBarterEnableResponse>(
        API_URLS.teachenergybarterenable,
        { userId }
      );

      const rawValue = data.teachenergybarterenable;
      const enabled =
        typeof rawValue === "string"
          ? rawValue.toLowerCase() === "true"
          : Boolean(rawValue);

      setIsOneUnitEnabled(enabled);

      if (!enabled && data.teachenergybarterenabletime) {
        const parsed = new Date(data.teachenergybarterenabletime);
        if (!Number.isNaN(parsed.getTime())) {
          if (parsed.getTime() <= Date.now()) {
            setIsOneUnitEnabled(true);
            setAvailabilityTime(null);
            setCountdown("");
          } else {
            setAvailabilityTime(parsed);
          }
        } else {
          setAvailabilityTime(null);
          setCountdown("");
        }
      } else {
        setAvailabilityTime(null);
        setCountdown("");
      }
    } catch (err) {
      console.error(
        "Ошибка при загрузке статуса пополнения энергии",
        err
      );
      setError("Не удалось загрузить информацию о пополнении энергии.");
      setIsOneUnitEnabled(false);
      setAvailabilityTime(null);
      setCountdown("");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  useEffect(() => {
    if (!availabilityTime) {
      setCountdown("");
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const diff = availabilityTime.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdown("0 часов 00 минут");
        return;
      }
      const totalMinutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      setCountdown(
        `${hours} часов ${minutes.toString().padStart(2, "0")} минут`
      );
    };

    updateCountdown();

    const intervalId = window.setInterval(updateCountdown, 60000);

    return () => window.clearInterval(intervalId);
  }, [availabilityTime]);

  useEffect(() => {
    if (!availabilityTime || userId === null || userId === undefined) {
      return;
    }

    const timeoutDelay = availabilityTime.getTime() - Date.now();
    if (timeoutDelay <= 0) {
      fetchAvailability();
      return;
    }

    const safeDelay = Math.min(timeoutDelay, 2147483647);
    const timeoutId = window.setTimeout(() => {
      fetchAvailability();
    }, safeDelay);

    return () => window.clearTimeout(timeoutId);
  }, [availabilityTime, fetchAvailability, userId]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[150] bg-black/60">
      <div className="bg-gradient-to-br from-purple-50 to-orange-50 rounded-2xl p-6 shadow-2xl w-full max-w-md space-y-6">
        <h2 className="text-2xl font-bold text-purple-700 text-center">
          Пополнение энергии
        </h2>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="relative">
          <div
            className={`space-y-4 ${
              loading ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {OPTIONS.map((opt) => {
              const isOneUnitOption = opt.id === "single";
              const isDisabled =
                isOneUnitOption && (loading || !isOneUnitEnabled);

              return (
                <div key={opt.id} className="relative">
                  <button
                    type="button"
                    disabled={isOneUnitOption ? isDisabled : false}
                    className={`flex w-full items-center justify-between rounded-xl border border-purple-200 bg-purple-50 p-4 transition-colors ${
                      isDisabled
                        ? "cursor-not-allowed opacity-70"
                        : "cursor-pointer hover:bg-purple-100"
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <img
                        src={opt.icon}
                        alt={opt.label}
                        className="h-[100px] w-auto"
                      />
                      <span className="text-purple-800 font-medium">
                        {opt.label}
                      </span>
                    </div>
                    <span className="text-purple-700">{opt.price}</span>
                  </button>

                  {isOneUnitOption && !loading && !error && !isOneUnitEnabled && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-black/60 px-4 py-3 text-center text-sm font-medium text-white">
                      Будет доступно через {countdown || "-- часов -- минут"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/70">
              <Spinner size="small" />
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
};

export default EnergyReplenishment;

