import { Pair } from "./Pair.js";
import { MinesweeperState } from "./MinesweeperState.js";
class Rat {
  static ZERO = new Rat(0n, 1n);
  static ONE = new Rat(1n, 1n);
  #num;
  #den;
  static #abs(x) {
    return x < 0n ? -x : x;
  }
  static #gcd(a, b) {
    a = Rat.#abs(a);
    b = Rat.#abs(b);
    while (b !== 0n) {
      const t = a % b;
      a = b;
      b = t;
    }
    return a;
  }
  constructor(num, den) {
    if (den === 0n) throw new Error("denominator is zero");
    if (den < 0n) {
      num = -num;
      den = -den;
    }
    if (num === 0n) {
      this.#num = 0n;
      this.#den = 1n;
    } else {
      const g = Rat.#gcd(num, den);
      this.#num = num / g;
      this.#den = den / g;
    }
  }
  getNum() {
    return this.#num;
  }
  getDen() {
    return this.#den;
  }
  static of(x) {
    return new Rat(x, 1n);
  }
  isZero() {
    return this.#num === 0n;
  }
  isOne() {
    return this.#num === this.#den;
  }
  isInteger() {
    return this.#den === 1n;
  }
  toBigInt() {
    return this.#num / this.#den;
  }
  neg() {
    return new Rat(-this.#num, this.#den);
  }
  add(o) {
    const n = this.#num * o.#den + o.#num * this.#den;
    const d = this.#den * o.#den;
    return new Rat(n, d);
  }
  sub(o) {
    return this.add(o.neg());
  }
  mul(o) {
    let a = this.#num,
      b = this.#den,
      c = o.#num,
      d = o.#den;
    const g1 = Rat.#gcd(Rat.#abs(a), d);
    const g2 = Rat.#gcd(Rat.#abs(c), b);
    a = a / g1;
    d = d / g1;
    c = c / g2;
    b = b / g2;
    return new Rat(a * c, b * d);
  }
  div(o) {
    if (o.#num === 0n) throw new Error("divide by zero");
    return this.mul(new Rat(o.#den, o.#num));
  }
  equals(o) {
    if (!(o instanceof Rat)) return false;
    return this.#num * o.#den === this.#den * o.#num;
  }
  toString() {
    if (this.#den === 1n) return this.#num.toString();
    return `${this.#num.toString()}/${this.#den.toString()}`;
  }
}
class GaussianRREF {
  /**
   * @param {bigint[][]} A
   * @param {bigint[]} b
   * @returns {Rat[][]}
   */
  static rrefAugmented(A, b) {
    const m = A.length;
    const n = m === 0 ? 0 : A[0].length;
    if (b.length !== m)
      throw new Error("b length must equal number of rows in A");
    /** @type {Rat[][]} */
    const M = Array.from({ length: m }, () => new Array(n + 1));
    for (let i = 0; i < m; ++i) {
      if (A[i].length !== n) throw new Error("A must be rectangular");
      for (let j = 0; j < n; ++j) {
        M[i][j] = Rat.of(A[i][j]);
      }
      M[i][n] = Rat.of(b[i]);
    }
    let row = 0;
    for (let col = 0; col < n && row < m; ++col) {
      let piv = -1;
      for (let r = row; r < m; ++r) {
        if (!M[r][col].isZero()) {
          piv = r;
          break;
        }
      }
      if (piv === -1) continue;
      if (piv !== row) {
        const tmp = M[piv];
        M[piv] = M[row];
        M[row] = tmp;
      }
      const pivotVal = M[row][col];
      for (let j = col; j <= n; ++j) {
        M[row][j] = M[row][j].div(pivotVal);
      }
      for (let r = 0; r < m; ++r) {
        if (r === row) continue;
        const factor = M[r][col];
        if (factor.isZero()) continue;
        for (let j = col; j <= n; ++j) {
          M[r][j] = M[r][j].sub(factor.mul(M[row][j]));
        }
      }
      ++row;
    }
    return M;
  }
}
class GaussianEliminationSolver {
  /**
   * @param {number} length
   * @returns {bigint[]}
   */
  static initialize_coefficients(length) {
    return Array.from({ length }, () => 0n);
  }
  /**
   * @param {bigint[][]} A
   * @param {bigint[]} b
   * @returns {Map<number, Rat> | null}
   */
  static get_unique_solutions(A, b) {
    /** @type {Map<number, Rat>} */
    const unique_solutions = new Map();
    const rref = GaussianRREF.rrefAugmented(A, b);
    let current_lower_j = 0;
    for (const rats of rref) {
      for (; current_lower_j < rref[0].length - 1; ++current_lower_j) {
        if (rats[current_lower_j].isOne()) break;
      }
      if (current_lower_j === rref[0].length - 1) {
        if (rats[current_lower_j].isZero()) {
          break;
        } else {
          return null;
        }
      }
      let is_unique = true;
      for (let j = current_lower_j + 1; j < rref[0].length - 1; ++j) {
        if (!rats[j].isZero()) is_unique = false;
      }
      if (is_unique) {
        unique_solutions.set(current_lower_j, rats[rref[0].length - 1]);
      }
      ++current_lower_j;
    }
    return unique_solutions;
  }
  static process_number_point(
    block,
    map,
    prediction_tag,
    number_point,
    visited,
    point_index,
    A,
    b,
  ) {
    const ni0 = number_point.getFirst();
    const nj0 = number_point.getSecond();
    if (!visited[ni0][nj0]) {
      let mines = 0;
      /** @type {number[]} */
      const prediction_point_indices = [];
      for (const unit_vector of MinesweeperState.unit_vectors) {
        const new_i = ni0 + unit_vector[0];
        const new_j = nj0 + unit_vector[1];
        if (
          new_i >= 0 &&
          new_i < map.length &&
          new_j >= 0 &&
          new_j < map[0].length
        ) {
          if (prediction_tag[new_i][new_j]) {
            const key = new Pair(new_i, new_j).toString();
            prediction_point_indices.push(point_index.get(key));
          } else if (MinesweeperState.MINE_FLAG === map[new_i][new_j]) {
            ++mines;
          }
        }
      }
      const total = MinesweeperState.to_number(map[ni0][nj0]) - mines;
      if (0 === total) {
        for (const idx of prediction_point_indices) {
          const coefficients =
            GaussianEliminationSolver.initialize_coefficients(block.length);
          coefficients[idx] = 1n;
          A.push(coefficients);
          b.push(0n);
        }
      } else if (total === prediction_point_indices.length) {
        for (const idx of prediction_point_indices) {
          const coefficients =
            GaussianEliminationSolver.initialize_coefficients(block.length);
          coefficients[idx] = 1n;
          A.push(coefficients);
          b.push(1n);
        }
      } else {
        const coefficients = GaussianEliminationSolver.initialize_coefficients(
          block.length,
        );
        for (const idx of prediction_point_indices) {
          coefficients[idx] = 1n;
        }
        A.push(coefficients);
        b.push(BigInt(total));
      }
      visited[ni0][nj0] = true;
    }
  }
  /**
   * @param {Pair<number, number>[]} block
   * @param {string[][]} map
   * @param {boolean[][]} prediction_tag
   * @returns {Pair<bigint[][], bigint[]>}
   */
  static get_equations_from_block(block, map, prediction_tag) {
    /** @type {Map<string, number>} */
    const point_index = new Map();
    for (let i = 0; i < block.length; ++i) {
      point_index.set(block[i].toString(), i);
    }
    const visited = Array.from({ length: map.length }, () =>
      new Array(map[0].length).fill(false),
    );
    /** @type {bigint[][]} */
    const A = [];
    /** @type {bigint[]} */
    const b = [];
    for (const point of block) {
      const numbers_in_domain = MinesweeperState.get_numbers_in_domain(
        map,
        point.getFirst(),
        point.getSecond(),
      );
      for (const number_point of numbers_in_domain) {
        GaussianEliminationSolver.process_number_point(
          block,
          map,
          prediction_tag,
          number_point,
          visited,
          point_index,
          A,
          b,
        );
      }
    }
    return new Pair(A, b);
  }
  /**
   * @param {Pair<number, number>[]} block
   * @param {string[][]} map
   * @param {boolean[][]} prediction_tag
   * @returns {Array<Pair<Pair<number, number>, string>> | null}
   */
  static get_predictions_from_block(block, map, prediction_tag) {
    /** @type {Array<Pair<Pair<number, number>, string>>} */
    const predictions = [];
    const equations = GaussianEliminationSolver.get_equations_from_block(
      block,
      map,
      prediction_tag,
    );
    const A = equations.getFirst();
    const b = equations.getSecond();
    const unique_solutions = GaussianEliminationSolver.get_unique_solutions(
      A,
      b,
    );
    if (unique_solutions === null) return null;
    for (let i = 0; i < block.length; ++i) {
      if (unique_solutions.has(i)) {
        const point = block[i];
        const solution = unique_solutions.get(i);
        if (solution.isZero()) {
          predictions.push(new Pair(point, MinesweeperState.ZERO));
        } else if (solution.isOne()) {
          predictions.push(new Pair(point, MinesweeperState.ONE));
        } else {
          return null;
        }
      }
    }
    return predictions;
  }
  /**
   * @param {Array<Array<Pair<number, number>>>} blocks
   * @param {string[][]} map
   * @param {boolean[][]} prediction_tag
   * @returns {Array<Pair<Pair<number, number>, string>> | null}
   */
  static get_predictions_from_blocks(blocks, map, prediction_tag) {
    /** @type {Array<Pair<Pair<number, number>, string>>} */
    const predictions = [];
    for (const block of blocks) {
      const pred = GaussianEliminationSolver.get_predictions_from_block(
        block,
        map,
        prediction_tag,
      );
      if (pred === null) {
        return null;
      }
      predictions.push(...pred);
    }
    return predictions;
  }
}
export { Rat, GaussianRREF, GaussianEliminationSolver };
