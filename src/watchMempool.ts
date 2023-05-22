import { formatBytes, formatNum, formatTimeAgo } from "./formatters";
import { delay, getBlocksCount } from "./helpers";
import type { State } from "./state";
import config from "./config";
import {
  $averageBlock,
  $blocks,
  $feeHigh,
  $feeLow,
  $feeMid,
  $incoming,
  $lastBlock,
  $memory,
  $unconfirmed,
  $feesSection,
  $mempoolSection,
} from "./dom";

const lastBlockTicker = {
  isRunning: false,
  init(state: State) {
    if (this.isRunning) {
      this.update(state);
      return;
    }
    this.isRunning = true;
    this.run(state);
  },
  run(state: State) {
    lastBlockTicker.update(state);
    setTimeout(lastBlockTicker.run, 10000, state);
  },
  update(state: State) {
    const timeSinceLastBlock = Date.now() - state.lastBlockTimestamp;

    $lastBlock.innerText = formatTimeAgo(timeSinceLastBlock);

    $lastBlock.className =
      timeSinceLastBlock <= 1000 * 60 * 10
        ? "low"
        : timeSinceLastBlock <= 1000 * 60 * 30
        ? "mid"
        : "high";
  },
};

/**
 * Retrieve and update mempool and fee information
 */
const watchMempool = (state: State) => {
  let pong = false;

  const socket = new WebSocket("wss://mempool.space/api/v1/ws");
  $feesSection.classList.add("loading");
  $mempoolSection.classList.add("loading");

  socket.addEventListener("open", () => {
    $feesSection.classList.remove("loading");
    $mempoolSection.classList.remove("loading");

    socket.send(JSON.stringify({ action: "init" }));
    socket.send(
      JSON.stringify({
        action: "want",
        data: ["stats", "live-2h-chart", "mempool-blocks", "blocks"],
      })
    );

    window.addEventListener("focus", async () => {
      socket.send(JSON.stringify({ action: "ping" }));
      await delay(1000);

      if (!pong) {
        socket.close();
        watchMempool(state);
      } else {
        pong = false;
      }
    });
  });

  socket.addEventListener("close", async () => {
    await delay(1000);
    watchMempool(state);
  });

  socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    const keys = Object.keys(data);

    if (data.pong) {
      pong = true;
    }

    if (
      keys.length === 0 ||
      (keys.length === 1 && keys[0] === "loadingIndicators")
    ) {
      return;
    }

    if (
      (data.blocks && Array.isArray(data.blocks) && data.blocks.length > 0) ||
      data.block
    ) {
      const lastBlock = data.blocks
        ? data.blocks[data.blocks.length - 1]
        : data.block;

      state.lastBlockTimestamp = lastBlock.timestamp * 1000;

      lastBlockTicker.init(state);
    }

    if (data.da?.timeAvg) {
      $averageBlock.innerText = formatTimeAgo(data.da.timeAvg, 1);

      $averageBlock.className =
        data.da.timeAvg <= 540000 || data.da.timeAvg >= 660000
          ? "high"
          : data.da.timeAvg <= 594000 || data.da.timeAvg >= 606000
          ? "mid"
          : "low";
    }

    if (data.mempoolInfo?.size) {
      state.unconfirmed = data.mempoolInfo.size;
      $unconfirmed.innerText = formatNum(state.unconfirmed);

      const colorClass =
        state.unconfirmed <= 1e4
          ? "low"
          : state.unconfirmed <= 1e5
          ? "mid"
          : "high";

      $unconfirmed.className = colorClass;
      $blocks.className = colorClass;
    }

    if (data["mempool-blocks"]) {
      const blocks = (
        Array.isArray(data["mempool-blocks"]) ? data["mempool-blocks"] : []
      ) as { blockVSize: number }[];

      const blocksCount = getBlocksCount(blocks);

      $blocks.innerText = String(blocksCount);
    }

    if (data.fees) {
      state.fees.low = data.fees.hourFee;
      state.fees.mid = data.fees.halfHourFee;
      state.fees.high = data.fees.fastestFee;

      $feeLow.innerText = String(state.fees.low);
      $feeMid.innerText = String(state.fees.mid);
      $feeHigh.innerText = String(state.fees.high);
    }

    if (data.vBytesPerSecond || data["live-2h-chart"]?.vbytes_per_second) {
      const vBytes =
        data.vBytesPerSecond ?? data["live-2h-chart"].vbytes_per_second;
      state.incoming = vBytes;
      $incoming.innerText = formatNum(state.incoming);

      $incoming.className =
        state.incoming < config.OPTIMAL_INCOMING
          ? "low"
          : state.incoming < config.INCREASED_INCOMING
          ? "mid"
          : "high";
    }

    if (data.mempoolInfo?.usage) {
      state.memory = data.mempoolInfo.usage;
      $memory.innerText = formatBytes(state.memory);

      $memory.className =
        state.memory < 2e8 ? "low" : state.memory < 3e8 ? "mid" : "high";
    }
  });
};

export default watchMempool;
