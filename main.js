/**@type {HTMLParagraphElement | null} */
const $price = document.querySelector(".price");

let prevPrice = 0;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const formatPrice = (price) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);

const watch = () => {
  if (!$price) {
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
        document.title = `BTC: ${formattedPrice}`;

        break;
      }

      case "match":
      case "last_match": {
        $price.innerText = formattedPrice;

        if (prevPrice !== 0) {
          if (price < prevPrice) {
            $price.classList.add("sell");
            $price.classList.remove("buy");
          } else {
            $price.classList.add("buy");
            $price.classList.remove("sell");
          }
        }

        prevPrice = price;
        break;
      }
    }
  });
};

watch();
