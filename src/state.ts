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
  lastPrice: number;
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
  lastPrice: -1,
};

export default state;
