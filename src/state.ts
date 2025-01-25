import { FieldType, GameState } from "./msTypes.js";

export interface BoardState {
    gameState: GameState;
    gameBoard: FieldType[][];
    minesLeft: number;
}

export interface State {
    boardState: BoardState;
    probabilityBoardState: number[][] | null;
    time: number;
}
