import React from "react";

interface EnergyReplenishmentProps {
  onClose: () => void;
}

const OPTIONS = [
  {
    label: "Одна единица энергии",
    price: "За просмотр рекламы",
    icon: "https://storage.yandexcloud.net/svm/img/oneteachenergy.png",
  },
  {
    label: "Десять единиц энергии",
    price: "135 ₽",
    icon: "https://storage.yandexcloud.net/svm/img/averagenumberteacherenergy.png",
  },
  {
    label: "Девяносто единиц энергии",
    price: "990 ₽",
    icon: "https://storage.yandexcloud.net/svm/img/largenumberteachenergy.png",
  },
];

const EnergyReplenishment: React.FC<EnergyReplenishmentProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[150] bg-black/60">
      <div className="bg-gradient-to-br from-purple-50 to-orange-50 rounded-2xl p-6 shadow-2xl w-full max-w-md space-y-6">
        <h2 className="text-2xl font-bold text-purple-700 text-center">
          Пополнение энергии
        </h2>
        <div className="space-y-4">
          {OPTIONS.map((opt) => (
            <div
              key={opt.label}
              className="flex items-center justify-between p-4 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 cursor-pointer transition-colors"
            >
              <div className="flex items-center space-x-4">
                <img src={opt.icon} alt={opt.label} className="h-[100px] w-auto" />
                <span className="text-purple-800 font-medium">{opt.label}</span>
              </div>
              <span className="text-purple-700">{opt.price}</span>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
};

export default EnergyReplenishment;

