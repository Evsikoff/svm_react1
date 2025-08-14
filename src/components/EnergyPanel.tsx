import React from "react";
import { EnergyProps } from "../types";

const EnergyPanel: React.FC<EnergyProps> = ({ current, max, regenHint }) => {
  const pct = Math.max(
    0,
    Math.min(100, Math.round((current / Math.max(1, max)) * 100))
  );

  return (
    <div className="w-full">
      {/* DESKTOP: узкая, вертикальная, компактная версия */}
      <div className="hidden md:block">
        <div className="mx-auto w-full max-w-[200px] rounded-xl border border-purple-200 bg-white/70 shadow-sm p-2">
          <div className="flex flex-col items-stretch gap-2">
            {/* Иконка и заголовок по центру */}
            <div className="flex items-center justify-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  aria-hidden="true"
                  fill="currentColor"
                >
                  <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"></path>
                </svg>
              </span>
              <span className="text-sm font-semibold text-gray-800">
                Энергия
              </span>
            </div>

            {/* Текущее значение */}
            <div className="text-center text-sm tabular-nums text-gray-900">
              {current} / {max}
            </div>

            {/* Узкий прогресс-бар */}
            <div
              className="h-2 w-full rounded-full bg-gray-200"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={max}
              aria-valuenow={current}
              aria-label="Энергия"
            >
              <div
                className="h-2 rounded-full bg-purple-500 transition-[width] duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* Подсказка (таймер) — мелко и нейтрально */}
            {regenHint && (
              <div className="text-center text-[11px] text-gray-500">
                {regenHint}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE: супер-компактная карточка */}
      <div className="md:hidden">
        <div className="mx-auto w-full rounded-lg border border-purple-200 bg-white p-2 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-purple-100">
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  aria-hidden="true"
                >
                  <path
                    d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"
                    fill="currentColor"
                  ></path>
                </svg>
              </span>
              <span className="text-xs font-medium text-gray-800">Энергия</span>
            </div>
            <span className="text-xs tabular-nums text-gray-900">
              {current}/{max}
            </span>
          </div>

          <div
            className="mt-2 h-1.5 w-full rounded-full bg-gray-200"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={max}
            aria-valuenow={current}
            aria-label="Энергия"
          >
            <div
              className="h-1.5 rounded-full bg-purple-500 transition-[width] duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>

          {regenHint && (
            <div className="mt-1 text-[10px] leading-4 text-gray-500">
              {regenHint}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnergyPanel;
