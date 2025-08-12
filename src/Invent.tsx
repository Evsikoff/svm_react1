// Invent.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";

type Props = {
  userId: number | null; // из init
};

type WalletResponse = {
  money?: number;
  [k: string]: unknown;
};

const Invent: React.FC<Props> = ({ userId }) => {
  const [loading, setLoading] = useState(true);
  const [money, setMoney] = useState<number>(0);
  const [error, setError] = useState<string>("");

  // локальная обёртка с ретраями: 1 попытка + 3 повтора = 4
  async function withRetry<T>(
    fn: () => Promise<T>,
    isValid: (v: T) => boolean,
    label: string
  ): Promise<T> {
    let lastErr: any = null;
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        const res = await fn();
        if (!isValid(res)) throw new Error("Пустой или некорректный ответ");
        return res;
      } catch (e) {
        lastErr = e;
        if (attempt < 4) await new Promise((r) => setTimeout(r, 300));
      }
    }
    const text =
      typeof lastErr?.message === "string" ? `${label}: ${lastErr.message}` : label;
    setError(text);
    throw lastErr;
  }

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!userId) {
        setLoading(false);
        setError("userId отсутствует");
        return;
      }
      try {
        const resp = await withRetry(
          async () =>
            axios.post<WalletResponse>(
              "https://functions.yandexcloud.net/d4ej7dr2gb17q1gjhunk",
              { userId }
            ),
          (r) => r != null && typeof (r as any)?.data?.money === "number",
          "Ошибка при загрузке кошелька"
        );
        if (!cancelled) setMoney(resp.data.money!);
      } catch {
        // текст ошибки уже установлен
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <div className="p-6">
      {/* Спиннер на время загрузки блока — по ТЗ */}
      {loading && (
        <div className="w-full flex items-center justify-center py-16">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && (
        <div className="max-w-xl mx-auto">
          {error && (
            <div className="bg-red-100 text-red-600 border border-red-300 px-4 py-2 rounded mb-4">
              {error}
            </div>
          )}

          {/* Фрейм «Золотые монеты»: иконка из ТЗ + сумма + неактивная кнопка */}
          <div className="flex items-center gap-4 bg-yellow-50 border border-yellow-300 rounded-2xl p-4 shadow">
            <img
              src="https://storage.yandexcloud.net/svm/img/money.png"
              alt="Золотые монеты"
              className="w-16 h-16 object-contain"
            />
            <div className="flex-1">
              <div className="text-sm text-yellow-800/80">Золотые монеты</div>
              <div className="text-3xl font-extrabold text-yellow-800 leading-tight">
                {money}
              </div>
            </div>
            <button
              className="px-4 py-2 rounded bg-gray-300 text-gray-600 cursor-not-allowed"
              disabled
              title="Недоступно"
            >
              Пополнить
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invent;
