export interface RNG {
  next(): number;
}

export function createSeededRng(seed: number): RNG {
  let state = seed >>> 0;
  return {
    next() {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 0xffffffff;
    },
  };
}

export function createMathRng(): RNG {
  return { next: () => Math.random() };
}
