export enum FieldType {
    MINE = "mine",
    EMPTY = "empty",
    NUMBER = "number",
    ONE = "one",
    TWO = "two",
    THREE = "three",
    FOUR = "four",
    FIVE = "five",
    SIX = "six",
    SEVEN = "seven",
    EIGHT = "eight",
    UNKNOWN = "unknown",
    FLAG = "flag",
    MINE_WRONG = "mine-wrong",
    MINE_SELECTED = "mine-selected",
    MINE_CALCULATED = "mine-calculated",
}

export const NOT_NUM_TYPES: Set<FieldType> = new Set([
    FieldType.UNKNOWN,
    FieldType.MINE,
    FieldType.FLAG,
    FieldType.EMPTY,
    FieldType.NUMBER,
]);

export const NUM_TO_FIELD_TYPE: { [key: number]: FieldType } = {
    0: FieldType.EMPTY,
    1: FieldType.ONE,
    2: FieldType.TWO,
    3: FieldType.THREE,
    4: FieldType.FOUR,
    5: FieldType.FIVE,
    6: FieldType.SIX,
    7: FieldType.SEVEN,
    8: FieldType.EIGHT,
};

export const CELL_TO_NUMBER: Record<FieldType, number> = {
    [FieldType.ONE]: 1,
    [FieldType.TWO]: 2,
    [FieldType.THREE]: 3,
    [FieldType.FOUR]: 4,
    [FieldType.FIVE]: 5,
    [FieldType.SIX]: 6,
    [FieldType.SEVEN]: 7,
    [FieldType.EIGHT]: 8,
    [FieldType.MINE]: 1000,
    [FieldType.EMPTY]: 1000,
    [FieldType.NUMBER]: 10000,
    [FieldType.UNKNOWN]: 100000,
    [FieldType.FLAG]: 100000,
    [FieldType.MINE_WRONG]: 100000,
    [FieldType.MINE_SELECTED]: 100000,
    [FieldType.MINE_CALCULATED]: 100000,
};

export enum GameState {
    MENU = "M",
    INIT = "I",
    PLAYING = "P",
    WON = "W",
    LOST = "L",
}

export const cellIsANumber = (cell: FieldType): boolean => {
    return (
        cell === FieldType.ONE ||
        cell === FieldType.TWO ||
        cell === FieldType.THREE ||
        cell === FieldType.FOUR ||
        cell === FieldType.FIVE ||
        cell === FieldType.SIX ||
        cell === FieldType.SEVEN ||
        cell === FieldType.EIGHT
    );
};
