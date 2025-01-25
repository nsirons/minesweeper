import { FieldType, GameState, NUM_TO_FIELD_TYPE } from "./msTypes.js";
class Cell {
    constructor(fieldTypeActual, fieldTypeVisible) {
        this.fieldTypeActual = fieldTypeActual;
        this.fieldTypeVisible = fieldTypeVisible;
    }
    toString() {
        return this.fieldTypeVisible;
    }
}
export class Board {
    constructor(width, height, mines) {
        this.width = width;
        this.height = height;
        this.mines = mines;
        this.grid = Array.from({ length: this.height }, () => Array.from({ length: this.width }, () => new Cell(FieldType.EMPTY, FieldType.UNKNOWN)));
        this.gameState = GameState.INIT;
        this.numRevealedCells = 0;
        this.minesLeft = mines;
    }
    generateBoard(pos) {
        const allPositions = [];
        for (let i = 0; i < this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                if (i !== pos[0] || j !== pos[1]) {
                    allPositions.push([i, j]);
                }
            }
        }
        // Place mines
        const minePositions = this.getRandomElements(allPositions, this.mines);
        minePositions.forEach(([i, j]) => {
            this.grid[i][j] = new Cell(FieldType.MINE, FieldType.UNKNOWN);
        });
        // Fill the rest of the board
        for (let i = 0; i < this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                if (this.grid[i][j].fieldTypeActual === FieldType.MINE)
                    continue;
                const mineCount = this.countMines(i, j);
                this.grid[i][j] = new Cell(NUM_TO_FIELD_TYPE[mineCount], FieldType.UNKNOWN);
            }
        }
    }
    getRandomElements(arr, n) {
        // Create a copy of the array to avoid modifying the original
        const shuffled = [...arr];
        // Implement Fisher-Yates shuffle
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, n);
    }
    countMines(i, j) {
        return Board.ALL_MOVES.reduce((count, [dx, dy]) => {
            var _a;
            const x = i + dx;
            const y = j + dy;
            if (this.isValidPosition(x, y) &&
                ((_a = this.grid[x][y]) === null || _a === void 0 ? void 0 : _a.fieldTypeActual) === FieldType.MINE) {
                return count + 1;
            }
            return count;
        }, 0);
    }
    isValidPosition(x, y) {
        return x >= 0 && x < this.height && y >= 0 && y < this.width;
    }
    putFlag(pos) {
        if (this.gameState === GameState.INIT) {
            this.generateBoard(pos);
            this.gameState = GameState.PLAYING;
        }
        const [i, j] = pos;
        const cell = this.grid[i][j];
        if (!(cell.fieldTypeVisible === FieldType.UNKNOWN ||
            cell.fieldTypeVisible === FieldType.FLAG))
            return;
        if (this.gameState === GameState.PLAYING) {
            if (this.grid[i][j].fieldTypeVisible === FieldType.FLAG) {
                this.grid[i][j].fieldTypeVisible = FieldType.UNKNOWN;
                this.minesLeft++;
            }
            else {
                this.grid[i][j].fieldTypeVisible = FieldType.FLAG;
                this.minesLeft--;
            }
        }
    }
    revealCell(pos) {
        if (this.gameState === GameState.INIT) {
            this.generateBoard(pos);
            this.gameState = GameState.PLAYING;
        }
        if (this.gameState !== GameState.PLAYING) {
            return false;
        }
        const [i, j] = pos;
        const selectedCell = this.grid[i][j];
        if (selectedCell.fieldTypeVisible !== FieldType.UNKNOWN)
            return false;
        if (selectedCell.fieldTypeActual === FieldType.MINE) {
            this.gameState = GameState.LOST;
            this.revealAll();
            this.grid[i][j].fieldTypeVisible = FieldType.MINE_SELECTED;
            return false;
        }
        else if (selectedCell.fieldTypeActual === FieldType.EMPTY) {
            this.revealEmptyCells(pos);
        }
        else {
            selectedCell.fieldTypeVisible = selectedCell.fieldTypeActual;
            this.numRevealedCells++;
        }
        if (this.numRevealedCells === this.width * this.height - this.mines) {
            this.gameState = GameState.WON;
            this.revealAll();
            return false;
        }
        return true;
    }
    revealEmptyCells(pos) {
        const [i, j] = pos;
        const cell = this.grid[i][j];
        if (!(cell.fieldTypeActual === FieldType.EMPTY))
            return;
        cell.fieldTypeVisible = cell.fieldTypeActual;
        this.numRevealedCells++;
        Board.ALL_MOVES.forEach(([dx, dy]) => {
            const x = i + dx;
            const y = j + dy;
            if (this.isValidPosition(x, y) &&
                this.grid[x][y].fieldTypeVisible === FieldType.UNKNOWN) {
                this.revealCell([x, y]);
            }
        });
    }
    revealAll() {
        for (let i = 0; i < this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                if (this.grid[i][j].fieldTypeActual === FieldType.MINE) {
                    if (this.grid[i][j].fieldTypeVisible === FieldType.FLAG) {
                        this.grid[i][j].fieldTypeVisible = FieldType.FLAG;
                    }
                    else {
                        this.grid[i][j].fieldTypeVisible = FieldType.MINE;
                    }
                }
                else {
                    if (this.grid[i][j].fieldTypeVisible === FieldType.FLAG) {
                        this.grid[i][j].fieldTypeVisible = FieldType.MINE_WRONG;
                    }
                    else {
                        this.grid[i][j].fieldTypeVisible = this.grid[i][j].fieldTypeActual;
                    }
                }
            }
        }
    }
    getBoardRepr() {
        return this.grid.map((row) => row.map((cell) => cell.fieldTypeVisible));
    }
    getDimensions() {
        return [this.width, this.height];
    }
    getNumberOfMines() {
        return this.mines;
    }
    toString() {
        return this.grid
            .map((row) => row.map((cell) => cell.toString()).join(" "))
            .join("\n");
    }
    getState() {
        return {
            gameState: this.gameState,
            gameBoard: this.getBoardRepr(),
            minesLeft: this.minesLeft,
        };
    }
    getCell(pos) {
        return this.grid[pos[0]][pos[1]].fieldTypeVisible;
    }
}
Board.STRAIGHT_MOVES = [[-1, 0], [1, 0], [0, -1], [0, 1],
];
Board.DIAGONAL_MOVES = [[-1, -1], [-1, 1], [1, -1], [1, 1],
];
Board.ALL_MOVES = [
    ...Board.STRAIGHT_MOVES,
    ...Board.DIAGONAL_MOVES,
];
