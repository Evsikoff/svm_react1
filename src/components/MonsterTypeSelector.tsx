import React from "react";
import { MonsterTypeInfo } from "../types";

type MonsterTypeSelectorProps = {
  types: MonsterTypeInfo[];
  loading: boolean;
  error: string;
  onClose: () => void;
  onRetry: () => void;
};

const MonsterTypeSelector: React.FC<MonsterTypeSelectorProps> = ({
  types,
  loading,
  error,
  onClose,
  onRetry,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl bg-gradient-to-br from-white via-purple-50 to-orange-50 shadow-[0_25px_70px_-35px_rgba(109,40,217,0.7)]"
        id="monster-type-selector"
        role="dialog"
        aria-modal="true"
        aria-labelledby="monster-type-selector-title"
        aria-describedby="monster-type-selector-description"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-purple-500 shadow transition hover:scale-105 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
          aria-label="Закрыть окно выбора монстра"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="px-6 pt-6 pb-3 sm:px-10 sm:pt-10">
          <h2
            id="monster-type-selector-title"
            className="text-2xl font-semibold text-purple-900 sm:text-3xl"
          >
            Выбор монстра для покупки
          </h2>
          <p
            id="monster-type-selector-description"
            className="mt-2 text-sm text-purple-700/80 sm:text-base"
          >
            Выберите понравившийся тип монстра. Недоступные варианты помечены как в разработке.
          </p>
        </div>

        <div className="max-h-[65vh] overflow-y-auto px-6 pb-8 sm:px-10">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
            </div>
          )}

          {!loading && error && (
            <div className="space-y-4 rounded-2xl border border-red-200 bg-red-50/90 p-6 text-center text-red-700 shadow-inner">
              <div className="text-base font-semibold sm:text-lg">
                {error}
              </div>
              <button
                type="button"
                onClick={onRetry}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-orange-400 px-6 py-2 text-sm font-semibold text-white shadow transition hover:from-purple-600 hover:to-orange-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Повторить попытку
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              {types.length === 0 ? (
                <div className="rounded-2xl border border-purple-100 bg-white/80 p-8 text-center text-purple-800 shadow-inner">
                  Типы монстров временно недоступны.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
                  {types.map((type) => {
                    const formattedPrice = new Intl.NumberFormat("ru-RU").format(
                      type.price
                    );

                    return (
                      <div
                        key={type.number ?? type.name}
                        className="group"
                        title={
                          type.activity
                            ? undefined
                            : "Тип монстра пока в разработке"
                        }
                      >
                        <button
                          type="button"
                          className={`relative flex h-full w-full flex-col gap-3 rounded-2xl border border-purple-200/70 bg-white/80 p-4 text-left shadow-lg transition duration-200 ease-out ${
                            type.activity
                              ? "hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2"
                              : "cursor-not-allowed opacity-60 grayscale"
                          }`}
                          disabled={!type.activity}
                        >
                          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-100/70 via-white to-orange-100/70">
                            <img
                              src={type.image}
                              alt={type.name}
                              className="h-40 w-full object-contain transition duration-300 group-hover:scale-105"
                              loading="lazy"
                            />
                            {!type.activity && (
                              <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-center text-sm font-semibold text-purple-700">
                                Тип монстра пока в разработке
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-start justify-between gap-3">
                              <span className="text-lg font-semibold text-purple-900">
                                {type.name}
                              </span>
                              <span className="inline-flex items-baseline gap-1 rounded-full bg-gradient-to-r from-orange-400/10 to-purple-500/10 px-3 py-1 text-sm font-bold text-orange-600">
                                {formattedPrice}
                                <span className="text-xs font-semibold text-purple-700">
                                  ₽
                                </span>
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-purple-500">
                              <span>
                                Тип №{type.number}
                              </span>
                              <span className="text-orange-500">
                                {type.activity ? "Готов к покупке" : "В разработке"}
                              </span>
                            </div>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonsterTypeSelector;
