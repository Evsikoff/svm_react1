import React from "react";

const Arena: React.FC = () => {
  return (
    <div className="p-8 min-h-[50vh] flex items-center justify-center">
      <div className="rounded-2xl shadow-xl border border-yellow-300 bg-yellow-100 px-8 py-10 text-center">
        <div className="text-3xl font-bold text-yellow-800 mb-2">⚠️</div>
        <div className="text-2xl font-semibold text-yellow-800">
          Раздел на ремонте
        </div>
      </div>
    </div>
  );
};

export default Arena;
