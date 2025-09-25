import React, { useCallback, useEffect, useRef, useState } from "react";
import bridge from "@vkontakte/vk-bridge";

interface EnergyReplenishmentProps {
  onClose: () => void;
  userId: number | null;
  isVK?: boolean;
}

interface CreatePaymentLinkResponse {
  paymentlink?: string | null;
  errortext?: string | null;
  item?: string | null;
}

interface EnergyOption {
  id: string;
  label: string;
  price: number;
  vkPrice?: number;
  icon: string;
  invoiceTypeId: number;
}

const VK_PRICE_ICON_URL =
  "https://storage.yandexcloud.net/svm/img/service_icons/vk.png";

const OPTIONS: EnergyOption[] = [
  {
    id: "ten",
    label: "Десять единиц энергии",
    price: 135,
    vkPrice: 20,
    icon: "https://storage.yandexcloud.net/svm/img/averagenumberteacherenergy.png",
    invoiceTypeId: 7,
  },
  {
    id: "ninety",
    label: "Девяносто единиц энергии",
    price: 990,
    vkPrice: 142,
    icon: "https://storage.yandexcloud.net/svm/img/largenumberteachenergy.png",
    invoiceTypeId: 8,
  },
];

const EnergyReplenishment: React.FC<EnergyReplenishmentProps> = ({
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
  const [activeOptionId, setActiveOptionId] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const restartTimeoutRef = useRef<number | null>(null);

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

  const handleOptionClick = async (optionId: string) => {
    if (!userId) {
      setDialogConfig({
        message: "Не удалось определить пользователя. Повторите позже.",
        variant: "info",
      });
      return;
    }

    const selectedOption = OPTIONS.find((option) => option.id === optionId);

    if (!selectedOption) {
      setDialogConfig({
        message:
          "Выбранный вариант пополнения недоступен. Попробуйте другой.",
        variant: "info",
      });
      return;
    }

    setActiveOptionId(optionId);

    try {
      const requestBody = isVK
        ? {
            userId,
            invoicetypeId: selectedOption.invoiceTypeId,
            vk: true,
          }
        : {
            userId,
            invoicetypeId: selectedOption.invoiceTypeId,
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
        // Ответ не является JSON
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
      setActiveOptionId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-6">
      <div
        className="bg-gradient-to-br from-purple-50 to-orange-50 rounded-2xl p-6 shadow-2xl w-full max-w-md space-y-6"
        ref={modalRef}
      >
        <h2 className="text-2xl font-bold text-purple-700 text-center">
          Пополнение энергии
        </h2>
        <div className="space-y-4">
          {OPTIONS.map((opt) => {
            const shouldUseVkPrice = isVK === true && typeof opt.vkPrice === "number";
            const priceValue = shouldUseVkPrice ? opt.vkPrice! : opt.price;
            const formattedPrice = new Intl.NumberFormat("ru-RU").format(
              priceValue
            );

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleOptionClick(opt.id)}
                className={`flex w-full items-center justify-between rounded-xl border border-purple-200 bg-purple-50 p-4 transition-colors hover:bg-purple-100 ${
                  activeOptionId
                    ? "cursor-not-allowed opacity-75"
                    : "cursor-pointer"
                } ${activeOptionId === opt.id ? "bg-purple-100" : ""}`}
                disabled={Boolean(activeOptionId)}
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={opt.icon}
                    alt={opt.label}
                    className="h-[100px] w-auto"
                  />
                  <span className="text-purple-800 font-medium">{opt.label}</span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-purple-700 font-semibold">
                  {formattedPrice}
                  {shouldUseVkPrice ? (
                    <img
                      src={VK_PRICE_ICON_URL}
                      alt="VK Pay"
                      className="h-4 w-4"
                    />
                  ) : (
                    <span>₽</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg"
        >
          Закрыть
        </button>
      </div>
      {dialogConfig && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full text-center space-y-4">
            <div className="text-purple-700 font-semibold">{dialogConfig.message}</div>
            {dialogConfig.variant === "success" ? (
              <button
                type="button"
                onClick={handleRestart}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg"
              >
                Перезапустить игру
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setDialogConfig(null)}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg"
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

export default EnergyReplenishment;

