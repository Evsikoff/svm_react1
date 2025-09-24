import React, { useState } from "react";
import bridge from "@vkontakte/vk-bridge";
import { MonsterTypeInfo } from "../types";

type MonsterTypeSelectorProps = {
  types: MonsterTypeInfo[];
  loading: boolean;
  error: string;
  userId: number | null;
  isVK: boolean;
  onClose: () => void;
  onRetry: () => void;
};

interface CreatePaymentLinkResponse {
  paymentlink?: string | null;
  errortext?: string | null;
  item?: string | null;
}

type DialogConfig = {
  message: string;
  variant: "info" | "success";
};

const VK_PRICE_ICON_URL =
  "https://storage.yandexcloud.net/svm/img/service_icons/vk.png";

const MonsterTypeSelector: React.FC<MonsterTypeSelectorProps> = ({
  types,
  loading,
  error,
  userId,
  isVK,
  onClose,
  onRetry,
}) => {
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [dialogConfig, setDialogConfig] = useState<DialogConfig | null>(null);

  const isProcessing = processingId !== null;

  const handleTypeSelection = async (type: MonsterTypeInfo) => {
    if (!type.activity || isProcessing) {
      return;
    }

    if (!userId) {
      setDialogConfig({
        message: "Ошибка: не удалось определить пользователя.",
        variant: "info",
      });
      return;
    }

    setProcessingId(type.number);

    try {
      const requestBody = isVK
        ? {
            userId,
            invoicetypeId: type.number,
            vk: true,
          }
        : {
            userId,
            invoicetypeId: type.number,
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

      if (!response.ok) {
        throw new Error(
          `Не удалось создать ссылку на оплату (код ${response.status}).`
        );
      }

      const data: CreatePaymentLinkResponse = await response.json();
      const trimmedError = data.errortext?.trim();
      if (trimmedError) {
        setDialogConfig({
          message: trimmedError,
          variant: "info",
        });
        return;
      }

      if (isVK) {
        const rawItem = data.item;
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

      const paymentLink = data.paymentlink?.trim();
      if (paymentLink) {
        window.location.href = paymentLink;
        return;
      }

      setDialogConfig({
        message:
          "Ссылка на оплату не была получена. Попробуйте повторить попытку позже.",
        variant: "info",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Произошла непредвиденная ошибка при создании ссылки на оплату.";
      setDialogConfig({
        message,
        variant: "info",
      });
    } finally {
      setProcessingId(null);
    }
  };

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
                    const shouldUseVkPrice =
                      isVK && typeof type.vkprice === "number";
                    const priceValue = shouldUseVkPrice
                      ? type.vkprice!
                      : type.price;
                    const formattedPrice = new Intl.NumberFormat("ru-RU").format(
                      priceValue
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
                          disabled={!type.activity || isProcessing}
                          onClick={() => handleTypeSelection(type)}
                          aria-busy={processingId === type.number}
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
                              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-400/10 to-purple-500/10 px-3 py-1 text-sm font-bold text-orange-600">
                                {formattedPrice}
                                {shouldUseVkPrice ? (
                                  <img
                                    src={VK_PRICE_ICON_URL}
                                    alt="VK Pay"
                                    className="h-4 w-4"
                                    loading="lazy"
                                  />
                                ) : (
                                  <span className="text-xs font-semibold text-purple-700">
                                    ₽
                                  </span>
                                )}
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
                          {processingId === type.number && (
                            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/70">
                              <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
                            </div>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {dialogConfig && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
              <p className="text-base font-semibold text-purple-900">
                {dialogConfig.message}
              </p>
              {dialogConfig.variant === "success" ? (
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-6 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-orange-400 px-6 py-2 text-sm font-semibold text-white shadow transition hover:from-purple-600 hover:to-orange-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-500"
                >
                  Перезапустить игру
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setDialogConfig(null)}
                  className="mt-6 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-orange-400 px-6 py-2 text-sm font-semibold text-white shadow transition hover:from-purple-600 hover:to-orange-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-500"
                >
                  ОК
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonsterTypeSelector;
