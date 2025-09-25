
import React, { useCallback, useEffect, useRef, useState } from "react";
import bridge from "@vkontakte/vk-bridge";


interface CompetitionEnergyReplenishmentProps {
  onClose: () => void;
  userId: number;
  isVK?: boolean;
}

interface BadgeOption {
  id: string;
  label: string;
  price: number;
  vkPrice?: number;
  icon: string;
  invoiceTypeId: number;
}

const VK_PRICE_ICON_URL =
  "https://storage.yandexcloud.net/svm/img/service_icons/vk.png";

interface CreatePaymentLinkResponse {
  paymentlink?: string | null;
  errortext?: string | null;
  item?: string | null;
}

const BADGES: BadgeOption[] = [
  {
    id: "ten",
    label: "Десять единиц энергии",
    price: 270,
    vkPrice: 39,
    icon: "https://storage.yandexcloud.net/svm/img/compenerjymid.png",
    invoiceTypeId: 9,
  },
  {
    id: "ninety",
    label: "Девяносто единиц энергии",
    price: 1980,
    vkPrice: 283,
    icon: "https://storage.yandexcloud.net/svm/img/compenerjymany.png",
    invoiceTypeId: 10,
  },
];

const CompetitionEnergyReplenishment: React.FC<CompetitionEnergyReplenishmentProps> = ({
  onClose,
  userId,
  isVK = false,
}) => {
  const [dialogConfig, setDialogConfig] = useState<
    | {
        message: string;
        variant: "info" | "success";
      }
    | null
  >(null);
  const [activeBadgeId, setActiveBadgeId] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const restartTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    modalRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    return () => {
      if (restartTimeoutRef.current !== null) {
        window.clearTimeout(restartTimeoutRef.current);
      }
    };
  }, []);

  const handleRestart = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    restartTimeoutRef.current = window.setTimeout(() => {
      window.location.reload();
    }, 300);
  }, []);

  const handleBadgeClick = async (badgeId: string) => {
    if (activeBadgeId) {
      return;
    }

    const selectedBadge = BADGES.find((badge) => badge.id === badgeId);

    if (!selectedBadge) {
      setDialogConfig({
        message:
          "Выбранный пакет пополнения временно недоступен. Попробуйте другой вариант.",
        variant: "info",
      });
      return;
    }

    setActiveBadgeId(badgeId);

    try {
      const requestBody = isVK
        ? {
            userId,
            invoicetypeId: selectedBadge.invoiceTypeId,
            vk: true,
          }
        : {
            userId,
            invoicetypeId: selectedBadge.invoiceTypeId,
          };

      const response = await fetch(
        "https://paymentlinkget-production.up.railway.app/create-payment-link",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
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
          message:
            trimmedError || "Не удалось создать ссылку на оплату. Попробуйте позже.",
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
          (window as Window & {
            vkBridge?: typeof bridge;
          }).vkBridge ?? bridge;

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
      setActiveBadgeId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-6">
      <div className="flex min-h-full w-full max-w-4xl justify-center">
        <div
          className="relative w-full rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-black p-6 text-white shadow-[0_25px_80px_rgba(0,0,0,0.55)] max-h-[calc(100vh-4rem)] overflow-y-auto md:p-8"
          ref={modalRef}
        >
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
              {BADGES.map((badge) => {
                const isDisabled = Boolean(activeBadgeId);
                const isActive = activeBadgeId === badge.id;
                const shouldUseVkPrice =
                  isVK === true && typeof badge.vkPrice === "number";
                const priceValue = shouldUseVkPrice
                  ? badge.vkPrice!
                  : badge.price;
                const formattedPrice = new Intl.NumberFormat("ru-RU").format(
                  priceValue
                );

                return (
                  <button
                    key={badge.id}
                    type="button"
                    onClick={() => handleBadgeClick(badge.id)}
                    className={`group flex h-full flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-900/80 p-5 text-left shadow-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                      isDisabled
                        ? "cursor-not-allowed opacity-75"
                        : "hover:border-purple-500/60 hover:bg-slate-900 hover:shadow-[0_0_35px_rgba(168,85,247,0.35)]"
                    } ${isActive ? "border-purple-500/60" : ""}`}
                    disabled={isDisabled}
                    aria-busy={isActive}
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
                        <span className="text-2xl font-bold text-purple-300 md:text-3xl inline-flex items-center gap-2">
                          {formattedPrice}
                          {shouldUseVkPrice ? (
                            <img
                              src={VK_PRICE_ICON_URL}
                              alt="VK Pay"
                              className="h-5 w-5"
                            />
                          ) : (
                            <span>₽</span>
                          )}
                        </span>
                      </div>
                    </div>
                    <span className="mt-4 text-center text-xs text-slate-400 md:text-left">
                      Оптимальный выбор для восстановления энергии в нужный момент.
                    </span>
                  </button>
                );
              })}
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
      {dialogConfig && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="text-base font-semibold text-slate-800">
              {dialogConfig.message}
            </div>
            {dialogConfig.variant === "success" ? (
              <button
                type="button"
                onClick={handleRestart}
                className="mt-6 w-full rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-purple-500"
              >
                Перезапустить игру
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setDialogConfig(null)}
                className="mt-6 w-full rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-purple-500"
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

export default CompetitionEnergyReplenishment;
