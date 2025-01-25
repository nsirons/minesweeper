import { Model } from "./model.js";
import { View } from "./view.js";
export class Controller {
    constructor() {
        this.model = new Model();
        this.view = new View();
        this.view.render(this.model.getState());
        this.refreshTimer = null;
        this.startTimer();
        this.view.startGameDefaultButton.forEach((button) => {
            button.addEventListener("click", () => {
                this.startGameDefault(parseInt(button.getAttribute("data-width")), parseInt(button.getAttribute("data-height")), parseInt(button.getAttribute("data-mines")));
            });
        });
        this.view.startGameCustomButton.addEventListener("click", () => {
            this.startGameCustom();
        });
        this.view.gameBoardDiv.addEventListener("click", (e) => {
            this.handleCellClick(e);
        });
        this.view.gameBoardDiv.addEventListener("contextmenu", (e) => {
            e.preventDefault(); // Prevent context menu from appearing
            this.handleCellRightClick(e);
        });
        this.view.gameRestartButton.addEventListener("click", () => {
            this.restartGame();
        });
        this.view.gameMenuButton.addEventListener("click", () => {
            this.showMenu();
        });
        this.view.showProbabilityButton.addEventListener("click", () => {
            this.showProbability();
        });
    }
    startGameDefault(width, height, mines) {
        this.model.startGame(width, height, mines);
        this.view.render(this.model.getState());
    }
    startGameCustom() {
        const width = parseInt(this.view.widthInputField.value);
        const height = parseInt(this.view.heightInputField.value);
        const mines = parseInt(this.view.minesInputField.value);
        this.model.startGame(width, height, mines);
        this.view.render(this.model.getState());
    }
    handleCellClick(e) {
        const [x, y] = this.getMousePosition(e);
        if (x !== -1 && y !== -1) {
            this.model.revealCell([x, y]).then(() => {
                this.view.render(this.model.getState());
            });
            this.view.render(this.model.getState());
        }
    }
    handleCellRightClick(event) {
        const [x, y] = this.getMousePosition(event);
        if (x !== -1 && y !== -1) {
            this.model.putFlag([x, y]);
            this.view.render(this.model.getState());
        }
    }
    restartGame() {
        this.model.restartGame();
        this.view.resetGame();
        this.view.render(this.model.getState());
    }
    showMenu() {
        this.model.showMenu();
        this.view.resetGame();
        this.view.render(this.model.getState());
    }
    showProbability() {
        const isButtonPressed = this.model.toggleProbability();
        this.view.render(this.model.getState());
        if (isButtonPressed) {
            this.view.activateProbabilityButton();
        }
        else {
            this.view.deactivateProbabilityButton();
        }
    }
    getMousePosition(event) {
        const cell = event.target.closest(".grid-item");
        if (!cell)
            return [-1, -1];
        const x = parseInt(cell.getAttribute("data-x") || "-1");
        const y = parseInt(cell.getAttribute("data-y") || "-1");
        return [x, y];
    }
    startTimer() {
        this.refreshTimer = window.setInterval(() => {
            this.view.renderTime(this.model.getState().time);
        }, 1000);
    }
}
