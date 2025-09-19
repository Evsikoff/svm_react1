import React from "react";

interface CompetitionEnergyReplenishmentProps {
  onClose: () => void;
}

const BADGES = [
  {
    id: "ten",
    label: "Десять единиц энергии",
    price: "270 ₽",
    icon: "https://storage.yandexcloud.net/svm/img/compenerjymid.png",
  },
  {
    id: "ninety",
    label: "Девяносто единиц энергии",
    price: "1980 ₽",
    icon: "https://storage.yandexcloud.net/svm/img/compenerjymany.png",
  },
];

const CompetitionEnergyReplenishment: React.FC<CompetitionEnergyReplenishmentProps> = ({
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 px-4 py-6">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-black p-6 text-white shadow-[0_25px_80px_rgba(0,0,0,0.55)]">
        <button
          type="button"
          aria-label="Закрыть окно пополнения энергии"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-900/70 text-slate-300 transition-colors hover:border-purple-500 hover:text-white"
        >
          ×
        </button>
        <div className="space-y-6 pt-4 md:pt-2">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold text-slate-100 md:text-3xl">
              Пополнение энергии для соревнований
            </h2>
            <p className="text-sm text-slate-400 md:text-base">
              Выберите подходящий пакет, чтобы вернуться в соревнования без паузы.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {BADGES.map((badge) => (
              <div
                key={badge.id}
                className="group flex h-full flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-900/80 p-5 text-left shadow-lg transition-all hover:border-purple-500/60 hover:bg-slate-900 hover:shadow-[0_0_35px_rgba(168,85,247,0.35)]"
              >
                <div className="flex flex-1 flex-col items-center gap-4 md:flex-row md:items-stretch md:gap-6">
                  <div className="flex w-full justify-center md:w-auto">
                    <img
                      src={badge.icon}
                      alt={badge.label}
                      className="w-28 max-w-[140px] rounded-xl bg-slate-950/60 p-2 shadow-inner"
                      style={{ aspectRatio: "2 / 3" }}
                    />
                  </div>
                  <div className="flex flex-1 flex-col items-center gap-3 text-center md:items-start md:text-left">
                    <span className="text-lg font-semibold text-slate-100 md:text-xl">
                      {badge.label}
                    </span>
                    <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                      Цена
                    </span>
                    <span className="text-2xl font-bold text-purple-300 md:text-3xl">
                      {badge.price}
                    </span>
                  </div>
                </div>
                <span className="mt-4 text-center text-xs text-slate-400 md:text-left">
                  Оптимальный выбор для восстановления энергии в нужный момент.
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={onClose}
              className="w-full max-w-xs rounded-full bg-purple-600 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white shadow-lg transition-colors hover:bg-purple-500"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompetitionEnergyReplenishment;
