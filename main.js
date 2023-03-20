/**@type {HTMLParagraphElement | null} */
const $price = document.querySelector("#price");
/**@type {HTMLParagraphElement | null} */
const $last24h = document.querySelector("#last24h");

let prevPrice = 0;
let open24h = 0;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const formatPrice = (price) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);

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

watch();
