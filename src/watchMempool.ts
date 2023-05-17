import { formatBytes, formatNum } from "./formatters";
import { delay, getBlocksCount } from "./helpers";
import type { State } from "./state";
import config from "./config";
import {
  $blocks,
  $feeHigh,
  $feeLow,
  $feeMid,
  $incoming,
  $memory,
  $unconfirmed,
} from "./dom";

/**
 * Retrieve and update mempool and fee information
 */
const watchMempool = (state: State) => {
  let pong = false;

  const socket = new WebSocket("wss://mempool.space/api/v1/ws");

  socket.addEventListener("open", () => {
    socket.send(JSON.stringify({ action: "init" }));
  });

  socket.addEventListener("open", () => {
    socket.send(
      JSON.stringify({
        action: "want",
        data: ["stats", "live-2h-chart", "mempool-blocks"],
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
