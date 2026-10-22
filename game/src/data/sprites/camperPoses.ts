import type {PoseSpec} from './camperRig.ts';
/** Hand and leg positions in art pixels. Feet stand on row 31 unless a pose lifts them. */
const STANCE = [
  {hip: 10, foot: 9, footY: 31},
  {hip: 13, foot: 13, footY: 31},
] as const;
const BRACED = [
  {hip: 10, foot: 7, footY: 31},
  {hip: 13, foot: 15, footY: 31},
] as const;
export const camperPoses = {
  // Idle is drawn from the approved grid; this entry only records where the front hand rests.
  idle: [
    {
      bob: 0,
      legs: STANCE,
      hands: [
        [10, 22],
        [15, 22],
      ],
    },
  ],
  run: [
    {
      bob: 0,
      legs: [
        {hip: 10, foot: 7, footY: 31},
        {hip: 13, foot: 15, footY: 31},
      ],
      hands: [
        [18, 21],
        [13, 21],
      ],
      bag: 0,
    },
    {
      bob: 1,
      legs: [
        {hip: 10, foot: 8, footY: 31},
        {hip: 13, foot: 14, footY: 30},
      ],
      hands: [
        [17, 21],
        [14, 22],
      ],
      bag: 1,
    },
    {
      bob: 1,
      legs: [
        {hip: 10, foot: 10, footY: 29},
        {hip: 13, foot: 12, footY: 31},
      ],
      hands: [
        [16, 20],
        [15, 22],
      ],
      bag: 1,
    },
    {
      bob: 0,
      legs: [
        {hip: 10, foot: 15, footY: 31},
        {hip: 13, foot: 7, footY: 31},
      ],
      hands: [
        [13, 21],
        [18, 21],
      ],
      bag: 0,
    },
    {
      bob: 1,
      legs: [
        {hip: 10, foot: 14, footY: 30},
        {hip: 13, foot: 8, footY: 31},
      ],
      hands: [
        [14, 22],
        [17, 21],
      ],
      bag: 1,
    },
    {
      bob: 1,
      legs: [
        {hip: 10, foot: 12, footY: 31},
        {hip: 13, foot: 10, footY: 29},
      ],
      hands: [
        [15, 22],
        [16, 20],
      ],
      bag: 1,
    },
  ],
  fall: [
    {
      bob: 0,
      legs: [
        {hip: 10, foot: 9, footY: 30},
        {hip: 13, foot: 14, footY: 29},
      ],
      hands: [
        [9, 12],
        [20, 12],
      ],
    },
    {
      bob: 0,
      legs: [
        {hip: 10, foot: 8, footY: 29},
        {hip: 13, foot: 15, footY: 30},
      ],
      hands: [
        [10, 15],
        [19, 10],
      ],
    },
  ],
  land: [
    {
      bob: -1,
      legs: [
        {hip: 9, foot: 6, footY: 31},
        {hip: 14, foot: 17, footY: 31},
      ],
      hands: [
        [8, 22],
        [19, 22],
      ],
    },
    {
      bob: 0,
      legs: STANCE,
      hands: [
        [10, 22],
        [17, 21],
      ],
    },
  ],
  cast: [
    {
      bob: 0,
      legs: STANCE,
      hands: [
        [9, 16],
        [12, 12],
      ],
    },
    {
      bob: 0,
      legs: BRACED,
      hands: [
        [11, 17],
        [21, 11],
      ],
    },
    {
      bob: 0,
      legs: BRACED,
      hands: [
        [11, 18],
        [22, 15],
      ],
    },
  ],
  'fish-wait': [
    {
      bob: 0,
      legs: STANCE,
      hands: [
        [10, 22],
        [20, 18],
      ],
    },
    {
      bob: 0,
      legs: STANCE,
      hands: [
        [10, 22],
        [20, 19],
      ],
    },
  ],
  bite: [
    {
      bob: 0,
      legs: BRACED,
      hands: [
        [10, 22],
        [21, 15],
      ],
    },
    {
      bob: 1,
      legs: BRACED,
      hands: [
        [10, 21],
        [22, 12],
      ],
    },
    {
      bob: 0,
      legs: BRACED,
      hands: [
        [10, 22],
        [21, 16],
      ],
    },
  ],
  reel: [
    {
      bob: 0,
      legs: BRACED,
      hands: [
        [10, 22],
        [17, 20],
      ],
    },
    {
      bob: 0,
      legs: BRACED,
      hands: [
        [10, 22],
        [15, 19],
      ],
    },
    {
      bob: 0,
      legs: BRACED,
      hands: [
        [10, 21],
        [17, 18],
      ],
    },
  ],
  gather: [
    {
      bob: 0,
      legs: STANCE,
      hands: [
        [10, 21],
        [19, 15],
      ],
    },
    {
      bob: 1,
      legs: [
        {hip: 10, foot: 8, footY: 31},
        {hip: 13, foot: 16, footY: 31},
      ],
      hands: [
        [10, 22],
        [21, 24],
      ],
    },
    {
      bob: 1,
      legs: [
        {hip: 10, foot: 8, footY: 31},
        {hip: 13, foot: 16, footY: 31},
      ],
      hands: [
        [10, 23],
        [20, 27],
      ],
    },
  ],
  build: [
    {
      bob: 0,
      legs: STANCE,
      hands: [
        [10, 22],
        [20, 14],
      ],
    },
    {
      bob: 0,
      legs: STANCE,
      hands: [
        [10, 22],
        [19, 20],
      ],
    },
    {
      bob: 1,
      legs: STANCE,
      hands: [
        [10, 22],
        [19, 25],
      ],
    },
  ],
} satisfies Record<string, readonly PoseSpec[]>;
