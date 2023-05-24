import {
  $feeHighUSD,
  $feeLowUSD,
  $feeMidUSD,
  $last24h,
  $price,
  $priceSection,
  $feesSection,
} from "./dom";
import { formatPercentageChange, formatPrice } from "./formatters";
import { getAverageTXCost, delay } from "./helpers";
import type { State } from "./state";

const status = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
};

/**
 * Retrieve and update price information
 */
const watchPrice = async (state: State, wait: number = 1000) => {
  $priceSection.classList.add("loading");
  $feesSection.classList.add("price-loading");

  if (wait > 0) {
    await delay(wait);
  }

  let lastHeartbeat = Date.now();

  const socket = new WebSocket("wss://ws-feed.pro.coinbase.com/");

  socket.addEventListener("open", () => {
    $priceSection.classList.remove("loading");
    $feesSection.classList.remove("price-loading");
    socket.send(
      JSON.stringify({
        type: "subscribe",
        channels: [
          { name: "ticker_1000", product_ids: ["BTC-USD"] },
          { name: "matches", product_ids: ["BTC-USD"] },
          { name: "heartbeat", product_ids: ["BTC-USD"] },
        ],
      })
    );

    window.addEventListener("focus", async () => {
      const msSinceLastHeartbeat = Date.now() - lastHeartbeat;

      if (msSinceLastHeartbeat > 2000) {
        if ([status.CLOSED].includes(socket.readyState)) {
          watchPrice(state);
        } else {
          socket.close();
        }
      }
    });
  });

  socket.addEventListener("close", async () => {
    watchPrice(state);
  });

  socket.addEventListener("error", () => {
    if ([status.CLOSED].includes(socket.readyState)) {
      watchPrice(state);
    } else {
      socket.close();
    }
  });

  socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);

    if (
      !["ticker", "match", "last_match", "error", "heartbeat"].includes(
        data.type
      )
    ) {
      return;
    }

    const price = Number(data.price);

    switch (data.type) {
      case "ticker": {
        state.open24h = Number(data.open_24h);

        document.title = `BTC: ${formatPrice(
          price,
          false
        )} | ${formatPercentageChange(state.open24h, price)}`;

        break;
      }

      case "match":
      case "last_match": {
        $price.innerText = formatPrice(price);

        $feeLowUSD.innerText = getAverageTXCost(state.fees.low, price);
        $feeMidUSD.innerText = getAverageTXCost(state.fees.mid, price);
        $feeHighUSD.innerText = getAverageTXCost(state.fees.high, price);

        if (state.prevPrice !== 0) {
          $price.className = price < state.prevPrice ? "down" : "up";

          const change = formatPercentageChange(state.open24h, price);
          $last24h.innerText = change;
          $last24h.className = change.startsWith("-")
            ? "down"
            : change.startsWith("+")
            ? "up"
            : "";
        }

        state.prevPrice = price;
        break;
      }
      case "heartbeat": {
        lastHeartbeat = Date.now();
        break;
      }
      case "error": {
        socket.close();
        watchPrice(state);

        break;
      }
    }
  });
};

export default watchPrice;
