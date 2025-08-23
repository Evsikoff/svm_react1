import React from "react";
import CompetitionEnergy from "./components/CompetitionEnergy";

interface ArenaProps {
  userId: number | null;
}

const Arena: React.FC<ArenaProps> = ({ userId }) => {
  return (
    <div className="p-8 min-h-[50vh] flex flex-col items-center">
      {userId && <CompetitionEnergy userId={userId} />}
      <div className="flex-grow flex items-center justify-center w-full">
        <div className="rounded-2xl shadow-xl border border-yellow-300 bg-yellow-100 px-8 py-10 text-center">
          <div className="text-3xl font-bold text-yellow-800 mb-2">⚠️</div>
          <div className="text-2xl font-semibold text-yellow-800">
            Раздел на ремонте
          </div>
        </div>
      </div>
    </div>
  );
};

export default Arena;
