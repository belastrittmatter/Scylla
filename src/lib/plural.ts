/** "1 member" / "2 members". */
export const plural = (n: number, word: string) =>
  `${n} ${word}${n === 1 ? "" : "s"}`;
