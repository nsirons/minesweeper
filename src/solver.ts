import { Board } from "./board.js";
import { FieldType, cellIsANumber, CELL_TO_NUMBER } from "./msTypes.js";


export class Solver {
  private boardCurrent: FieldType[][];
  private width: number;
  private height: number;
  private mineProbability: number[][];
  private minesLeftCalculated: number;
  private detachedCells: Set<string>;
  private isProbabilityCalculated: boolean;

  constructor(board: Board) {
    this.boardCurrent = board.getBoardRepr();
    [this.width, this.height] = board.getDimensions();
    this.minesLeftCalculated = board.getNumberOfMines();
    this.mineProbability = this.boardCurrent.map((row) =>
      row.map((cell) => (cell === FieldType.MINE ? 1 : 0.0))
    );
    this.isProbabilityCalculated = false;
    this.detachedCells = new Set(
      Array.from({ length: this.height }, (_, i) =>
        Array.from({ length: this.width }, (_, j) => `${i},${j}`)
      ).flat()
    );
    this.updateDetachedCells();

  }

  public async updateBoard(board: FieldType[][]): Promise<void> {
    for (let i = 0; i < this.height; i++) {
      for (let j = 0; j < this.width; j++) {
        if (board[i][j] !== FieldType.UNKNOWN && board[i][j] !== FieldType.FLAG) {
          this.boardCurrent[i][j] = board[i][j];
          this.mineProbability[i][j] =
            board[i][j] === FieldType.MINE ? 1.0 : 0.0;
        }
      }
      this.updateDetachedCells();
    }

    await this.solve();
  }

  private async solve(): Promise<void> {

    let updateStack = this.basicStrategy();
    while (updateStack.length > 0) {
      for (const [x, y, fieldType] of updateStack) {
        if (fieldType === FieldType.NUMBER) {
          this.boardCurrent[x][y] = FieldType.NUMBER;
          this.mineProbability[x][y] = 0.0;
        } else if (fieldType === FieldType.MINE_CALCULATED && !(this.boardCurrent[x][y] === FieldType.MINE_CALCULATED || this.boardCurrent[x][y] === FieldType.MINE)) {
          this.boardCurrent[x][y] = FieldType.MINE_CALCULATED;
          this.mineProbability[x][y] = 1.0;
          this.minesLeftCalculated--;
        }
      }
      updateStack = this.basicStrategy();
    }

    const perimeters = this.getPerimeters();

    let f: number = 1;
    const idxMapArray: { [key: number]: [number, number] }[] = [];
    const solutionArray: string[][] = [];
    for (const perimeter of perimeters) {
      const [A, b, idxToLoc] = this.getEquation(perimeter);
      if (A.length === 0) {
        continue;
      }
      const solutionList = await this.solvingBin(A, b);

      if (solutionList.length === 0) {
        continue;
      }

      solutionArray.push(solutionList);
      idxMapArray.push(idxToLoc);

      f *= solutionList.length;
      const nBits = A[0].length;
      let commonMine = Math.pow(2, nBits) - 1;
      let commonEmpty = Math.pow(2, nBits) - 1;

      for (const solution of solutionList) {
        commonMine &= parseInt(solution, 2);
        commonEmpty &= ~parseInt(solution, 2);
      }

      const commonEmptyBin = commonEmpty.toString(2).padStart(nBits, "0");
      const commonMineBin = commonMine.toString(2).padStart(nBits, "0");

      for (let i = 0; i < nBits; i++) {
        const [x, y] = idxToLoc[i];
        if (commonEmptyBin[i] === "1") {
          this.mineProbability[x][y] = 0.0;
          this.boardCurrent[x][y] = FieldType.NUMBER;
        } else if (commonMineBin[i] === "1" && !(this.boardCurrent[x][y] === FieldType.MINE_CALCULATED || this.boardCurrent[x][y] === FieldType.MINE)) {
          this.mineProbability[x][y] = 1.0;
          this.boardCurrent[x][y] = FieldType.MINE_CALCULATED;
          this.minesLeftCalculated--;
        }
      }
    }

    // Calculate the probability of mines on the board using arrangements
    let total = 0;
    const globalMineProbability = this.boardCurrent.map((row) =>
      row.map((cell) => -1)
    );

    let expectedNumberOfMinesOnPerimeter = 0;
    const detachedCells = this.getNumberOfDetachedCells();

    const dfsSolutions = (level: number, currentSolutionArray: string[]) => {
      if (level === solutionArray.length) {
        let minesUsed = 0;
        const cellLocation: [number, number][] = [];
        for (let i = 0; i < currentSolutionArray.length; i++) {
          const solution: string = currentSolutionArray[i];
          minesUsed += solution.split('').filter((x: string) => x === '1').length;
          const idxMap: { [key: number]: [number, number] } = idxMapArray[i];
          for (const [idx, loc] of Object.entries(idxMap)) {
            if (solution.charAt(parseInt(idx)) === '1') {
              cellLocation.push(loc);
            }
          }
        }
        
        // this should not be possible
        if  (this.minesLeftCalculated - minesUsed < 0) {
          return;
        }
        const possibleCount = this.nCr(detachedCells, this.minesLeftCalculated - minesUsed);
        total += possibleCount;
        for (const cell of cellLocation) {
          globalMineProbability[cell[0]][cell[1]] += possibleCount;
        }

        expectedNumberOfMinesOnPerimeter += minesUsed * possibleCount;
        return;
      }

      for (const solution of solutionArray[level]) {
        currentSolutionArray.push(solution);
        dfsSolutions(level + 1, currentSolutionArray);
        currentSolutionArray.pop();
      }
    }

    dfsSolutions(0, []);

    for (let i = 0; i < this.height; i++) {
      for (let j = 0; j < this.width; j++) {
        if (!(this.boardCurrent[i][j] === FieldType.UNKNOWN || this.boardCurrent[i][j] === FieldType.FLAG)) {
          continue;
        }
        if (globalMineProbability[i][j] === -1) {
          this.mineProbability[i][j] = (this.minesLeftCalculated - (expectedNumberOfMinesOnPerimeter / total)) / this.getNumberOfDetachedCells();
        } else {
          this.mineProbability[i][j] = (globalMineProbability[i][j] + 1) / total;
        }
      }
    }
  }

  async getProbabilities(): Promise<number[][]> {
    if (!this.isProbabilityCalculated) {
      this.isProbabilityCalculated = true;
      await this.solve();
    }
    return this.mineProbability;
  }

  private basicStrategy(): [number, number, FieldType][] {
    const updateStack: [number, number, FieldType][] = [];

    for (let x = 0; x < this.height; x++) {
      for (let y = 0; y < this.width; y++) {
        const cell: FieldType = this.boardCurrent[x][y];
        if (!cellIsANumber(cell)) continue;

        let numMinesNeighbours = CELL_TO_NUMBER[cell];
        let numUnknownNeighbours = 0;
        let numMinesDiscovered = 0;
        const unknownNeighbours: [number, number][] = [];

        for (const [dx, dy] of Board.ALL_MOVES) {
          const nx = x + dx;
          const ny = y + dy;
          if (this.isValidCell(nx, ny)) {
            if (this.boardCurrent[nx][ny] === FieldType.UNKNOWN || this.boardCurrent[nx][ny] === FieldType.FLAG) {
              numUnknownNeighbours++;
              unknownNeighbours.push([nx, ny]);
            } else if (this.boardCurrent[nx][ny] === FieldType.MINE || this.boardCurrent[nx][ny] === FieldType.MINE_CALCULATED) {
              numMinesDiscovered++;
            }
          }
        }

        if (numMinesDiscovered === numMinesNeighbours) {
          for (const [nx, ny] of unknownNeighbours) {
            updateStack.push([nx, ny, FieldType.NUMBER]);
          }
        } else if (numUnknownNeighbours === numMinesNeighbours - numMinesDiscovered) {
          for (const [nx, ny] of unknownNeighbours) {
            updateStack.push([nx, ny, FieldType.MINE_CALCULATED]);
          }
        }
      }
    }
    return updateStack;
  }

  private getPerimeters(): [number, number][][] {
    const visitedMask = Array.from({ length: this.height }, () =>
      Array.from({ length: this.width }, () => false)
    );

    let perimeterList: Set<string>[] = [];

    for (let i = 0; i < this.height; i++) {
      for (let j = 0; j < this.width; j++) {
        if ((cellIsANumber(this.boardCurrent[i][j]) || this.boardCurrent[i][j] === FieldType.EMPTY) || visitedMask[i][j] || !this.adjacentToSolid(i, j)) continue;

        const perimeter: Set<string> = new Set();
        const stack: [number, number][] = [[i, j]];
        while (stack.length > 0) {
          const [x, y] = stack.shift()!;
          visitedMask[x][y] = true;

          const canGo: Set<string> = new Set();
          for (const [dx, dy] of Board.ALL_MOVES) {
            const nx = x + dx;
            const ny = y + dy;
            if (this.isValidCell(nx, ny) && cellIsANumber(this.boardCurrent[nx][ny])) {
              if (Math.abs(dx) + Math.abs(dy) == 1) {
                if (Math.abs(dx) == 1) {
                  canGo.add(`${0},${1}`);
                  canGo.add(`${0},${-1}`);
                } else {
                  canGo.add(`${1},${0}`);
                  canGo.add(`${-1},${0}`);
                }
              } else {
                canGo.add(`${dx},${0}`);
                canGo.add(`${0},${dy}`);
              }
              perimeter.add(`${nx},${ny}`);
            }
          }


          for (const dir of canGo) {
            const [dx, dy] = dir.split(',').map(Number);
            const nx = x + dx;
            const ny = y + dy;
            if (this.isValidCell(nx, ny) && !visitedMask[nx][ny] && this.adjacentToSolid(nx, ny) && (this.boardCurrent[nx][ny] == FieldType.UNKNOWN || this.boardCurrent[nx][ny] == FieldType.FLAG || this.boardCurrent[nx][ny] == FieldType.MINE || this.boardCurrent[nx][ny] == FieldType.MINE_CALCULATED)) {
              stack.push([nx, ny]);
              visitedMask[nx][ny] = true;
            }
          }
        }

        const overlap: number[] = [];
        for (const coord of perimeter) {
          let idx = 0;
          for (const otherPerimeter of perimeterList) {
            if (otherPerimeter.has(coord)) {
              overlap.push(idx);
            }
            idx++;
          }
        }

        for (const idx of overlap) {
          perimeterList[idx].forEach(coord => perimeter.add(coord));
        }

        perimeterList = perimeterList.filter((_, idx) => !overlap.includes(idx));
        perimeterList.push(perimeter);
      }
    }
    return perimeterList.map(perimeter => Array.from(perimeter).map(coord => {
      const [x, y] = coord.split(',').map(Number);
      return [x, y];
    }));
  }

  private getEquation(perimeter: [number, number][]): [number[][], number[], { [key: number]: [number, number] }] {
    const A: number[][] = [];
    const b: number[] = [];
    let maxLenA = 0;
    const locToIdx: { [key: string]: number } = {};
    let AMatrixIdx = 0;

    for (const [x, y] of perimeter) {
      b.push(CELL_TO_NUMBER[this.boardCurrent[x][y]]);
      A.push(Array(maxLenA).fill(0));

      for (const [dx, dy] of Board.ALL_MOVES) {
        const nx = x + dx;
        const ny = y + dy;
        if (this.isValidCell(nx, ny)) {
          if (
            this.boardCurrent[nx][ny] === FieldType.MINE_CALCULATED ||
            this.boardCurrent[nx][ny] === FieldType.MINE
          ) {
            b[b.length - 1]--;
          } else if (this.boardCurrent[nx][ny] === FieldType.UNKNOWN || this.boardCurrent[nx][ny] === FieldType.FLAG) {
            const key = `${nx},${ny}`;
            if (!(key in locToIdx)) {
              locToIdx[key] = AMatrixIdx++;
              maxLenA++;
              A[A.length - 1].push(0);
            }
            const idx = locToIdx[key];
            A[A.length - 1][idx] = 1;
          }
        }
      }
    }

    // Pad arrays to make them equal length
    const Afinal: number[][] = [];
    const bfinal: number[] = [];
    let cnt = -1;
    for (const row of A) {
      cnt++;
      if (row.every((x) => x === 0)) {
        continue;
      }
      const padding = Array.from({ length: maxLenA - row.length }, () => 0);
      Afinal.push([...row, ...padding]);
      bfinal.push(b[cnt]);
    }

    // Create reverse mapping
    const idxToLoc: { [key: number]: [number, number] } = {};
    for (const [loc, idx] of Object.entries(locToIdx)) {
      const [x, y] = loc.split(",").map(Number);
      idxToLoc[idx] = [x, y];
    }
    return [Afinal, bfinal, idxToLoc];
  }

  private async solvingBin(A: number[][], b: number[]): Promise<string[]> {
    if (A.length === 0) {
      return Promise.resolve([]);
    }
    const t1 = performance.now();
    
    const solutions: string[] = [];
    const Ab = A.map((row, i) => [...row, b[i]]);
    const Aechelon = this.toEchelonForm(Ab);
    const Areduced: number[][] = [];
    const breduced: number[] = [];

    // Remove rows with all zeros
    for (let idx = 0; idx < Aechelon.length; idx++) {
      if (Aechelon[idx].every((x, idx) => x === 0 || idx === Aechelon[0].length - 1)) {
        continue;
      }
      Areduced.push(Aechelon[idx].slice(0, -1));
      breduced.push(Aechelon[idx][Aechelon[idx].length - 1]);
    }

    const backtrack = (pos: number, current: number[]) => {
      // if we reached the end, it means all equations are satisfied and we have a solution
      if (pos === Areduced.length) {
        solutions.push(current.join(''));
        return;
      }

      const candidates: [number[], number][] = [];
      candidates.push([current, 0]);
      let knowSum = 0;
      for (let idx = 0; idx < Areduced[pos].length; idx++) {
        const coeff = Areduced[pos][idx];
        // if the coefficient is 0, it means the unknown variable b[idx] is not used in the equation, and there is no point in using it or assuming any value for it
        if (coeff === 0) continue;
        // if the value is already known (from previous equations), we can add it to the sum
        if (current[idx] !== null) {
          knowSum += current[idx] * coeff;
          continue;
        }
        const candSize = candidates.length;
        // for every current candidate, create two new candidates, one with the value 1 and one with the value 0 for the unknown variable at position idx
        for (let i = 0; i < candSize; i++) {
          const [candidate, sum] = candidates.shift()!;
          candidate[idx] = 1;
          candidates.push([candidate.slice(0), sum + coeff]);
          candidate[idx] = 0;
          candidates.push([candidate, sum]);
        }
      }
      for (const [candidate, sum] of candidates) {
        // if equation is satisfied, we can continue to the next equation
        if (sum + knowSum === breduced[pos]) {
          backtrack(pos + 1, candidate);
        }
      }
    }

    backtrack(0, Array(Areduced[0].length).fill(null));

    const t2 = performance.now();
    console.debug("Time to solve: ", t2 - t1);
    return solutions;
  }

  private updateDetachedCells(): void {
    const cellsToRemove: string[] = [];
    for (const pos of this.detachedCells) {
      const [x, y] = pos.split(',').map(Number);
      let isDetachedCell: boolean = true;
      if (!this.isUndiscoveredCell(x, y)) {
        isDetachedCell = false;
      } else {
        for (const [dx, dy] of Board.ALL_MOVES) {
          const nx = x + dx;
          const ny = y + dy;
          if (this.isValidCell(nx, ny) && (cellIsANumber(this.boardCurrent[nx][ny]) || this.boardCurrent[nx][ny] === FieldType.EMPTY)) {
            isDetachedCell = false;
            break;
          }
        }
      }
      if (!isDetachedCell) {
        cellsToRemove.push(`${x},${y}`);
      }
    }

    for (const cellKey of cellsToRemove) {
      this.detachedCells.delete(cellKey);
    }
  }

  private getNumberOfDetachedCells(): number {
    return this.detachedCells.size;
  }

  private isValidCell(x: number, y: number): boolean {
    return x >= 0 && x < this.height && y >= 0 && y < this.width
  }

  private isUndiscoveredCell(x: number, y: number): boolean {
    return this.boardCurrent[x][y] === FieldType.UNKNOWN || this.boardCurrent[x][y] === FieldType.FLAG;
  }

  private nCr(n: number, r: number): number {
    if (r > n) {
      throw new Error("r cannot be greater than n.");
    }
    r = Math.min(r, n - r); // Use symmetry property
    let result = 1;
    for (let i = 0; i < r; i++) {
      result *= (n - i);
      result /= (i + 1);
    }
    return result;
  }

  private adjacentToSolid(x: number, y: number): boolean {
    for (const [dx, dy] of Board.ALL_MOVES) {
      const nx = x + dx;
      const ny = y + dy;
      if (this.isValidCell(nx, ny) && (cellIsANumber(this.boardCurrent[nx][ny]))) {
        return true;
      }
    }
    return false;
  }

  private toEchelonForm(matrix: number[][]): number[][] {
    const rowCount = matrix.length;
    const colCount = matrix[0].length;

    let lead = 0; // The leading column index

    for (let r = 0; r < rowCount; r++) {
      if (lead >= colCount) {
        return matrix;
      }

      let i = r;
      while (matrix[i][lead] === 0) {
        i++;
        if (i === rowCount) {
          i = r;
          lead++;
          if (lead === colCount) {
            return matrix;
          }
        }
      }

      // Swap rows i and r
      [matrix[i], matrix[r]] = [matrix[r], matrix[i]];

      // Normalize the pivot row
      const lv = matrix[r][lead];
      for (let j = 0; j < colCount; j++) {
        matrix[r][j] /= lv;
      }

      // Make all rows below the pivot have a 0 in the current column
      for (let i = 0; i < rowCount; i++) {
        if (i !== r) {
          const lv = matrix[i][lead];
          for (let j = 0; j < colCount; j++) {
            matrix[i][j] -= lv * matrix[r][j];
          }
        }
      }

      lead++;
    }

    return matrix;
  }
}
