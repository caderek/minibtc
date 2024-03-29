import WS from "./WS";
import {
  formatBytes,
  formatDuration,
  formatNum,
  formatPercentage,
  formatTimeAgo,
} from "./formatters";
import { getAverageTXCost, getBlocksCount } from "./helpers";
import state, { State } from "./state";
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
  $halvingSection,
  $feeHighUSD,
  $feeLowUSD,
  $feeMidUSD,
  $halvingBlocks,
  $halvingCountdown,
  $halvingDate,
  $blockTime,
  $mempoolCongestion,
  $halvingProgress,
} from "./dom";
import calculateHalvingData from "./halving";

type Block = {
  height: number;
  timestamp: number;
};

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

if (localStorage.getItem("time") === "local") {
  state.display.halving = "local";
}

function formatDate(date: Date) {
  const timeZone = state.display.halving === "local" ? undefined : "UTC";
  const suffix = state.display.halving === "gmt" ? " GMT" : " local";

  return (
    new Intl.DateTimeFormat(state.lang, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone,
    }).format(date) + suffix
  );
}

$halvingDate.addEventListener("click", () => {
  state.display.halving = state.display.halving === "gmt" ? "local" : "gmt";
  localStorage.setItem("time", state.display.halving);

  if (state.halvingDate) {
    $halvingDate.innerText = formatDate(state.halvingDate);
  }
});

function updateHalvingData() {
  if (state.lastBlockHeight === -1) {
    return;
  }

  const {
    blocksToNextHalving,
    estimatedDuration,
    estimatedDate,
    estimatedAverageForCurrentDifficulty,
    currentSubsidy,
    nextSubsidy,
  } = calculateHalvingData(state.averageBlockTime, state.lastBlockHeight);

  $halvingBlocks.innerText = formatNum(blocksToNextHalving);
  $halvingCountdown.innerHTML = estimatedDuration;

  $halvingDate.innerText = formatDate(estimatedDate);

  const progress = formatPercentage(
    (config.HALVING_EPOCH - blocksToNextHalving) / config.HALVING_EPOCH
  );

  $halvingProgress.dataset.title = `Subsidy change: ${
    currentSubsidy / 1e8
  } BTC >> ${nextSubsidy / 1e8} BTC. Progress: ${progress}`;

  state.halvingDate = estimatedDate;
  state.predictedAverageBlockTime = estimatedAverageForCurrentDifficulty;
}

function watchMempool() {
  new WS("wss://mempool.space/api/v1/ws", {
    initialMessages: [
      { action: "init" },
      {
        action: "want",
        data: ["stats", "live-2h-chart", "mempool-blocks", "blocks"],
      },
    ],
    messageHandler(data) {
      const keys = Object.keys(data);

      if (
        keys.length === 0 ||
        (keys.length === 1 && keys[0] === "loadingIndicators")
      ) {
        return;
      }

      if (data.da?.timeAvg) {
        state.averageBlockTime = data.da.timeAvg;
        $averageBlock.innerText = formatTimeAgo(data.da.timeAvg, 1);

        $averageBlock.className =
          data.da.timeAvg <= 540000 || data.da.timeAvg >= 660000
            ? "high"
            : data.da.timeAvg <= 594000 || data.da.timeAvg >= 606000
            ? "mid"
            : "low";
        updateHalvingData();
      }

      if (data.da?.remainingBlocks) {
        const remainingTime = formatDuration(
          data.da.remainingBlocks * state.predictedAverageBlockTime,
          false
        );
        const predictedChange = Intl.NumberFormat("en-US", {
          style: "percent",
          minimumFractionDigits: 2,
          signDisplay: "exceptZero",
        }).format(data.da.difficultyChange / 100);

        $blockTime.dataset.title = `Difficulty adjustment in ${remainingTime}. Predicted change: ${predictedChange}`;
      }

      if (
        (data.blocks && Array.isArray(data.blocks) && data.blocks.length > 0) ||
        data.block
      ) {
        const lastBlock = data.blocks
          ? (data.blocks as Block[]).sort((a, b) => b.height - a.height)[0]
          : (data.block as Block);

        if (
          state.lastBlockHeight !== -1 &&
          lastBlock.height > state.lastBlockHeight
        ) {
          $mempoolSection.classList.add("transit");
          $mempoolSection.classList.add("highlight");

          setTimeout(() => {
            $mempoolSection.classList.remove("highlight");

            setTimeout(() => {
              $mempoolSection.classList.remove("transit");
            }, 500);
          }, 500);
        }

        state.lastBlockHeight = lastBlock.height;
        state.lastBlockTimestamp = lastBlock.timestamp * 1000;

        lastBlockTicker.init(state);
        updateHalvingData();
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
        const backlogTime = formatDuration(
          blocksCount * config.TARGET_BLOCK_TIME,
          false
        );

        $blocks.innerText = String(blocksCount);
        $mempoolCongestion.dataset.title = `Minimum time to clear: ${backlogTime}`;
      }

      if (data.fees) {
        state.fees.low = data.fees.hourFee;
        state.fees.mid = data.fees.halfHourFee;
        state.fees.high = data.fees.fastestFee;

        $feeLow.innerText = String(state.fees.low);
        $feeMid.innerText = String(state.fees.mid);
        $feeHigh.innerText = String(state.fees.high);

        if (state.lastPrice >= 0) {
          $feeLowUSD.innerText = getAverageTXCost(
            state.fees.low,
            state.lastPrice
          );
          $feeMidUSD.innerText = getAverageTXCost(
            state.fees.mid,
            state.lastPrice
          );
          $feeHighUSD.innerText = getAverageTXCost(
            state.fees.high,
            state.lastPrice
          );
        }
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
    },
    ping: {
      isPong(message) {
        return message?.pong === true;
      },
      waitTime: 2000,
      message: { action: "ping" },
    },
    loadingStartAction() {
      $feesSection.classList.add("loading");
      $mempoolSection.classList.add("loading");
      $halvingSection.classList.add("loading");
    },
    loadingEndAction() {
      $feesSection.classList.remove("loading");
      $mempoolSection.classList.remove("loading");
      $halvingSection.classList.remove("loading");
    },
  });
}

export default watchMempool;
