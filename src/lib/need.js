// need.js: +need but worse
//

import { BRIDGE_ERROR } from './error';

const needBuilder = fn => obj => {
  if (!obj) {
    fn();
  }
  return obj.caseOf({
    Just: p => p.extract,
    Nothing: fn,
  });
};

// simpler function for inline need.value(thing, () => {})
export const value = (obj, fn) => needBuilder(fn)(obj);

export const details = needBuilder(() => {
  throw new Error(BRIDGE_ERROR.MISSING_POINT_DETAILS);
});

export const web3 = needBuilder(() => {
  throw new Error(BRIDGE_ERROR.MISSING_WEB3);
});

export const contracts = needBuilder(() => {
  throw new Error(BRIDGE_ERROR.MISSING_CONTRACTS);
});

export const wallet = needBuilder(() => {
  throw new Error(BRIDGE_ERROR.MISSING_WALLET);
});

export const urbitWallet = needBuilder(() => {
  throw new Error(BRIDGE_ERROR.MISSING_URBIT_WALLET);
});

export const addressFromWallet = obj => wallet(obj).address;

export const point = needBuilder(() => {
  throw new Error(BRIDGE_ERROR.MISSING_POINT);
});

export const pointCache = needBuilder(() => {
  throw new Error(BRIDGE_ERROR.MISSING_POINT);
});

export const fromPointCache = (cache, point) => {
  if (!(point in cache)) {
    throw new Error(BRIDGE_ERROR.MISSING_POINT);
  }

  return cache[point];
};

export const keystore = obj => {
  const ks = needBuilder(BRIDGE_ERROR.MISSING_KEYSTORE)(obj);
  return ks.value.caseOf({
    Ok: result => result.value,
    Error: _ => {
      throw new Error(BRIDGE_ERROR.MISSING_KEYSTORE);
    },
  });
};
