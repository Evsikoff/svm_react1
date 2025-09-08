import React from "react";

const CompetitionHistory: React.FC = () => {
  const handleClick = () => {
    // TODO: Здесь будет логика перехода на экран истории состязаний
    console.log("Переход на экран истории состязаний");
  };

  return (
    <div
      className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border-2 border-indigo-200 shadow-lg p-6 cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300 active:scale-[0.98]"
      onClick={handleClick}
    >
      <div className="flex items-center justify-center gap-4">
        <div className="text-indigo-400 text-4xl">📊</div>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-indigo-800 mb-1">
            История состязаний
          </h2>
          <p className="text-indigo-600 text-sm">
            Просмотреть результаты прошлых состязаний
          </p>
        </div>
        <div className="text-indigo-400 text-2xl ml-auto">→</div>
      </div>
    </div>
  );
};

export default CompetitionHistory;
