import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type Currency = "USD" | "GBP";

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatPrice: (cents: bigint | number) => string;
  symbol: string;
}

const STORAGE_KEY = "shopforge_currency";

// Rough exchange rate – display only, not used for backend storage
const RATES: Record<Currency, number> = {
  USD: 1,
  GBP: 0.79,
};

const SYMBOLS: Record<Currency, string> = {
  USD: "$",
  GBP: "£",
};

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "USD",
  setCurrency: () => {},
  formatPrice: (cents) => `$${(Number(cents) / 100).toFixed(2)}`,
  symbol: "$",
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "GBP" ? "GBP" : "USD";
  });

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem(STORAGE_KEY, c);
  }, []);

  const formatPrice = useCallback(
    (cents: bigint | number) => {
      const usd = Number(cents) / 100;
      const converted = usd * RATES[currency];
      return `${SYMBOLS[currency]}${converted.toFixed(2)}`;
    },
    [currency],
  );

  const symbol = SYMBOLS[currency];

  return (
    <CurrencyContext.Provider
      value={{ currency, setCurrency, formatPrice, symbol }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
