import { State } from "./state.js";
import { GameState, FieldType, cellIsANumber } from "./msTypes.js";

export class View {
    public menuDiv: HTMLElement;
    public gameDiv: HTMLElement;

    public widthInputField: HTMLInputElement;
    public heightInputField: HTMLInputElement;
    public minesInputField: HTMLInputElement;
    public startGameDefaultButton: NodeListOf<HTMLButtonElement>;
    public startGameCustomButton: HTMLButtonElement;

    public gameHeaderDiv: HTMLElement;
    public minesLeftDiv: HTMLElement;
    public timerDiv: HTMLElement;
    public showProbabilityButton: HTMLButtonElement;
    public gameBoardDiv: HTMLElement;
    public gameOutcomeDiv: HTMLElement;
    public gameRestartButton: HTMLButtonElement;
    public gameMenuButton: HTMLButtonElement;

    constructor() {
        this.menuDiv = document.getElementById("menu-container") as HTMLElement;
        this.gameDiv = document.getElementById("game-container") as HTMLElement;
        this.widthInputField = document.getElementById("width") as HTMLInputElement;
        this.heightInputField = document.getElementById(
            "height"
        ) as HTMLInputElement;
        this.minesInputField = document.getElementById("mines") as HTMLInputElement;
        this.startGameDefaultButton =
            document.querySelectorAll(".play-game-default");
        this.startGameCustomButton = document.querySelector(
            ".play-game-custom"
        ) as HTMLButtonElement;

        this.gameHeaderDiv = document.getElementById("game-header") as HTMLElement;
        this.minesLeftDiv = document.getElementById("mines-left") as HTMLElement;
        this.timerDiv = document.getElementById("timer") as HTMLElement;
        this.gameBoardDiv = document.getElementById("game-board") as HTMLElement;
        this.showProbabilityButton = document.getElementById("show-probability-btn") as HTMLButtonElement;
        this.gameOutcomeDiv = document.getElementById(
            "game-outcome"
        ) as HTMLElement;
        this.gameRestartButton = document.getElementById(
            "restart-btn"
        ) as HTMLButtonElement;
        this.gameMenuButton = document.getElementById(
            "menu-btn"
        ) as HTMLButtonElement;
    }

    render(state: State) {
        switch (state.boardState.gameState) {
            case GameState.MENU:
                this.renderMenu();
                break;
            case GameState.INIT:
                this.initGameRender(state);
                break;
            case GameState.PLAYING:
                this.renderGame(state);
                break;
            case GameState.LOST:
                this.renderGame(state);
                this.renderOutcome(state);
                break;
            case GameState.WON:
                this.renderGame(state);
                this.renderOutcome(state);
                break;
        }
    }

    resetGame() {
        this.gameOutcomeDiv.style.display = "none";
        this.gameOutcomeDiv.innerHTML = "";
        this.gameBoardDiv.replaceChildren();
        this.gameOutcomeDiv.classList.remove("win-message", "lose-message");
        this.showProbabilityButton.classList.remove("active");
    }

    renderMenu() {
        this.menuDiv.style.display = "block";
        this.gameDiv.style.display = "none";
    }

    initGameRender(state: State) {
        this.menuDiv.style.display = "none";
        this.gameDiv.style.display = "block";

        this.minesLeftDiv.innerHTML = state.boardState.minesLeft.toString();

        this.gameBoardDiv.replaceChildren();
        this.gameOutcomeDiv.style.display = "none";
        this.gameOutcomeDiv.innerHTML = "";

        let x = 0;
        let y = 0;
        for (let row of state.boardState.gameBoard) {
            y = 0;
            const rowDiv = document.createElement("div");
            rowDiv.classList.add("grid-container");
            rowDiv.style.gridTemplateColumns = `repeat(${state.boardState.gameBoard[0].length}, 1fr)`;
            for (let cell of row) {
                const cellDiv = document.createElement("div");
                cellDiv.id = `cell-${x}-${y}`;
                cellDiv.classList.add("grid-item");
                cellDiv.setAttribute(
                    "data-value",
                    `cell-${cell.valueOf().toLowerCase()}`
                );
                cellDiv.setAttribute("data-x", x.toString());
                cellDiv.setAttribute("data-y", y.toString());
                rowDiv.appendChild(cellDiv);
                y++;
            }
            this.gameBoardDiv.appendChild(rowDiv);
            x++;
        }
    }

    renderGame(state: State) {
        this.menuDiv.style.display = "none";
        this.gameDiv.style.display = "block";

        this.minesLeftDiv.innerHTML = state.boardState.minesLeft.toString();
        this.renderTime(state.time);
        let x = 0;
        let y = 0;
        const showProbability = state.probabilityBoardState !== null;
        for (let row of Array.from(this.gameBoardDiv.children)) {
            y = 0;
            for (let cell of Array.from(row.children)) {
                cell.setAttribute(
                    "data-value",
                    `cell-${state.boardState.gameBoard[x][y].valueOf().toLowerCase()}`
                );
                if (showProbability && state.boardState.gameBoard[x][y] === FieldType.UNKNOWN && state.probabilityBoardState !== null) {
                    (cell as HTMLElement).style.backgroundColor = this.getProbabilityColor(state.probabilityBoardState[x][y]);
                } else if (state.boardState.gameBoard[x][y] === FieldType.FLAG || cellIsANumber(state.boardState.gameBoard[x][y]) || state.boardState.gameBoard[x][y] === FieldType.UNKNOWN || state.boardState.gameBoard[x][y] === FieldType.MINE) {
                    (cell as HTMLElement).style.backgroundColor = "#d3d3d3";
                } else if (state.boardState.gameBoard[x][y] === FieldType.EMPTY) {
                    (cell as HTMLElement).style.backgroundColor = "#c0c0c0";
                } else if (state.boardState.gameBoard[x][y] === FieldType.MINE_SELECTED) {
                    (cell as HTMLElement).style.backgroundColor = "red";
                }
                y++;
            }
            x++;
        }
    }

    renderOutcome(state: State) {
        this.gameOutcomeDiv.style.display = "block";
        this.gameOutcomeDiv.classList.add(
            state.boardState.gameState === GameState.WON ? "win-message" : "lose-message"
        );
        this.gameOutcomeDiv.innerHTML =
            state.boardState.gameState === GameState.WON ? "You won!" : "You lost!";
    }

    activateProbabilityButton() {
        this.showProbabilityButton.classList.add("active");
    }

    deactivateProbabilityButton() {
        this.showProbabilityButton.classList.remove("active");
    }

    private getProbabilityColor(probability: number | null) {
        if (probability === null) {
            probability = -1;
        }
        const hue = (1 - probability) * 240;
        return `hsl(${hue}, 100%, 50%)`;
    }

    renderTime(time: number) {
        this.timerDiv.innerHTML = `${Math.floor(time / 60).toString().padStart(2, '0')}:${(time % 60).toString().padStart(2, '0')}`;
    }
}
