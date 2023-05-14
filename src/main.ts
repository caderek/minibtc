import "./style.css";
import { formatBytes, formatNum, formatPrice } from "./formatters";
// @ts-ignore
import type { PWAInstallElement } from "@khmyznikov/pwa-install";
// @ts-ignore
import isMobile from "is-mobile";

const $price = document.querySelector("#price") as HTMLElement;
const $last24h = document.querySelector("#last24h") as HTMLElement;
const $feeLow = document.querySelector("#fee-low") as HTMLElement;
const $feeMid = document.querySelector("#fee-mid") as HTMLElement;
const $feeHigh = document.querySelector("#fee-high") as HTMLElement;
const $feeLowUSD = document.querySelector("#fee-low-usd") as HTMLElement;
const $feeMidUSD = document.querySelector("#fee-mid-usd") as HTMLElement;
const $feeHighUSD = document.querySelector("#fee-high-usd") as HTMLElement;
const $unconfirmed = document.querySelector("#unconfirmed") as HTMLElement;
const $incoming = document.querySelector("#incoming") as HTMLElement;
const $memory = document.querySelector("#memory") as HTMLElement;
const $install = document.querySelector("#install") as HTMLElement;
const $box = document.querySelector(".box") as HTMLElement;

const AVERAGE_TX_SIZE = 140; // vB
const OPTIMAL_INCOMING = 1670; // vB/s
const INCREASED_INCOMING = 3000; // vB/s

let prevPrice = 0;
let open24h = 0;

const mempool = {
  fees: {
    low: -1,
    mid: -1,
    high: -1,
  },
  unconfirmed: 0,
  incoming: 0,
  memory: 0,
};

const getAverageTXCost = (satPerVB: number, price: number) =>
  satPerVB < 0 ? "-" : formatPrice(satPerVB * AVERAGE_TX_SIZE * (price / 1e8));

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const formatPercentageChange = (startPrice: number, currentPrice: number) => {
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

  socket.addEventListener("open", () => {
    socket.send(JSON.stringify({ action: "init" }));
  });

  socket.addEventListener("open", () => {
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

      $feeLow.innerText = String(mempool.fees.low);
      $feeMid.innerText = String(mempool.fees.mid);
      $feeHigh.innerText = String(mempool.fees.high);
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

  let pong = false;

  const socket = new WebSocket("wss://ws-feed.pro.coinbase.com/");

  socket.addEventListener("open", () => {
    socket.send(
      JSON.stringify({
        type: "subscribe",
        channels: [
          { name: "ticker_1000", product_ids: ["BTC-USD"] },
          { name: "matches", product_ids: ["BTC-USD"] },
        ],
      })
    );

    window.addEventListener("focus", async () => {
      socket.send("ping");
      await delay(1000);

      if (!pong) {
        socket.close();
        watchMempool();
      } else {
        pong = false;
      }
    });
  });

  socket.addEventListener("close", async () => {
    await delay(1000);
    watchMempool();
  });

  socket.addEventListener("error", (error) => {
    socket.close();
    watchMempool();
  });

  socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);

    if (!["ticker", "match", "last_match", "error"].includes(data.type)) {
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
      case "error":
        if (data.message === "Malformed JSON") {
          pong = true;
        } else {
          socket.close();
          watchMempool();
        }

        break;
    }
  });
};

if (localStorage.getItem("mode") === "light") {
  document.body.classList.toggle("light");
}

const toggleDarkMode = () => {
  document.body.classList.toggle("light");
  localStorage.setItem(
    "mode",
    document.body.classList.contains("light") ? "light" : "dark"
  );
};

document.getElementById("mode")!.addEventListener("click", toggleDarkMode);

watchMempool();
watchPrice();

const isStandalone = () => {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as any).standalone === true)
  );
};

if (isMobile() && !isStandalone()) {
  $install.hidden = false;

  setTimeout(() => {
    $install.classList.add("go");
  }, 2000);

  $install.addEventListener("click", () => {
    // @ts-ignore
    import("@khmyznikov/pwa-install").then(() => {
      const $pwaInstall = document.querySelector(
        "pwa-install"
      ) as unknown as PWAInstallElement;

      $pwaInstall.showDialog();
    });
  });
}

if (!isMobile()) {
  const $fullscreen = document.getElementById(
    "fullscreen"
  ) as HTMLButtonElement;

  $fullscreen.hidden = false;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      $box.requestFullscreen();
      $fullscreen.classList.add("off");
    } else {
      document.exitFullscreen();
      $fullscreen.classList.remove("off");
    }
  };

  window.addEventListener("resize", () => {
    if (!document.fullscreenElement) {
      $fullscreen.classList.remove("off");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "F11" || e.key === "f") {
      e.preventDefault();
      toggleFullscreen();
    } else if (e.key === "m") {
      toggleDarkMode();
    }
  });

  $fullscreen.addEventListener("click", toggleFullscreen);
}
