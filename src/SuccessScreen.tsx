import React, { useEffect, useMemo, useState } from "react";
import Spinner from "./components/Spinner";

interface InvoiceStatusResponse {
  stateid?: string | number | null;
  statetext?: string | null;
  [key: string]: unknown;
}

const STATUS_ENDPOINT =
  "https://invoicestateget-production.up.railway.app/invoice-status";

const SuccessScreen: React.FC = () => {
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const invIdParam = searchParams.get("InvId");
  const outSum = searchParams.get("OutSum");

  const [status, setStatus] = useState<InvoiceStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchStatus = async (invId: number) => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(STATUS_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ InvId: invId }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Ошибка запроса: ${response.status}`);
        }

        const data: InvoiceStatusResponse = await response.json();
        setStatus(data);
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }

        const message =
          err instanceof Error ? err.message : "Не удалось получить статус оплаты";
        setError(message);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    if (!invIdParam) {
      setError("Не удалось определить номер платежа");
      return;
    }

    const numericInvId = Number(invIdParam);

    if (!Number.isFinite(numericInvId)) {
      setError("Некорректный номер платежа");
      return;
    }

    fetchStatus(numericInvId);

    return () => {
      controller.abort();
    };
  }, [invIdParam]);

  const stateId =
    status?.stateid === null || status?.stateid === undefined
      ? ""
      : String(status.stateid).trim();

  const stateText = (status?.statetext ?? "").trim();

  const { textClassName, containerBorderClassName, showReload } = useMemo(() => {
    if (!stateId) {
      return {
        textClassName: "text-red-600",
        containerBorderClassName: "border-red-300",
        showReload: false,
      };
    }

    if (stateId === "1") {
      return {
        textClassName:
          "bg-gradient-to-r from-yellow-300 via-orange-400 to-pink-500 bg-clip-text text-transparent drop-shadow-md",
        containerBorderClassName: "border-yellow-300",
        showReload: true,
      };
    }

    if (stateId === "2") {
      return {
        textClassName: "text-green-600",
        containerBorderClassName: "border-green-300",
        showReload: false,
      };
    }

    return {
      textClassName: "text-purple-700",
      containerBorderClassName: "border-purple-200",
      showReload: false,
    };
  }, [stateId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-200 to-orange-200 flex items-center justify-center px-4 py-10">
      <div
        className={`w-full max-w-2xl bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border ${containerBorderClassName} p-8 space-y-8`}
      >
        <div className="space-y-3 text-center">
          <h1 className="text-3xl md:text-4xl font-handwritten text-purple-700">
            Успешная оплата
          </h1>
          <p className="text-sm md:text-base text-purple-900/70">
            Спасибо за оплату! Мы проверяем статус вашего платежа.
          </p>
        </div>

        {loading && <Spinner size="large" />}

        {!loading && error && (
          <div className="rounded-2xl bg-red-100 border border-red-200 px-6 py-4 text-center text-red-700 shadow-inner">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-purple-50 border border-purple-200 px-4 py-3 text-center text-purple-700 shadow">
                <div className="text-xs uppercase tracking-wider text-purple-500">
                  Номер платежа
                </div>
                <div className="text-lg font-semibold">{invIdParam}</div>
              </div>
              {outSum && (
                <div className="rounded-2xl bg-orange-50 border border-orange-200 px-4 py-3 text-center text-orange-700 shadow">
                  <div className="text-xs uppercase tracking-wider text-orange-500">
                    Сумма
                  </div>
                  <div className="text-lg font-semibold">{outSum} ₽</div>
                </div>
              )}
            </div>

            {stateText && (
              <div className="rounded-3xl bg-white/70 px-6 py-5 text-center shadow-lg border border-white/40">
                <div className={`text-2xl font-semibold ${textClassName}`}>{stateText}</div>
              </div>
            )}

            {showReload && (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mx-auto block rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 px-6 py-3 text-base font-semibold text-white shadow-lg transition-transform duration-200 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2"
              >
                Перезагрузить приложение
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuccessScreen;
