// @ts-nocheck

import "https://cdn.skypack.dev/@khmyznikov/pwa-install";

const $price = document.querySelector("#price");
const $last24h = document.querySelector("#last24h");
const $feeLow = document.querySelector("#fee-low");
const $feeMid = document.querySelector("#fee-mid");
const $feeHigh = document.querySelector("#fee-high");
const $feeLowUSD = document.querySelector("#fee-low-usd");
const $feeMidUSD = document.querySelector("#fee-mid-usd");
const $feeHighUSD = document.querySelector("#fee-high-usd");
const $unconfirmed = document.querySelector("#unconfirmed");

const averageTXSize = 140; // vB
let prevPrice = 0;
let open24h = 0;

const mempool = {
  fees: {
    low: 0,
    mid: 0,
    high: 0,
  },
  unconfirmed: 0,
};

const formatPrice = (price) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);

const formatNum = (price) => new Intl.NumberFormat("en-US").format(price);

const getAverageTXCost = (satPerVB, price) =>
  formatPrice(satPerVB * averageTXSize * (price / 1e8));

const watchMempool = async () => {
  const fees = await fetch(
    "https://mempool.space/api/v1/fees/recommended"
  ).then((res) => res.json());

  mempool.fees.low = fees.hourFee;
  mempool.fees.mid = fees.halfHourFee;
  mempool.fees.high = fees.fastestFee;

  const unconfirmed = await fetch("https://mempool.space/api/mempool").then(
    (res) => res.json()
  );

  mempool.unconfirmed = unconfirmed.count;

  $feeLow.innerText = mempool.fees.low;
  $feeMid.innerText = mempool.fees.mid;
  $feeHigh.innerText = mempool.fees.high;
  $unconfirmed.innerText = formatNum(mempool.unconfirmed);

  $unconfirmed.className =
    mempool.unconfirmed < 1e4
      ? "low"
      : mempool.unconfirmed < 1e5
      ? "mid"
      : "high";

  setTimeout(watchMempool, 5000);
};

watchMempool();

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const formatPercentageChange = (startPrice, currentPrice) => {
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

const watch = () => {
  if (!$price || !$last24h) {
    return;
  }

  const socket = new WebSocket("wss://ws-feed.pro.coinbase.com/");

  socket.addEventListener("open", (event) => {
    socket.send(
      JSON.stringify({
        type: "subscribe",
        channels: [{ name: "ticker_1000", product_ids: ["BTC-USD"] }],
      })
    );

    socket.send(
      JSON.stringify({
        type: "subscribe",
        channels: [{ name: "matches", product_ids: ["BTC-USD"] }],
      })
    );
  });

  socket.addEventListener("close", async () => {
    await delay(1000);
    watch();
  });

  socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);

    if (!["ticker", "match", "last_match"].includes(data.type)) {
      return;
    }

    const price = Number(data.price);
    const formattedPrice = formatPrice(price);

    switch (data.type) {
      case "ticker": {
        open24h = Number(data.open_24h);

        document.title = `BTC: ${formattedPrice} | ${formatPercentageChange(
          open24h,
          price
        )}`;

        break;
      }

      case "match":
      case "last_match": {
        $price.innerText = formattedPrice;

        $feeLowUSD.innerText = getAverageTXCost(mempool.fees.low, price);
        $feeMidUSD.innerText = getAverageTXCost(mempool.fees.mid, price);
        $feeHighUSD.innerText = getAverageTXCost(mempool.fees.high, price);

        if (prevPrice !== 0) {
          $price.className = price < prevPrice ? "down" : "up";

          const change = formatPercentageChange(open24h, price);
          $last24h.innerText = change;
          $last24h.className = change.startsWith("-")
            ? "down"
            : change.startsWith("+")
            ? "up"
            : "";
        }

        prevPrice = price;
        break;
      }
    }
  });
};

if (localStorage.getItem("mode") === "light") {
  document.body.classList.toggle("light");
}

document.getElementById("mode").addEventListener("click", () => {
  document.body.classList.toggle("light");
  localStorage.setItem(
    "mode",
    document.body.classList.contains("light") ? "light" : "dark"
  );
});

watch();
