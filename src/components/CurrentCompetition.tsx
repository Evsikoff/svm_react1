import React from "react";

interface Props {
  competitionsInstanceId: number;
}

const CurrentCompetition: React.FC<Props> = ({ competitionsInstanceId }) => {
  return (
    <div className="p-8 text-center">
      <h2 className="text-2xl font-bold mb-4">Текущее состязание</h2>
      <p className="text-gray-700">
        Состязание #{competitionsInstanceId} в разработке
      </p>
    </div>
  );
};

export default CurrentCompetition;

