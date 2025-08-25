import React, { useState } from "react";
import CompetitionEnergy from "./components/CompetitionEnergy";
import ArenaMonsterSwitcher from "./components/ArenaMonsterSwitcher";
import Competitions from "./components/Competitions";

interface ArenaProps {
  userId: number | null;
}

const Arena: React.FC<ArenaProps> = ({ userId }) => {
  const [selectedMonsterId, setSelectedMonsterId] = useState<number | null>(null);
  if (!userId) return null;

  return (
    <div className="p-8 min-h-[50vh] flex flex-col gap-4 md:items-start md:justify-center">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <CompetitionEnergy userId={userId} />
        </div>
        <div className="flex-1">
          <ArenaMonsterSwitcher userId={userId} onSelect={setSelectedMonsterId} />
        </div>
      </div>
      <div className="flex-1">
        <Competitions monsterId={selectedMonsterId} />
      </div>
    </div>
  );
};

export default Arena;
