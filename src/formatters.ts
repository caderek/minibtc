export const formatPrice = (price: number, showCents = true) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: showCents ? 2 : 0,
  }).format(price);

export const formatNum = (price: number) =>
  new Intl.NumberFormat("en-US").format(price);

export const formatPriceAsSatsPer$ = (price: number) => {
  return `${formatNum(Math.round(1e8 / price))} sat/$`;
};

export const formatBytes = (bytes: number) => {
  if (bytes / 1e9 >= 1) {
    const formatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(bytes / 1e9);

    return `${formatted} GB`;
  }

  if (bytes / 1e6 >= 1) {
    return `${Math.round(bytes / 1e6)} MB`;
  }

  if (bytes / 1e3 >= 1) {
    return `${Math.round(bytes / 1e3)} kB`;
  }

  return `${bytes} B`;
};

export const formatPercentageChange = (
  startPrice: number,
  currentPrice: number
) => {
  const priceChange = Number((currentPrice / startPrice - 1).toPrecision(2));
  const sign = priceChange > 0 ? "+" : "";

  return (
    sign +
    new Intl.NumberFormat("en-US", {
      style: "percent",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(priceChange)
  );
};

const MS_IN_SECOND = 1000;
const MS_IN_MINUTE = MS_IN_SECOND * 60;
const MS_IN_HOUR = MS_IN_MINUTE * 60;
const MS_IN_DAY = MS_IN_HOUR * 24;

export const formatTimeAgo = (ms: number, precision: number = 0) => {
  const h = Math.floor(ms / MS_IN_HOUR);
  const m = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: precision,
  }).format((ms - MS_IN_HOUR * h) / MS_IN_MINUTE);

  return `${h > 0 ? `${h}h ` : ""}${m}m`;
};

export const formatDuration = (ms: number) => {
  const d = Math.floor(ms / MS_IN_DAY);
  const h = Math.floor((ms - MS_IN_DAY * d) / MS_IN_HOUR);
  const m = Math.floor((ms - MS_IN_DAY * d - MS_IN_HOUR * h) / MS_IN_MINUTE);

  const parts = [];

  if (d > 0) {
    parts.push(`<strong>${d}</strong> day${d === 1 ? "" : "s"}`);
  }

  if (d > 0 || h > 0) {
    parts.push(`<strong>${h}</strong> hour${h === 1 ? "" : "s"}`);
  }

  parts.push(`<strong>${m}</strong> minute${m === 1 ? "" : "s"}`);

  return parts.join(" ");
};
