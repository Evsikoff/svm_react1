import React, { useState } from "react";

interface EnergyReplenishmentProps {
  onClose: () => void;
  userId: number | null;
}

interface CreatePaymentLinkResponse {
  paymentlink?: string | null;
  errortext?: string | null;
}

interface EnergyOption {
  id: string;
  label: string;
  price: string;
  icon: string;
  invoiceTypeId: number;
}

const OPTIONS: EnergyOption[] = [
  {
    id: "ten",
    label: "Десять единиц энергии",
    price: "135 ₽",
    icon: "https://storage.yandexcloud.net/svm/img/averagenumberteacherenergy.png",
    invoiceTypeId: 7,
  },
  {
    id: "ninety",
    label: "Девяносто единиц энергии",
    price: "990 ₽",
    icon: "https://storage.yandexcloud.net/svm/img/largenumberteachenergy.png",
    invoiceTypeId: 8,
  },
];

const EnergyReplenishment: React.FC<EnergyReplenishmentProps> = ({
  onClose,
  userId,
}) => {
  const [dialogMessage, setDialogMessage] = useState<string | null>(null);
  const [activeOptionId, setActiveOptionId] = useState<string | null>(null);

  const handleOptionClick = async (optionId: string) => {
    if (!userId) {
      setDialogMessage("Не удалось определить пользователя. Повторите позже.");
      return;
    }

    const selectedOption = OPTIONS.find((option) => option.id === optionId);

    if (!selectedOption) {
      setDialogMessage("Выбранный вариант пополнения недоступен. Попробуйте другой.");
      return;
    }

    setActiveOptionId(optionId);

    try {
      const response = await fetch(
        "https://paymentlinkget-production.up.railway.app/create-payment-link",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            invoicetypeId: selectedOption.invoiceTypeId,
          }),
        }
      );

      let data: CreatePaymentLinkResponse | null = null;

      try {
        data = (await response.json()) as CreatePaymentLinkResponse;
      } catch (jsonError) {
        // Ответ не является JSON
        data = null;
      }

      if (!response.ok) {
        const errorText = data?.errortext || "Не удалось создать ссылку на оплату.";
        setDialogMessage(errorText);
        return;
      }

      if (data?.errortext) {
        setDialogMessage(data.errortext);
        return;
      }

      if (data?.paymentlink) {
        window.location.href = data.paymentlink;
        return;
      }

      setDialogMessage("Ответ сервера не содержит ссылки на оплату.");
    } catch (error) {
      setDialogMessage("Произошла ошибка при создании ссылки на оплату. Попробуйте снова.");
    } finally {
      setActiveOptionId(null);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[150] bg-black/60">
      <div className="bg-gradient-to-br from-purple-50 to-orange-50 rounded-2xl p-6 shadow-2xl w-full max-w-md space-y-6">
        <h2 className="text-2xl font-bold text-purple-700 text-center">
          Пополнение энергии
        </h2>
        <div className="space-y-4">
          {OPTIONS.map((opt) => (
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
              <span className="text-purple-700">{opt.price}</span>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg"
        >
          Закрыть
        </button>
      </div>
      {dialogMessage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full text-center space-y-4">
            <div className="text-purple-700 font-semibold">{dialogMessage}</div>
            <button
              type="button"
              onClick={() => setDialogMessage(null)}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg"
            >
              ОК
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnergyReplenishment;

