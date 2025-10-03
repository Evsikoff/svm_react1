// Shop.tsx — фрейм «Инвентарь» с «Золотыми монетами» и «Магазином»
import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import CoinPackSelector from "./components/CoinPackSelector";
import VKDesktopFrame from "./components/VKDesktopFrame";

// ===== Типы =====
type Props = {
  userId: number | null; // берётся из init
  isVKEnvironment?: boolean;
  isVKDesktop?: boolean;
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
  active?: boolean; // признак доступности товара
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

const Shop: React.FC<Props> = ({
  userId,
  isVKEnvironment = false,
  isVKDesktop = false,
}) => {
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
  const [showCoinPackSelector, setShowCoinPackSelector] = useState(false);

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
            "https://usermoneyget-production.up.railway.app/money",
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

  const handleOpenCoinPacks = useCallback(() => {
    setShowCoinPackSelector(true);
  }, []);

  const handleCloseCoinPacks = useCallback(() => {
    setShowCoinPackSelector(false);
    loadWallet();
  }, [loadWallet]);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  // ===== Загрузка магазина =====
  useEffect(() => {
    let cancelled = false;
    const loadShop = async () => {
      if (!userId) {
        setShopLoading(false);
        setShopError("userId отсутствует");
        return;
      }
      setShopLoading(true);
      try {
        const resp = await withRetry(
          () =>
            axios.post<ShopResponse>(
              "https://itemshopget-production.up.railway.app/store-items",
              { userId },
              { timeout: 3000 }
            ),
          (r) => Array.isArray((r as any)?.data?.inventoryitems),
          "Ошибка при загрузке магазина"
        );
        if (!cancelled) {
          setItems(resp.data.inventoryitems || []);
          setShopError("");
        }
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
  }, [userId]);

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

  const isDesktopView = isVKDesktop;
  const renderContent = () => {
    const loadingWrapperClass = isDesktopView
      ? "w-full flex items-center justify-center py-16"
      : "w-full flex items-center justify-center py-16";
    const contentWrapperClass = isDesktopView
      ? "mx-auto max-w-4xl space-y-8"
      : "max-w-xl mx-auto";
    const walletCardClass = isDesktopView
      ? "flex items-center gap-6 rounded-3xl border-2 border-yellow-300 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-100 p-6 shadow-xl"
      : "flex items-center gap-4 bg-yellow-50 border border-yellow-300 rounded-2xl p-4 shadow";
    const walletLabelClass = isDesktopView
      ? "text-sm uppercase tracking-[0.3em] text-yellow-700"
      : "text-sm text-yellow-800/80";
    const walletValueClass = isDesktopView
      ? "text-3xl sm:text-4xl font-black text-yellow-800 leading-tight break-all"
      : "text-xl sm:text-2xl md:text-3xl font-extrabold text-yellow-800 leading-tight break-all";
    const walletButtonClass = isDesktopView
      ? "px-6 py-3 rounded-2xl bg-purple-500 text-white font-semibold shadow-lg hover:bg-purple-600 transition"
      : "px-4 py-2 rounded-xl bg-purple-500 text-white font-semibold shadow hover:bg-purple-600 transition";
    const sectionTitleClass = isDesktopView
      ? "text-2xl font-bold text-purple-800 mb-4"
      : "text-lg font-semibold mb-3";
    const shopSpinnerClass = isDesktopView
      ? "w-full flex items-center justify-center py-12"
      : "w-full flex items-center justify-center py-10";
    const shopErrorClass = isDesktopView
      ? "bg-red-50 text-red-700 border border-red-200 px-5 py-3 rounded-2xl shadow"
      : "bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded";
    const emptyStateClass = isDesktopView
      ? "text-gray-500 text-lg text-center py-6"
      : "text-gray-500";
    const itemsListClass = isDesktopView
      ? "grid grid-cols-2 gap-5"
      : "grid grid-cols-1 gap-4";
    const itemCardBase = isDesktopView
      ? "rounded-3xl p-5 shadow-xl"
      : "rounded-2xl p-4 shadow";
    const itemImageClass = isDesktopView
      ? "w-24 h-24 object-contain shrink-0 rounded-2xl bg-white/60"
      : "w-20 h-20 object-contain shrink-0 rounded-xl bg-white/60";
    const itemTitleClass = isDesktopView
      ? "text-lg font-bold truncate"
      : "text-base font-bold truncate";
    const itemPriceClass = isDesktopView
      ? "text-base font-semibold whitespace-nowrap"
      : "text-sm font-semibold whitespace-nowrap";
    const itemDescriptionClass = isDesktopView
      ? "mt-2 text-sm text-gray-700 leading-relaxed line-clamp-4"
      : "mt-1 text-sm text-gray-700 line-clamp-3";
    const modalContainerClass = isDesktopView
      ? "bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4"
      : "bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4";
    const walletErrorClass = isDesktopView
      ? "bg-red-100 text-red-700 border border-red-300 px-5 py-3 rounded-2xl mb-4"
      : "bg-red-100 text-red-700 border border-red-300 px-4 py-2 rounded mb-4";

    return (
      <>
        {moneyLoading && (
          <div className={loadingWrapperClass}>
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!moneyLoading && (
          <div className={contentWrapperClass}>
            {moneyError && <div className={walletErrorClass}>{moneyError}</div>}

            <div className={walletCardClass}>
              <img
                src="https://storage.yandexcloud.net/svm/img/money.png"
                alt="Золотые монеты"
                className="w-16 h-16 object-contain"
              />
              <div className="flex-1 min-w-0">
                <div className={walletLabelClass}>Золотые монеты</div>
                <div className={walletValueClass}>{moneyFormatted}</div>
              </div>
              <button className={walletButtonClass} onClick={handleOpenCoinPacks}>
                Пополнить
              </button>
            </div>

            <section aria-label="Магазин" className={isDesktopView ? "mt-8" : "mt-6"}>
              {!isDesktopView && (
                <h2 className={sectionTitleClass}>Магазин</h2>
              )}

              {shopLoading && (
                <div className={shopSpinnerClass}>
                  <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!shopLoading && shopError && (
                <div className={shopErrorClass}>{shopError}</div>
              )}

              {!shopLoading && !shopError && (
                <div>
                  {items.length === 0 ? (
                    <div className={emptyStateClass}>Товары временно отсутствуют.</div>
                  ) : (
                    <ul className={itemsListClass}>
                      {items.map((it) => {
                        const isActive = it.active !== false;
                        const affordable = it.inventoryprice <= money;
                        const isLoading = actionLoading === it.inventoryid;
                        const clickable = isActive && affordable;
                        const cardClasses = `${badgeBg(it.inventorytype)} ${itemCardBase} ${
                          clickable
                            ? "cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition"
                            : "opacity-50 cursor-not-allowed"
                        } ${isActive ? "" : "grayscale"} relative`;

                        return (
                          <li
                            key={it.inventoryid}
                            className={cardClasses}
                            onClick={() => (clickable ? handleBuy(it) : undefined)}
                            aria-disabled={!clickable}
                          >
                            <div className="flex items-start gap-4">
                              <img
                                src={it.inventoryimage}
                                alt={it.inventoryname}
                                className={itemImageClass}
                                loading="lazy"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-3">
                                  <h3 className={itemTitleClass} title={it.inventoryname}>
                                    {it.inventoryname}
                                  </h3>
                                  <div className={itemPriceClass}>
                                    {new Intl.NumberFormat("ru-RU").format(
                                      it.inventoryprice
                                    )}
                                  </div>
                                </div>
                                <p className={itemDescriptionClass}>{it.inventorydescription}</p>
                              </div>
                            </div>

                            {isLoading && (
                              <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-white/60">
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

        {showModal && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
            onClick={() => {
              setShowModal(false);
              loadWallet();
            }}
          >
            <div
              className={modalContainerClass}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-lg font-semibold mb-4">Сообщение</div>
              <div className="text-gray-800 whitespace-pre-wrap">{actionMessage}</div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    loadWallet();
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {showCoinPackSelector && (
          <CoinPackSelector
            onClose={handleCloseCoinPacks}
            userId={userId}
            isVK={isVKEnvironment}
          />
        )}
      </>
    );
  };

  if (isDesktopView) {
    return <VKDesktopFrame accent="amber">{renderContent()}</VKDesktopFrame>;
  }

  return <div className="p-6">{renderContent()}</div>;
};

export default Shop;
