// Shop.tsx — фрейм «Инвентарь» с «Золотыми монетами» и «Магазином»
import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

// ===== Типы =====
type Props = {
  userId: number | null; // берётся из init
};

type WalletResponse = {
  money?: number;
  [k: string]: unknown;
};

type InventoryItem = {
  inventoryid: number;
  inventoryname: string;
  inventoryimage: string;
  inventorydescription: string;
  inventoryprice: number;
  inventorytype: number; // 1..N — влияет на фон бейджа
};

type ShopResponse = {
  inventoryitems?: InventoryItem[];
  [k: string]: unknown;
};

// ===== Универсальная обёртка с ретраями (1 + 3 повтора) =====
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
    } catch (e: any) {
      lastErr = e;
      if (attempt < 4) await new Promise((r) => setTimeout(r, 300));
    }
  }
  const text =
    typeof lastErr?.message === "string"
      ? `${label}: ${lastErr.message}`
      : label;
  throw new Error(text);
}

// ===== Компонент =====
const Shop: React.FC<Props> = ({ userId }) => {
  // --- Кошелёк ---
  const [money, setMoney] = useState<number>(0);
  const [moneyLoading, setMoneyLoading] = useState(true);
  const [moneyError, setMoneyError] = useState<string>("");

  // --- Магазин ---
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [shopLoading, setShopLoading] = useState(true);
  const [shopError, setShopError] = useState<string>("");

  // --- Покупка ---
  const [actionLoading, setActionLoading] = useState<number | null>(null); // id товара, который «крутится»
  const [actionMessage, setActionMessage] = useState<string>(""); // текст из функции покупки
  const [showModal, setShowModal] = useState(false); // модальное окно с сообщением

  // ===== Загрузка кошелька (вынесено в функцию, вызывается и при закрытии модалки) =====
  const loadWallet = useCallback(async () => {
    if (!userId) {
      setMoneyLoading(false);
      setMoneyError("userId отсутствует");
      return;
    }
    setMoneyLoading(true);
    try {
      const resp = await withRetry(
        () =>
          axios.post<WalletResponse>(
            "https://functions.yandexcloud.net/d4ej7dr2gb17q1gjhunk",
            { userId }
          ),
        (r) => r != null && typeof (r as any)?.data?.money === "number",
        "Ошибка при загрузке кошелька"
      );
      setMoney(resp.data.money!);
      setMoneyError("");
    } catch (e: any) {
      setMoneyError(e.message || "Ошибка при загрузке кошелька");
    } finally {
      setMoneyLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  // ===== Загрузка магазина =====
  useEffect(() => {
    let cancelled = false;
    const loadShop = async () => {
      setShopLoading(true);
      try {
        const resp = await withRetry(
          () =>
            axios.get<ShopResponse>(
              "https://functions.yandexcloud.net/d4eq0b2po3vrtvgqbori"
            ),
          (r) => Array.isArray((r as any)?.data?.inventoryitems),
          "Ошибка при загрузке магазина"
        );
        if (!cancelled) setItems(resp.data.inventoryitems || []);
      } catch (e: any) {
        if (!cancelled)
          setShopError(e.message || "Ошибка при загрузке магазина");
      } finally {
        if (!cancelled) setShopLoading(false);
      }
    };
    loadShop();
    return () => {
      cancelled = true;
    };
  }, []);

  // ===== Покупка (с ретраями; показывает модалку с текстом ответа) =====
  const handleBuy = async (item: InventoryItem) => {
    if (!userId) {
      setActionMessage("Ошибка: userId отсутствует");
      setShowModal(true);
      return;
    }
    setActionMessage("");
    setActionLoading(item.inventoryid);
    try {
      const resp = await withRetry(
        () =>
          axios.post("https://functions.yandexcloud.net/d4e7f9s88lj80j5it43k", {
            userId,
            itemid: item.inventoryid,
          }),
        (r) =>
          typeof (r as any)?.data?.text === "string" ||
          typeof (r as any)?.data?.message === "string",
        "Ошибка при покупке"
      );
      // Поддержка разных форматов ответа
      const text =
        (resp as any)?.data?.text ??
        (resp as any)?.data?.message ??
        "Операция выполнена.";
      setActionMessage(String(text));
      setShowModal(true);
    } catch (e: any) {
      setActionMessage(e?.message || "Произошла ошибка");
      setShowModal(true);
    } finally {
      setActionLoading(null);
    }
  };

  // ===== Вспомогательное: цвета бейджа по типу =====
  const badgeBg = (t: number) => {
    switch (t) {
      case 1:
        return "bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200";
      case 2:
        return "bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200";
      case 3:
        return "bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200";
      case 4:
        return "bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200";
      default:
        return "bg-gray-50 border border-gray-200";
    }
  };

  const moneyFormatted = useMemo(
    () => new Intl.NumberFormat("ru-RU").format(money),
    [money]
  );

  return (
    <div className="p-6">
      {/* Общий спиннер на время загрузки кошелька */}
      {moneyLoading && (
        <div className="w-full flex items-center justify-center py-16">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!moneyLoading && (
        <div className="max-w-xl mx-auto">
          {/* Ошибка кошелька */}
          {moneyError && (
            <div className="bg-red-100 text-red-700 border border-red-300 px-4 py-2 rounded mb-4">
              {moneyError}
            </div>
          )}

          {/* Фрейм «Золотые монеты» */}
          <div className="flex items-center gap-4 bg-yellow-50 border border-yellow-300 rounded-2xl p-4 shadow">
            <img
              src="https://storage.yandexcloud.net/svm/img/money.png"
              alt="Золотые монеты"
              className="w-16 h-16 object-contain"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-yellow-800/80">Золотые монеты</div>
              <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-yellow-800 leading-tight break-all">
                {moneyFormatted}
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

          {/* Фрейм «Магазин» */}
          <section aria-label="Магазин" className="mt-6">
            <h2 className="text-lg font-semibold mb-3">Магазин</h2>

            {/* Состояния загрузки/ошибки */}
            {shopLoading && (
              <div className="w-full flex items-center justify-center py-10">
                <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!shopLoading && shopError && (
              <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded">
                {shopError}
              </div>
            )}

            {!shopLoading && !shopError && (
              <div>
                {items.length === 0 ? (
                  <div className="text-gray-500">
                    Товары временно отсутствуют.
                  </div>
                ) : (
                  <ul className="grid grid-cols-1 gap-4">
                    {items.map((it) => {
                      const affordable = it.inventoryprice <= money;
                      const isLoading = actionLoading === it.inventoryid;
                      return (
                        <li
                          key={it.inventoryid}
                          className={`${badgeBg(
                            it.inventorytype
                          )} rounded-2xl p-4 shadow ${
                            !affordable
                              ? "opacity-50 cursor-not-allowed"
                              : "cursor-pointer hover:shadow-lg"
                          } relative`}
                          onClick={() =>
                            affordable ? handleBuy(it) : undefined
                          }
                          aria-disabled={!affordable}
                        >
                          <div className="flex items-start gap-4">
                            <img
                              src={it.inventoryimage}
                              alt={it.inventoryname}
                              className="w-20 h-20 object-contain shrink-0 rounded-xl bg-white/60"
                              loading="lazy"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-3">
                                <h3
                                  className="text-base font-bold truncate"
                                  title={it.inventoryname}
                                >
                                  {it.inventoryname}
                                </h3>
                                <div className="text-sm font-semibold whitespace-nowrap">
                                  {new Intl.NumberFormat("ru-RU").format(
                                    it.inventoryprice
                                  )}
                                </div>
                              </div>
                              <p className="mt-1 text-sm text-gray-700 line-clamp-3">
                                {it.inventorydescription}
                              </p>
                            </div>
                          </div>

                          {/* Локальный спиннер покупки поверх карточки */}
                          {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/50">
                              <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Модальное окно сообщения (всплывающее) */}
      {showModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
          onClick={() => {
            setShowModal(false);
            // После закрытия модалки — обновляем кошелёк
            loadWallet();
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()} // не закрывать при клике внутри окна
          >
            <div className="text-lg font-semibold mb-4">Сообщение</div>
            <div className="text-gray-800 whitespace-pre-wrap">
              {actionMessage}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  loadWallet(); // обновляем баланс и при закрытии по кнопке
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shop;
