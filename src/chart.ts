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
