import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URLS, IMAGES } from "../constants";
import {
  MonsterCompetition,
  MonsterCompetitionsResponse,
} from "../types";

interface Props {
  monsterId: number | null;
}

const Competitions: React.FC<Props> = ({ monsterId }) => {
  const [competitions, setCompetitions] = useState<MonsterCompetition[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.post<MonsterCompetitionsResponse>(
          API_URLS.monstercompetitions,
          { monsterId }
        );
        setCompetitions(res.data.monstercompetitions || []);
      } catch (e) {
        console.error(e);
      }
    };
    if (monsterId) {
      load();
    }
  }, [monsterId]);

  if (!monsterId) return null;

  return (
    <div className="flex flex-col gap-4">
      {competitions.map((comp) => {
        const isActive = comp.activity;
        return (
          <div
            key={comp.monstercompetitionid}
            title={isActive ? undefined : comp.inactivity}
            className={`rounded-xl border-2 border-green-300 bg-green-50 shadow-md overflow-hidden ${
              isActive ? "cursor-pointer" : "cursor-not-allowed opacity-50"
            }`}
          >
            <img
              src={comp.monstercompetitionimage}
              alt={comp.monstercompetitionname}
              width={1000}
              height={500}
              className="w-full h-auto"
            />
            <div className="p-4 flex flex-col gap-2">
              <div className="flex justify-between">
                <div className="flex items-center gap-1">
                  <img
                    src={IMAGES.competitionEnergy}
                    alt="energy"
                    className="h-5 w-auto"
                  />
                  <span>{comp.monstercompetitionenergyprice}</span>
                </div>
                <div className="flex items-center gap-1">
                  <img
                    src={IMAGES.participants}
                    alt="participants"
                    className="h-5 w-auto"
                  />
                  <span>{comp.monstercompetitionparticipantsnumber}</span>
                </div>
              </div>
              <div className="text-center text-xl font-bold font-handwritten">
                {comp.monstercompetitionname}
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {comp.monstercompetitioncharacteristics.map((c) => (
                  <div
                    key={c.monstercompetitioncharacteristicid}
                    className="flex flex-col items-center"
                  >
                    <img
                      src={c.monstercompetitioncharacteristicimage}
                      alt={c.monstercompetitioncharacteristicname}
                      title={c.monstercompetitioncharacteristicname}
                      className="h-6 w-6"
                    />
                    <span className="text-sm">
                      {c.monstercompetitioncharacteristicamount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Competitions;
