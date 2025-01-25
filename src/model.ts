import { Board } from "./board.js";
import { Solver } from "./solver.js";
import { GameState } from "./msTypes.js";
import { State } from "./state.js";

export class Model {
    private static readonly TIMER_INTERVAL = 1000;  // ms

    private board: Board;
    private solver: Solver | null;
    private probabilityBoard: number[][] | null;
    private showProbability: boolean;
    private timer: number | null;
    private timeInitial: number;
    private timeCurrent: number;


    constructor() {
        this.board = new Board(0, 0, 0);
        this.solver = null;
        this.probabilityBoard = null;
        this.showProbability = false;
        this.timer = null;
        this.timeInitial = 0;
        this.timeCurrent = 0;
    }

    startGame(width: number, height: number, mines: number) {
        this.showProbability = false;
        this.board = new Board(width, height, mines);
        this.solver = null;
        this.startTimer();
    }

    getBoard() {
        return this.board;
    }

    getState(): State {
        if (this.board.getDimensions()[0] !== 0 && this.board.getDimensions()[1] !== 0) {
            return {
                boardState: this.board.getState(),
                probabilityBoardState: this.showProbability ? this.probabilityBoard : null,
                time: this.timeCurrent,
            };
        }
        return {
            boardState: {
                gameState: GameState.MENU,
                gameBoard: [],
                minesLeft: 0,
            },
            probabilityBoardState: this.showProbability ? this.probabilityBoard : null,
            time: this.timeCurrent,
        };
    }

    async revealCell(pos: [number, number]): Promise<void> {
        const moveDone = this.board?.revealCell(pos) ?? false;
        if (moveDone) {
            if (this.solver == null) {
                this.solver = new Solver(this.board);
                Promise.resolve(this.solver?.getProbabilities()).then((x) => {
                    this.probabilityBoard = x ?? null;
                });
            } else {
                await this.solver.updateBoard(this.board.getBoardRepr()).then(() => {
                    Promise.resolve(this.solver?.getProbabilities()).then((x) => {
                        this.probabilityBoard = x ?? null;
                    });
                });
            }

            
        }
        if (this.board?.getState().gameState !== GameState.PLAYING) {
            this.probabilityBoard = null;
            this.showProbability = false;
            this.stopTimer();
        }
    }

    putFlag(pos: [number, number]) {
        this.board?.putFlag(pos);
    }

    restartGame() {
        const [width, height] = this.board?.getDimensions() ?? [0, 0];
        const mines = this.board?.getNumberOfMines() ?? 0;
        this.board = new Board(width, height, mines);
        this.solver = null;
        this.probabilityBoard = null;
        this.startTimer();
    }

    showMenu() {
        this.board = new Board(0, 0, 0);
        this.solver = null;
    }

    toggleProbability() {
        this.showProbability = !this.showProbability;
        return this.showProbability;
    }

    private resetTime() {
        this.timeInitial = performance.now();
        this.timeCurrent = 0;
    }

    private startTimer() {
        this.stopTimer();   
        this.resetTime();
        this.timer = window.setInterval(() => {
            if (this.board.getState().gameState === GameState.PLAYING) {
                this.timeCurrent = Math.floor((performance.now() - this.timeInitial) / Model.TIMER_INTERVAL);
            } else {
                this.timeCurrent = 0;
                this.timeInitial = performance.now();
            }
        }, Model.TIMER_INTERVAL);
    }

    private stopTimer() {
        if (this.timer) {
            window.clearInterval(this.timer);
            this.timer = null;
        }
    }
}
