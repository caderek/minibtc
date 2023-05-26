import WS from "./WS";
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
import { getAverageTXCost } from "./helpers";
import state from "./state";

function watchPrice() {
  new WS("wss://ws-feed.pro.coinbase.com/", {
    initialMessages: [
      {
        type: "subscribe",
        channels: [
          { name: "ticker_1000", product_ids: ["BTC-USD"] },
          { name: "matches", product_ids: ["BTC-USD"] },
          { name: "heartbeat", product_ids: ["BTC-USD"] },
        ],
      },
    ],
    messageHandler(data) {
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
      }
    },
    heartbeatMaxTime: 2000,
    loadingStartAction() {
      $priceSection.classList.add("loading");
      $feesSection.classList.add("price-loading");
    },
    loadingEndAction() {
      $priceSection.classList.remove("loading");
      $feesSection.classList.remove("price-loading");
    },
  });
}

export default watchPrice;
