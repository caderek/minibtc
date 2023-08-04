import { formatPrice } from "./formatters";
import config from "./config";

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const getAverageTXCost = (satPerVB: number, price: number) =>
  satPerVB < 0
    ? "-"
    : formatPrice(satPerVB * config.AVERAGE_TX_SIZE * (price / 1e8));

export const getBlocksCount = (blocks: { blockVSize: number }[]) => {
  if (blocks.length <= 1) {
    return blocks.length;
  }

  const last = Math.ceil(blocks[blocks.length - 1].blockVSize / 1e6);

  return blocks.length - 1 + last;
};

export const getLang = () => {
  if (navigator.languages != undefined) return navigator.languages[0];
  return navigator.language;
};
