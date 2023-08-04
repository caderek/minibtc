import { getLang } from "./helpers";

export type State = {
  prevPrice: number;
  open24h: number;
  fees: {
    low: number;
    mid: number;
    high: number;
  };
  unconfirmed: number;
  incoming: number;
  memory: number;
  lastBlockTimestamp: number;
  lastBlockHeight: number;
  lastPrice: number;
  averageBlockTime: number;
  predictedAverageBlockTime: number;
  halvingDate?: Date;
  display: {
    price: "usd" | "sats";
    halving: "gmt" | "local";
  };
  lang: string;
};

const state: State = {
  prevPrice: 0,
  open24h: 0,
  fees: {
    low: -1,
    mid: -1,
    high: -1,
  },
  unconfirmed: 0,
  incoming: 0,
  memory: 0,
  lastBlockTimestamp: 0,
  lastBlockHeight: -1,
  lastPrice: -1,
  averageBlockTime: 600000,
  predictedAverageBlockTime: 600000,
  display: {
    price: "usd",
    halving: "gmt",
  },
  lang: getLang() === "en-US" ? "en-US" : "en-GB",
};

export default state;
