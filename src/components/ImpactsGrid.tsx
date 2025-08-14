import React from "react";

interface MonsterImpact {
  id: number;
  image: string;
  name: string;
  comment: string;
  available: boolean;
  energyprice: number;
  minendurance?: number;
}

interface ImpactsGridProps {
  impacts: MonsterImpact[];
  teachEnergy: number;
  enduranceIcon: string;
  onImpactClick: (impact: MonsterImpact) => void;
}

const ImpactsGrid: React.FC<ImpactsGridProps> = ({
  impacts,
  teachEnergy,
  enduranceIcon,
  onImpactClick,
}) => {
  return (
    <div className="w-full md:w-1/2 mt-4 md:mt-0 grid grid-cols-2 md:grid-cols-4 gap-1 bg-purple-200">
      {impacts.map((impact) => (
        <div
          key={impact.id}
          className={`relative bg-purple-50 p-0.5 shadow border border-gray-300 flex flex-col items-center justify-between ${
            impact.available && teachEnergy >= impact.energyprice
              ? "cursor-pointer hover:bg-purple-100 hover:shadow-md"
              : "opacity-50 hover:opacity-70 hover:shadow-gray-400"
          }`}
          title={impact.comment}
          onClick={() => onImpactClick(impact)}
        >
          <img
            src={impact.image}
            alt={impact.name}
            className="w-full h-auto object-contain"
          />

          <div className="text-purple-800 px-1 text-center text-sm">
            {impact.name}
          </div>

          <div className="flex items-center justify-center mb-1 space-x-2">
            {impact.minendurance !== undefined &&
              impact.minendurance !== null &&
              impact.minendurance !== 0 && (
                <div className="flex items-center">
                  <img
                    src={enduranceIcon}
                    alt="Min Endurance"
                    className="w-[15px] h-[22px]"
                  />
                  <span className="text-green-700 text-sm ml-1">
                    {impact.minendurance}
                  </span>
                </div>
              )}
            <div className="flex items-center">
              <img
                src="https://storage.yandexcloud.net/svm/img/userteachenergy.png"
                alt="Energy Price"
                className="w-[15px] h-[22px]"
              />
              <span className="text-yellow-500 text-sm ml-1">
                {impact.energyprice}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ImpactsGrid;
