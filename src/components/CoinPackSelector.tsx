import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import bridge from "@vkontakte/vk-bridge";

interface CoinPack {
  id: number;
  name: string;
  amount: number;
  price: number;
  vkvoice: number;
  image: string;
  activity?: boolean;
}

interface CoinPackResponse {
  coinpacks?: CoinPack[];
}

interface CreatePaymentLinkResponse {
  paymentlink?: string | null;
  errortext?: string | null;
  item?: string | null;
}

interface CoinPackSelectorProps {
  onClose: () => void;
  userId: number | null;
  isVK?: boolean;
}

const VK_ICON_URL =
  "https://storage.yandexcloud.net/svm/img/service_icons/vk.png";

const CoinPackSelector: React.FC<CoinPackSelectorProps> = ({
  onClose,
  userId,
  isVK = false,
}) => {
  const [coinPacks, setCoinPacks] = useState<CoinPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [activePackId, setActivePackId] = useState<number | null>(null);
  const [dialogConfig, setDialogConfig] = useState<
    | {
        message: string;
        variant: "info" | "success";
      }
    | null
  >(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const restartTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    return () => {
      if (restartTimeoutRef.current !== null) {
        window.clearTimeout(restartTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadCoinPacks = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          "https://coinpacksget-production.up.railway.app/coinpacks",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Не удалось загрузить пакеты монет. Попробуйте позже.");
        }

        const data = (await response.json()) as CoinPackResponse;
        const packs = Array.isArray(data?.coinpacks) ? data.coinpacks : [];

        if (!cancelled) {
          setCoinPacks(packs);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : "Произошла ошибка при загрузке пакетов монет.";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadCoinPacks();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleRestart = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    restartTimeoutRef.current = window.setTimeout(() => {
      window.location.reload();
    }, 300);
  }, []);

  const handleBadgeClick = useCallback(
    async (pack: CoinPack) => {
      if (pack.activity === false) {
        return;
      }

      if (!userId) {
        setDialogConfig({
          message: "Не удалось определить пользователя. Повторите позже.",
          variant: "info",
        });
        return;
      }

      if (activePackId !== null) {
        return;
      }

      setActivePackId(pack.id);

      try {
        const body = isVK
          ? {
              userId,
              invoicetypeId: pack.id,
              vk: true,
            }
          : {
              userId,
              invoicetypeId: pack.id,
            };

        const response = await fetch(
          "https://paymentlinkget-production.up.railway.app/create-payment-link",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          }
        );

        let data: CreatePaymentLinkResponse | null = null;

        try {
          data = (await response.json()) as CreatePaymentLinkResponse;
        } catch (jsonError) {
          data = null;
        }

        const trimmedError = data?.errortext?.trim();

        if (!response.ok) {
          setDialogConfig({
            message: trimmedError || "Не удалось создать ссылку на оплату.",
            variant: "info",
          });
          return;
        }

        if (trimmedError) {
          setDialogConfig({
            message: trimmedError,
            variant: "info",
          });
          return;
        }

        if (isVK) {
          const rawItem = data?.item;
          const itemId =
            typeof rawItem === "string"
              ? rawItem.trim()
              : rawItem != null
              ? String(rawItem).trim()
              : "";

          if (!itemId) {
            setDialogConfig({
              message:
                "Не удалось получить идентификатор товара для оплаты. Попробуйте позднее.",
              variant: "info",
            });
            return;
          }

          const vkBridgeInstance =
            (window as Window & { vkBridge?: typeof bridge }).vkBridge ?? bridge;

          if (!vkBridgeInstance || typeof vkBridgeInstance.send !== "function") {
            setDialogConfig({
              message:
                "Оплата через VK недоступна в текущем окружении. Попробуйте позже.",
              variant: "info",
            });
            return;
          }

          try {
            await vkBridgeInstance.send("VKWebAppShowOrderBox", {
              type: "item",
              item: itemId,
            });

            setDialogConfig({
              message:
                "Оплата прошла успешно! Нажмите, чтобы перезапустить игру и применить изменения.",
              variant: "success",
            });
            return;
          } catch (vkError) {
            const fallbackMessage =
              vkError instanceof Error
                ? vkError.message
                : "Не удалось завершить оплату через VK.";

            setDialogConfig({
              message: fallbackMessage,
              variant: "info",
            });
            return;
          }
        }

        const paymentLink = data?.paymentlink?.trim();
        if (paymentLink) {
          window.location.href = paymentLink;
          return;
        }

        setDialogConfig({
          message: "Ответ сервера не содержит ссылки на оплату.",
          variant: "info",
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Произошла ошибка при создании ссылки на оплату. Попробуйте снова.";
        setDialogConfig({
          message,
          variant: "info",
        });
      } finally {
        setActivePackId(null);
      }
    },
    [activePackId, isVK, userId]
  );

  const renderPrice = useCallback(
    (pack: CoinPack) => {
      const useVkPrice = isVK === true;
      const rawValue = useVkPrice ? pack.vkvoice ?? pack.price : pack.price;
      const value = typeof rawValue === "number" ? rawValue : Number(rawValue) || 0;
      const formatted = new Intl.NumberFormat("ru-RU").format(value);

      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-sm font-semibold text-purple-700 shadow-sm">
          {formatted}
          {useVkPrice ? (
            <img src={VK_ICON_URL} alt="VK" className="h-4 w-4" />
          ) : (
            <span>₽</span>
          )}
        </span>
      );
    },
    [isVK]
  );

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="flex justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-center text-red-700">
          {error}
        </div>
      );
    }

    if (coinPacks.length === 0) {
      return (
        <div className="rounded-xl bg-white/70 px-4 py-6 text-center text-purple-700">
          Пакеты монет временно недоступны.
        </div>
      );
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {coinPacks.map((pack) => {
          const disabled = pack.activity === false;
          const isBusy = activePackId === pack.id;
          return (
            <button
              key={pack.id}
              type="button"
              disabled={disabled || activePackId !== null}
              onClick={() => handleBadgeClick(pack)}
              className={`relative overflow-hidden rounded-2xl border border-purple-200 bg-gradient-to-br from-white/80 via-purple-50 to-purple-100 p-4 text-left transition-transform ${
                disabled
                  ? "cursor-not-allowed opacity-50"
                  : "hover:-translate-y-1 hover:shadow-lg"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/70 shadow-inner">
                  <img
                    src={pack.image}
                    alt={pack.name}
                    className="h-12 w-12 object-contain"
                    loading="lazy"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold text-purple-800">
                      {pack.name}
                    </h3>
                    {renderPrice(pack)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-purple-700">
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-200/60 px-2 py-1 font-medium">
                      <span className="text-lg font-bold text-purple-800">
                        {new Intl.NumberFormat("ru-RU").format(pack.amount)}
                      </span>
                      <span className="text-xs uppercase tracking-wide text-purple-600">
                        монет
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              {isBusy && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    );
  }, [coinPacks, loading, error, renderPrice, handleBadgeClick, activePackId]);

  return (
    <div className="fixed inset-0 z-[160] flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-6">
      <div
        ref={containerRef}
        className="w-full max-w-3xl space-y-6 rounded-3xl bg-gradient-to-br from-purple-100 via-pink-50 to-orange-50 p-6 shadow-2xl"
      >
        <div className="flex flex-col gap-2 text-center">
          <h2 className="text-2xl font-bold text-purple-800 sm:text-3xl">
            Выбор пакета монет
          </h2>
          <p className="text-sm text-purple-700 sm:text-base">
            Выберите подходящий пакет монет для пополнения баланса.
          </p>
        </div>
        {content}
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl bg-purple-500 py-3 text-base font-semibold text-white transition hover:bg-purple-600"
        >
          Закрыть
        </button>
      </div>
      {dialogConfig && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="text-purple-700">{dialogConfig.message}</div>
            {dialogConfig.variant === "success" ? (
              <button
                type="button"
                onClick={handleRestart}
                className="w-full rounded-lg bg-purple-500 py-2 font-semibold text-white transition hover:bg-purple-600"
              >
                Перезапустить игру
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setDialogConfig(null)}
                className="w-full rounded-lg bg-purple-500 py-2 font-semibold text-white transition hover:bg-purple-600"
              >
                ОК
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CoinPackSelector;
