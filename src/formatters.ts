export const formatPrice = (price: number, showCents = true) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: showCents ? 2 : 0,
  }).format(price);

export const formatNum = (price: number) =>
  new Intl.NumberFormat("en-US").format(price);

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
