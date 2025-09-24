import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URLS, IMAGES } from "../constants";
import { formatTimer } from "../utils";
import { CompetitionEnergyResponse } from "../types";
import CompetitionEnergyReplenishment from "./CompetitionEnergyReplenishment";

interface Props {
  userId: number;
  isVK?: boolean;
}

const CompetitionEnergy: React.FC<Props> = ({ userId, isVK = false }) => {
  const [energy, setEnergy] = useState<number | null>(null);
  const [next, setNext] = useState<string>("");
  const [timer, setTimer] = useState<number>(0);
  const [showReplenishment, setShowReplenishment] = useState(false);

  const loadData = async () => {
    try {
      const res = await axios.post<CompetitionEnergyResponse>(
        API_URLS.competitionenergy,
        { userId }
      );
      const data = res.data;
      setEnergy(data.competitionenergy);
      setNext(data.nextfreereplenishment);
      const diff = Math.floor(
        (new Date(data.nextfreereplenishment).getTime() - Date.now()) / 1000
      );
      setTimer(diff);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  useEffect(() => {
    if (energy == null || energy >= 5) return;

    const tick = () => {
      const diff = Math.floor((new Date(next).getTime() - Date.now()) / 1000);
      if (diff <= 0) {
        loadData();
      } else {
        setTimer(diff);
      }
    };

    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [energy, next]);

  if (energy == null) return null;

  return (
    <>
      <div className="w-full flex justify-center mb-6 md:mb-0">
        <div className="flex flex-col items-center md:justify-between rounded-xl border-2 border-blue-300 bg-blue-50 shadow-md p-4 w-full md:w-auto md:h-[282px]">
          <div className="flex items-center gap-3">
            <img
              src={IMAGES.competitionEnergy}
              alt="Энергия на соревнования"
              className="w-9 h-10"
            />
            <span className="text-xl font-semibold text-blue-800">
              Энергия: {energy}
            </span>
          </div>
          {energy < 5 && (
            <span className="mt-2 text-sm text-blue-700">
              До бесплатного пополнения энергии {formatTimer(timer)}
            </span>
          )}
          <button
            type="button"
            onClick={() => setShowReplenishment(true)}
            className="mt-3 w-full rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
          >
            Пополнить энергию
          </button>
        </div>
      </div>
      {showReplenishment && (
        <CompetitionEnergyReplenishment
          onClose={() => setShowReplenishment(false)}
          userId={userId}
          isVK={isVK}
        />
      )}
    </>
  );
};

export default CompetitionEnergy;
