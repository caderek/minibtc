// @ts-nocheck

// fetch(
//   "https://api.pro.coinbase.com/products/BTC-USD/candles?granularity=86400&start=2022-10-07T01%3A59%3A19.284Z&end=2023-08-03T01%3A59%3A19.284Z"
// )
//   .then((r) => r.json())
//   .then(console.log);

class Chart {
  #canvas;
  #ctx;
  constructor(canvas: HTMLCanvasElement) {
    this.#canvas = canvas;
    this.#ctx = canvas.getContext("2d", { alpha: false });
  }

  update(price: number, time: number) {
    this.#draw();
  }

  #draw() {}
}

export default Chart;
