export var FieldType;
(function (FieldType) {
    FieldType["MINE"] = "mine";
    FieldType["EMPTY"] = "empty";
    FieldType["NUMBER"] = "number";
    FieldType["ONE"] = "one";
    FieldType["TWO"] = "two";
    FieldType["THREE"] = "three";
    FieldType["FOUR"] = "four";
    FieldType["FIVE"] = "five";
    FieldType["SIX"] = "six";
    FieldType["SEVEN"] = "seven";
    FieldType["EIGHT"] = "eight";
    FieldType["UNKNOWN"] = "unknown";
    FieldType["FLAG"] = "flag";
    FieldType["MINE_WRONG"] = "mine-wrong";
    FieldType["MINE_SELECTED"] = "mine-selected";
    FieldType["MINE_CALCULATED"] = "mine-calculated";
})(FieldType || (FieldType = {}));
export const NOT_NUM_TYPES = new Set([
    FieldType.UNKNOWN,
    FieldType.MINE,
    FieldType.FLAG,
    FieldType.EMPTY,
    FieldType.NUMBER,
]);
export const NUM_TO_FIELD_TYPE = {
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
export const CELL_TO_NUMBER = {
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
export var GameState;
(function (GameState) {
    GameState["MENU"] = "M";
    GameState["INIT"] = "I";
    GameState["PLAYING"] = "P";
    GameState["WON"] = "W";
    GameState["LOST"] = "L";
})(GameState || (GameState = {}));
export const cellIsANumber = (cell) => {
    return (cell === FieldType.ONE ||
        cell === FieldType.TWO ||
        cell === FieldType.THREE ||
        cell === FieldType.FOUR ||
        cell === FieldType.FIVE ||
        cell === FieldType.SIX ||
        cell === FieldType.SEVEN ||
        cell === FieldType.EIGHT);
};
