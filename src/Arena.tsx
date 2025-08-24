import React from "react";
import CompetitionEnergy from "./components/CompetitionEnergy";
import ArenaMonsterSwitcher from "./components/ArenaMonsterSwitcher";

interface ArenaProps {
  userId: number | null;
}

const Arena: React.FC<ArenaProps> = ({ userId }) => {
  if (!userId) return null;

  return (
    <div className="p-8 min-h-[50vh] flex flex-col md:flex-row items-center md:items-start md:space-x-4 md:justify-center">
      <div className="w-full md:w-auto">
        <CompetitionEnergy userId={userId} />
      </div>
      <div className="w-full md:w-auto mt-4 md:mt-0">
        <ArenaMonsterSwitcher userId={userId} />
      </div>
    </div>
  );
};

export default Arena;
