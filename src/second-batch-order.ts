export const secondBatchLines = ['ukulele', 'kalimba', 'recorder', 'drums'] as const;
export type SecondBatchLine = (typeof secondBatchLines)[number];

export function isSecondBatchLine(id: string): id is SecondBatchLine {
  return secondBatchLines.some(line => line === id);
}

export const instrumentStageSize = { 0: 4, 1: 10, 2: 16, 3: 20, 4: 20, 5: 15 } as const;
type Stage = keyof typeof instrumentStageSize;

export const secondBatchId = (line: SecondBatchLine, stage: Stage, position: number) =>
  `${line}-l${stage}-${String(position).padStart(2, '0')}`;

export function secondBatchOrder(line: SecondBatchLine) {
  const hasFourthOriginal = line === 'ukulele' || line === 'drums';
  return {
    0: [secondBatchId(line, 0, 1), `${line}-1`, `${line}-2`, `${line}-3`],
    1: [
      ...(hasFourthOriginal ? [`${line}-4`] : []),
      ...Array.from({ length: hasFourthOriginal ? 9 : 10 }, (_, i) => secondBatchId(line, 1, i + 1)),
    ],
    2: Array.from({ length: instrumentStageSize[2] }, (_, i) => secondBatchId(line, 2, i + 1)),
    3: Array.from({ length: instrumentStageSize[3] }, (_, i) => secondBatchId(line, 3, i + 1)),
    4: Array.from({ length: instrumentStageSize[4] }, (_, i) => secondBatchId(line, 4, i + 1)),
    5: Array.from({ length: instrumentStageSize[5] }, (_, i) => secondBatchId(line, 5, i + 1)),
  };
}
