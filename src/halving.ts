const HALVING_EPOCH = 210000; // halving is at 210000 block
const DIFFICULTY_EPOCH = 2016; // at
// const NUMBER_OF_HALVINGS = 32; // 0-32 50BTC-1SAT
const TARGET_BLOCK_TIME = 600000; // ms, 10 min

import { formatDuration } from "./formatters";

function calculateSubsidy(halvings: number) {
  return Number((50n * 100000000n) >> BigInt(halvings));
}

function calculateCurrentHalving(lastBlockHeight: number) {
  return Math.floor(lastBlockHeight / HALVING_EPOCH);
}

// function isAfterLastHalving(lastBlockHeight: number) {
//   return Math.floor(lastBlockHeight / HALVING_EPOCH) >= NUMBER_OF_HALVINGS;
// }

function calculateBlocksToHalving(lastBlockHeight: number) {
  const blocksInCurrentHalving = lastBlockHeight % HALVING_EPOCH;

  return HALVING_EPOCH - blocksInCurrentHalving;
}

function calculateBlocksToDifficultyAdjustment(lastBlockHeight: number) {
  const blocksInCurrentDifficulty = lastBlockHeight % DIFFICULTY_EPOCH;

  return DIFFICULTY_EPOCH - blocksInCurrentDifficulty;
}

function calculateHalvingData(
  currentAverageBlockTime: number,
  lastBlockHeight: number
) {
  const blocksToNextHalving = calculateBlocksToHalving(lastBlockHeight);

  const blocksInCurrentDifficulty = Math.min(
    blocksToNextHalving,
    calculateBlocksToDifficultyAdjustment(lastBlockHeight)
  );

  const estimatedAverageForCurrentDifficulty = Math.round(
    ((DIFFICULTY_EPOCH - blocksInCurrentDifficulty) * currentAverageBlockTime +
      blocksInCurrentDifficulty * TARGET_BLOCK_TIME) /
      DIFFICULTY_EPOCH
  );

  const otherBlocks = blocksToNextHalving - blocksInCurrentDifficulty;

  const timeToHalving =
    blocksInCurrentDifficulty * estimatedAverageForCurrentDifficulty +
    otherBlocks * TARGET_BLOCK_TIME;

  const estimatedDate = new Date(Date.now() + timeToHalving);

  const currentHalving = calculateCurrentHalving(lastBlockHeight);

  const data = {
    blocksToNextHalving,
    timeToHalving,
    estimatedDate,
    estimatedDateGMT: estimatedDate.toUTCString().slice(0, 22) + " GMT",
    estimatedDuration: formatDuration(timeToHalving),
    currentSubsidy: calculateSubsidy(currentHalving),
    nextSubsidy: calculateSubsidy(currentHalving + 1),
  };

  return data;
}

export default calculateHalvingData;
