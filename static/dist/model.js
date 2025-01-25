import { Board } from "./board.js";
import { Solver } from "./solver.js";
import { GameState } from "./msTypes.js";
export class Model {
    constructor() {
        this.board = new Board(0, 0, 0);
        this.solver = null;
        this.probabilityBoard = null;
        this.showProbability = false;
        this.timer = null;
        this.timeInitial = 0;
        this.timeCurrent = 0;
    }
    startGame(width, height, mines) {
        this.showProbability = false;
        this.board = new Board(width, height, mines);
        this.solver = null;
        this.startTimer();
    }
    getBoard() {
        return this.board;
    }
    getState() {
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
    async revealCell(pos) {
        var _a, _b, _c, _d;
        const moveDone = (_b = (_a = this.board) === null || _a === void 0 ? void 0 : _a.revealCell(pos)) !== null && _b !== void 0 ? _b : false;
        if (moveDone) {
            if (this.solver == null) {
                this.solver = new Solver(this.board);
                Promise.resolve((_c = this.solver) === null || _c === void 0 ? void 0 : _c.getProbabilities()).then((x) => {
                    this.probabilityBoard = x !== null && x !== void 0 ? x : null;
                });
            }
            else {
                await this.solver.updateBoard(this.board.getBoardRepr()).then(() => {
                    var _a;
                    Promise.resolve((_a = this.solver) === null || _a === void 0 ? void 0 : _a.getProbabilities()).then((x) => {
                        this.probabilityBoard = x !== null && x !== void 0 ? x : null;
                    });
                });
            }
        }
        if (((_d = this.board) === null || _d === void 0 ? void 0 : _d.getState().gameState) !== GameState.PLAYING) {
            this.probabilityBoard = null;
            this.showProbability = false;
            this.stopTimer();
        }
    }
    putFlag(pos) {
        var _a;
        (_a = this.board) === null || _a === void 0 ? void 0 : _a.putFlag(pos);
    }
    restartGame() {
        var _a, _b, _c, _d;
        const [width, height] = (_b = (_a = this.board) === null || _a === void 0 ? void 0 : _a.getDimensions()) !== null && _b !== void 0 ? _b : [0, 0];
        const mines = (_d = (_c = this.board) === null || _c === void 0 ? void 0 : _c.getNumberOfMines()) !== null && _d !== void 0 ? _d : 0;
        this.board = new Board(width, height, mines);
        this.solver = null;
        this.probabilityBoard = null;
        this.startTimer();
        console.log(this.getState());
    }
    showMenu() {
        this.board = new Board(0, 0, 0);
        this.solver = null;
    }
    toggleProbability() {
        this.showProbability = !this.showProbability;
        return this.showProbability;
    }
    resetTime() {
        this.timeInitial = performance.now();
        this.timeCurrent = 0;
    }
    startTimer() {
        this.stopTimer();
        this.resetTime();
        this.timer = window.setInterval(() => {
            if (this.board.getState().gameState === GameState.PLAYING) {
                this.timeCurrent = Math.floor((performance.now() - this.timeInitial) / Model.TIMER_INTERVAL);
            }
            else {
                this.timeCurrent = 0;
                this.timeInitial = performance.now();
            }
        }, Model.TIMER_INTERVAL);
    }
    stopTimer() {
        if (this.timer) {
            window.clearInterval(this.timer);
            this.timer = null;
        }
    }
}
Model.TIMER_INTERVAL = 1000; // ms
