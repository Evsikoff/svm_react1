import React from "react";
import CompetitionEnergy from "./components/CompetitionEnergy";

interface ArenaProps {
  userId: number | null;
}

const Arena: React.FC<ArenaProps> = ({ userId }) => {
  return (
    <div className="p-8 min-h-[50vh] flex flex-col items-center">
      {userId && <CompetitionEnergy userId={userId} />}
    </div>
  );
};

export default Arena;
