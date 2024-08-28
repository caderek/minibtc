import WS from "./WS"
import {
  $feeHighUSD,
  $feeLowUSD,
  $feeMidUSD,
  $last24h,
  $price,
  $priceSection,
  $feesSection,
} from "./dom"
import {
  formatPercentageChange,
  formatPrice,
  formatPriceAsSatsPer$,
} from "./formatters"
import { getAverageTXCost } from "./helpers"
import state from "./state"

if (localStorage.getItem("price") === "sats") {
  state.display.price = "sats"
}

function displayPrice() {
  $price.innerText =
    state.display.price === "sats"
      ? formatPriceAsSatsPer$(state.lastPrice)
      : formatPrice(state.lastPrice)
}

$price.addEventListener("click", () => {
  state.display.price = state.display.price === "usd" ? "sats" : "usd"
  localStorage.setItem("price", state.display.price)
  displayPrice()
})

function watchPrice() {
  new WS("wss://stream.binance.com/stream", {
    initialMessages: [
      {
        method: "SUBSCRIBE",
        params: [
          "!miniTicker@arr@3000ms",
          // "btcusdt@aggTrade",
          // "btcusdt@depth",
          "btcusdt@kline_1d",
        ],
        id: 1,
      },
    ],
    messageHandler(data) {
      console.log(data)
      if (
        !["!miniTicker@arr@3000ms", "btcusdt@kline_1d"].includes(data.stream)
      ) {
        return
      }

      switch (data.stream) {
        case "!miniTicker@arr@3000ms": {
          const btcUsdt = data.data.find((entry: any) => entry.s === "BTCUSDT")
          const price = Number(btcUsdt.c)
          state.lastPrice = price
          state.open24h = Number(btcUsdt.o)

          document.title = `BTC: ${formatPrice(
            price,
            false,
          )} | ${formatPercentageChange(state.open24h, price)}`

          break
        }

        case "btcusdt@kline_1d": {
          const price = Number(data.data.k.c)
          state.lastPrice = price

          displayPrice()

          $feeLowUSD.innerText = getAverageTXCost(state.fees.low, price)
          $feeMidUSD.innerText = getAverageTXCost(state.fees.mid, price)
          $feeHighUSD.innerText = getAverageTXCost(state.fees.high, price)

          if (state.prevPrice !== 0) {
            $price.className = price < state.prevPrice ? "down" : "up"

            const change = formatPercentageChange(state.open24h, price)
            $last24h.innerText = change
            $last24h.className = change.startsWith("-")
              ? "down"
              : change.startsWith("+")
                ? "up"
                : ""
          }

          state.prevPrice = price
          break
        }
      }
    },
    heartbeatMaxTime: 2000,
    loadingStartAction() {
      $priceSection.classList.add("loading")
      $feesSection.classList.add("price-loading")
    },
    loadingEndAction() {
      $priceSection.classList.remove("loading")
      $feesSection.classList.remove("price-loading")
    },
  })
}

export default watchPrice
