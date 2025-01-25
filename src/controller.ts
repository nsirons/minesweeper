import { Model } from "./model.js";
import { View } from "./view.js";

export class Controller {
  private model: Model;
  private view: View;
  private refreshTimer: number | null;

  constructor() {
    this.model = new Model();
    this.view = new View();
    this.view.render(this.model.getState());
    this.refreshTimer = null;
    this.startTimer();
    this.view.startGameDefaultButton.forEach((button) => {
      button.addEventListener("click", () => {
        this.startGameDefault(
          parseInt(button.getAttribute("data-width")!),
          parseInt(button.getAttribute("data-height")!),
          parseInt(button.getAttribute("data-mines")!)
        );
      });
    });

    this.view.startGameCustomButton.addEventListener("click", () => {
      this.startGameCustom();
    });

    this.view.gameBoardDiv.addEventListener("click", (e) => {
      this.handleCellClick(e as MouseEvent);
    });

    this.view.gameBoardDiv.addEventListener("contextmenu", (e) => {
      e.preventDefault(); // Prevent context menu from appearing
      this.handleCellRightClick(e as MouseEvent);
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

  startGameDefault(width: number, height: number, mines: number) {
    this.model.startGame(width, height, mines);
    this.view.render(this.model.getState());
  }

  startGameCustom() {
    const width: number = parseInt(this.view.widthInputField.value);
    const height: number = parseInt(this.view.heightInputField.value);
    const mines: number = parseInt(this.view.minesInputField.value);
    this.model.startGame(width, height, mines);
    this.view.render(this.model.getState());
  }

  handleCellClick(e: MouseEvent) {
    const [x, y] = this.getMousePosition(e);
    if (x !== -1 && y !== -1) {
      this.model.revealCell([x, y]).then(() => {
        this.view.render(this.model.getState())
      });
      this.view.render(this.model.getState());
    }
  }

  handleCellRightClick(event: MouseEvent) {
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
    } else {
      this.view.deactivateProbabilityButton();
    }
  }

  private getMousePosition(event: MouseEvent): [number, number] {
    const cell = (event.target as HTMLElement).closest(".grid-item");
    if (!cell) return [-1, -1];

    const x = parseInt(cell.getAttribute("data-x") || "-1");
    const y = parseInt(cell.getAttribute("data-y") || "-1");

    return [x, y];
  }

  private startTimer() {
    this.refreshTimer = window.setInterval(() => {
      this.view.renderTime(this.model.getState().time);
    }, 1000);
  }
}
