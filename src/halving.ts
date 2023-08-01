import config from "./config";
import { formatDuration } from "./formatters";

function calculateSubsidy(halvings: number) {
  return Number((50n * 100000000n) >> BigInt(halvings));
}

function calculateCurrentHalving(lastBlockHeight: number) {
  return Math.floor(lastBlockHeight / config.HALVING_EPOCH);
}

// function isAfterLastHalving(lastBlockHeight: number) {
//   return (
//     Math.floor(lastBlockHeight / config.HALVING_EPOCH) >=
//     config.NUMBER_OF_HALVINGS
//   );
// }

function calculateBlocksToHalving(lastBlockHeight: number) {
  const blocksInCurrentHalving = lastBlockHeight % config.HALVING_EPOCH;

  return config.HALVING_EPOCH - blocksInCurrentHalving;
}

function calculateBlocksToDifficultyAdjustment(lastBlockHeight: number) {
  const blocksInCurrentDifficulty = lastBlockHeight % config.DIFFICULTY_EPOCH;

  return config.DIFFICULTY_EPOCH - blocksInCurrentDifficulty;
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
    ((config.DIFFICULTY_EPOCH - blocksInCurrentDifficulty) *
      currentAverageBlockTime +
      blocksInCurrentDifficulty * config.TARGET_BLOCK_TIME) /
      config.DIFFICULTY_EPOCH
  );

  const otherBlocks = blocksToNextHalving - blocksInCurrentDifficulty;

  const timeToHalving =
    blocksInCurrentDifficulty * estimatedAverageForCurrentDifficulty +
    otherBlocks * config.TARGET_BLOCK_TIME;

  const estimatedDate = new Date(Date.now() + timeToHalving);

  const currentHalving = calculateCurrentHalving(lastBlockHeight);

  const data = {
    blocksToNextHalving,
    timeToHalving,
    estimatedDate,
    estimatedDuration: formatDuration(timeToHalving),
    currentSubsidy: calculateSubsidy(currentHalving),
    nextSubsidy: calculateSubsidy(currentHalving + 1),
    estimatedAverageForCurrentDifficulty,
  };

  return data;
}

export default calculateHalvingData;
