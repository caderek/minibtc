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
const $incoming = document.querySelector("#incoming");
const $memory = document.querySelector("#memory");

const AVERAGE_TX_SIZE = 140; // vB
const OPTIMAL_INCOMING = 1670; // vB/s
const INCREASED_INCOMING = 3000; // vB/s

let prevPrice = 0;
let open24h = 0;

const mempool = {
  fees: {
    low: null,
    mid: null,
    high: null,
  },
  unconfirmed: null,
  incoming: null,
  memory: null,
};

const formatPrice = (price, showCents = true) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: showCents ? 2 : 0,
  }).format(price);

const formatNum = (price) => new Intl.NumberFormat("en-US").format(price);

const formatBytes = (bytes) => {
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

const getAverageTXCost = (satPerVB, price) =>
  satPerVB === null
    ? "-"
    : formatPrice(satPerVB * AVERAGE_TX_SIZE * (price / 1e8));

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

const watchMempool = () => {
  const socket = new WebSocket("wss://mempool.space/api/v1/ws");

  socket.addEventListener("open", (event) => {
    socket.send(JSON.stringify({ action: "init" }));
  });

  socket.addEventListener("open", (event) => {
    socket.send(
      JSON.stringify({
        action: "want",
        data: ["stats", "live-2h-chart"],
      })
    );
  });

  socket.addEventListener("close", async () => {
    await delay(1000);
    watchMempool();
  });

  socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    const keys = Object.keys(data);

    if (
      keys.length === 0 ||
      (keys.length === 1 && keys[0] === "loadingIndicators")
    ) {
      return;
    }

    if (data.mempoolInfo?.size) {
      mempool.unconfirmed = data.mempoolInfo.size;
      $unconfirmed.innerText = formatNum(mempool.unconfirmed);

      $unconfirmed.className =
        mempool.unconfirmed <= 1e4
          ? "low"
          : mempool.unconfirmed <= 1e5
          ? "mid"
          : "high";
    }

    if (data.fees) {
      mempool.fees.low = data.fees.hourFee;
      mempool.fees.mid = data.fees.halfHourFee;
      mempool.fees.high = data.fees.fastestFee;

      $feeLow.innerText = mempool.fees.low;
      $feeMid.innerText = mempool.fees.mid;
      $feeHigh.innerText = mempool.fees.high;
    }

    if (data.vBytesPerSecond || data["live-2h-chart"]?.vbytes_per_second) {
      const vBytes =
        data.vBytesPerSecond ?? data["live-2h-chart"].vbytes_per_second;
      mempool.incoming = vBytes;
      $incoming.innerText = formatNum(mempool.incoming);

      $incoming.className =
        mempool.incoming < OPTIMAL_INCOMING
          ? "low"
          : mempool.incoming < INCREASED_INCOMING
          ? "mid"
          : "high";
    }

    if (data.mempoolInfo?.usage) {
      mempool.memory = data.mempoolInfo.usage;
      $memory.innerText = formatBytes(mempool.memory);

      $memory.className =
        mempool.memory < 2e8 ? "low" : mempool.memory < 3e8 ? "mid" : "high";
    }
  });
};

const watchPrice = () => {
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
    watchMempool();
  });

  socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);

    if (!["ticker", "match", "last_match"].includes(data.type)) {
      return;
    }

    const price = Number(data.price);

    switch (data.type) {
      case "ticker": {
        open24h = Number(data.open_24h);

        document.title = `BTC: ${formatPrice(
          price,
          false
        )} | ${formatPercentageChange(open24h, price)}`;

        break;
      }

      case "match":
      case "last_match": {
        $price.innerText = formatPrice(price);

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

document.addEventListener("keydown", (e) => {
  if (e.key === "F11") {
    e.preventDefault();
    document.querySelector(".box").requestFullscreen();
  }
});

watchMempool();
watchPrice();
