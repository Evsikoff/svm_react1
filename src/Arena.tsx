import React from "react";
import CompetitionEnergy from "./components/CompetitionEnergy";
import ArenaMonsterSwitcher from "./components/ArenaMonsterSwitcher";

interface ArenaProps {
  userId: number | null;
}

const Arena: React.FC<ArenaProps> = ({ userId }) => {
  if (!userId) return null;

  return (
    <div className="p-8 min-h-[50vh] flex flex-col md:flex-row gap-4 md:items-start md:justify-center">
      <div className="flex-1">
        <CompetitionEnergy userId={userId} />
      </div>
      <div className="flex-1">
        <ArenaMonsterSwitcher userId={userId} />
      </div>
    </div>
  );
};

export default Arena;
