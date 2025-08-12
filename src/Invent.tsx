// Invent.tsx — версия с обновлённым фреймом «Магазин»
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

type Props = {
  userId: number | null;
};

type WalletResponse = {
  money?: number;
};

type InventoryItem = {
  inventoryid: number;
  inventoryname: string;
  inventoryimage: string;
  inventorydescription: string;
  inventoryprice: number;
  inventorytype: number;
};

type ShopResponse = {
  inventoryitems?: InventoryItem[];
};

const Invent: React.FC<Props> = ({ userId }) => {
  const [money, setMoney] = useState<number>(0);
  const [moneyLoading, setMoneyLoading] = useState(true);
  const [moneyError, setMoneyError] = useState<string>("");

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [shopLoading, setShopLoading] = useState(true);
  const [shopError, setShopError] = useState<string>("");

  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<string>("");

  async function withRetry<T>(fn: () => Promise<T>, isValid: (v: T) => boolean, label: string): Promise<T> {
    let lastErr: any = null;
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        const res = await fn();
        if (!isValid(res)) throw new Error("Некорректный ответ");
        return res;
      } catch (e: any) {
        lastErr = e;
        if (attempt < 4) await new Promise((r) => setTimeout(r, 300));
      }
    }
    throw new Error(label + ": " + (lastErr?.message || ""));
  }

  useEffect(() => {
    if (!userId) {
      setMoneyLoading(false);
      setMoneyError("userId отсутствует");
      return;
    }
    withRetry(
      () => axios.post<WalletResponse>("https://functions.yandexcloud.net/d4ej7dr2gb17q1gjhunk", { userId }),
      (r) => typeof r?.data?.money === "number",
      "Ошибка при загрузке кошелька"
    )
      .then((res) => setMoney(res.data.money!))
      .catch((e) => setMoneyError(e.message))
      .finally(() => setMoneyLoading(false));
  }, [userId]);

  useEffect(() => {
    withRetry(
      () => axios.get<ShopResponse>("https://functions.yandexcloud.net/d4eq0b2po3vrtvgqbori"),
      (r) => Array.isArray(r?.data?.inventoryitems),
      "Ошибка при загрузке магазина"
    )
      .then((res) => setItems(res.data.inventoryitems || []))
      .catch((e) => setShopError(e.message))
      .finally(() => setShopLoading(false));
  }, []);

  const handleBuy = async (item: InventoryItem) => {
    setActionMessage("");
    setActionLoading(item.inventoryid);
    try {
      const resp = await withRetry(
        () => axios.post("https://functions.yandexcloud.net/d4e7f9s88lj80j5it43k", {
          userId,
          itemid: item.inventoryid,
        }),
        (r) => typeof r?.data?.text === "string",
        "Ошибка при покупке"
      );
      setActionMessage(resp.data.text);
    } catch (e: any) {
      setActionMessage(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const badgeBg = (t: number) => {
    switch (t) {
      case 1: return "bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200";
      case 2: return "bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200";
      case 3: return "bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200";
      case 4: return "bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200";
      default: return "bg-gray-50 border border-gray-200";
    }
  };

  const moneyFormatted = useMemo(() => new Intl.NumberFormat("ru-RU").format(money), [money]);

  return (
    <div className="p-6 max-w-xl mx-auto">
      {moneyLoading ? (
        <div className="flex justify-center py-16"><div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          {moneyError && <div className="bg-red-100 text-red-700 border border-red-300 px-4 py-2 rounded mb-4">{moneyError}</div>}

          <div className="flex items-center gap-4 bg-yellow-50 border border-yellow-300 rounded-2xl p-4 shadow">
            <img src="https://storage.yandexcloud.net/svm/img/money.png" alt="Золотые монеты" className="w-16 h-16 object-contain" />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-yellow-800/80">Золотые монеты</div>
              <div className="text-3xl font-extrabold text-yellow-800 truncate">{moneyFormatted}</div>
            </div>
            <button className="px-4 py-2 rounded bg-gray-300 text-gray-600 cursor-not-allowed" disabled>Пополнить</button>
          </div>

          <section aria-label="Магазин" className="mt-6">
            <h2 className="text-lg font-semibold mb-3">Магазин</h2>
            {shopLoading ? (
              <div className="flex justify-center py-10"><div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : shopError ? (
              <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded">{shopError}</div>
            ) : (
              <ul className="grid grid-cols-1 gap-4">
                {items.map((it) => {
                  const affordable = it.inventoryprice <= money;
                  return (
                    <li
                      key={it.inventoryid}
                      className={`${badgeBg(it.inventorytype)} rounded-2xl p-4 shadow ${!affordable ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:shadow-lg"}`}
                      onClick={() => affordable && handleBuy(it)}
                    >
                      <div className="flex items-start gap-4">
                        <img src={it.inventoryimage} alt={it.inventoryname} className="w-20 h-20 object-contain shrink-0 rounded-xl bg-white/60" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="text-base font-bold truncate" title={it.inventoryname}>{it.inventoryname}</h3>
                            <div className="text-sm font-semibold whitespace-nowrap">{new Intl.NumberFormat("ru-RU").format(it.inventoryprice)}</div>
                          </div>
                          <p className="mt-1 text-sm text-gray-700 line-clamp-3">{it.inventorydescription}</p>
                        </div>
                      </div>
                      {actionLoading === it.inventoryid && <div className="mt-2 flex justify-center"><div className="w-6 h-6 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>}
                    </li>
                  );
                })}
              </ul>
            )}
            {actionMessage && <div className="mt-4 bg-blue-50 text-blue-800 border border-blue-200 px-4 py-2 rounded">{actionMessage}</div>}
          </section>
        </>
      )}
    </div>
  );
};

export default Invent;
