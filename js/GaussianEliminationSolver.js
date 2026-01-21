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
class BigIntMath {
  static abs(x) {
    return x < 0n ? -x : x;
  }
  static gcd(a, b) {
    a = BigIntMath.abs(a);
    b = BigIntMath.abs(b);
    while (b !== 0n) {
      const t = a % b;
      a = b;
      b = t;
    }
    return a;
  }
  static rowGcd(row) {
    let g = 0n;
    for (const v of row) {
      if (v !== 0n) {
        g = g === 0n ? BigIntMath.abs(v) : BigIntMath.gcd(g, v);
      }
    }
    return g;
  }
  static normalizeRow(row) {
    const g = BigIntMath.rowGcd(row);
    if (g > 1n) {
      for (let i = 0; i < row.length; ++i) row[i] /= g;
    }
    for (const v of row) {
      if (v !== 0n) {
        if (v < 0n) {
          for (let i = 0; i < row.length; ++i) row[i] = -row[i];
        }
        break;
      }
    }
  }
}
class FractionFreeEchelon {
  /**
   * @param {bigint[][]} A
   * @param {bigint[]} b
   * @returns {bigint[][]}
   */
  static echelonAugmented(A, b) {
    const m = A.length;
    const n = m === 0 ? 0 : A[0].length;
    if (b.length !== m)
      throw new Error("b length must equal number of rows in A");
    /** @type {bigint[][]} */
    const M = Array.from({ length: m }, () => new Array(n + 1).fill(0n));
    for (let i = 0; i < m; ++i) {
      if (A[i].length !== n) throw new Error("A must be rectangular");
      for (let j = 0; j < n; ++j) M[i][j] = A[i][j];
      M[i][n] = b[i];
      BigIntMath.normalizeRow(M[i]);
    }
    let row = 0;
    for (let col = 0; col < n && row < m; ++col) {
      let piv = -1;
      for (let r = row; r < m; ++r) {
        if (M[r][col] !== 0n) {
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
      const pivot = M[row][col];
      for (let r = row + 1; r < m; ++r) {
        const a = M[r][col];
        if (a === 0n) continue;
        const g = BigIntMath.gcd(pivot, a);
        const mulRow = pivot / g;
        const mulPivot = a / g;
        for (let j = col; j <= n; ++j) {
          M[r][j] = M[r][j] * mulRow - M[row][j] * mulPivot;
        }
        M[r][col] = 0n;
        BigIntMath.normalizeRow(M[r]);
      }
      BigIntMath.normalizeRow(M[row]);
      ++row;
    }
    return M;
  }
  /**
   * @param {bigint[]} row
   * @returns {number}
   */
  static #pivotCol(row) {
    const n = row.length - 1;
    for (let j = 0; j < n; ++j) {
      if (row[j] !== 0n) return j;
    }
    return -1;
  }
  /**
   * @param {bigint[][]} M
   * @returns {bigint[][]}
   */
  static backEliminateAugmented(M) {
    const m = M.length;
    if (m === 0) return M;
    const n = M[0].length - 1;
    /** @type {number[]} */
    const pivots = new Array(m).fill(-1);
    for (let i = 0; i < m; ++i) {
      pivots[i] = FractionFreeEchelon.#pivotCol(M[i]);
      BigIntMath.normalizeRow(M[i]);
    }
    for (let pr = m - 1; pr >= 0; --pr) {
      const pc = pivots[pr];
      if (pc === -1) continue;
      const pivot = M[pr][pc];
      for (let r = pr - 1; r >= 0; --r) {
        const a = M[r][pc];
        if (a === 0n) continue;
        const g = BigIntMath.gcd(pivot, a);
        const mulRow = pivot / g;
        const mulPivot = a / g;
        for (let j = pc; j <= n; ++j) {
          M[r][j] = M[r][j] * mulRow - M[pr][j] * mulPivot;
        }
        M[r][pc] = 0n;
        BigIntMath.normalizeRow(M[r]);
      }
      BigIntMath.normalizeRow(M[pr]);
    }
    return M;
  }
  /**
   * @param {bigint[][]} A
   * @param {bigint[]} b
   * @returns {bigint[][]}
   */
  static echelonBackEliminateAugmented(A, b) {
    const M = FractionFreeEchelon.echelonAugmented(A, b);
    return FractionFreeEchelon.backEliminateAugmented(M);
  }
}
class BinaryBoundsPropagator {
  static Result = class {
    constructor(forced, inconsistent) {
      this.forced = forced;
      this.inconsistent = inconsistent;
    }
  };
  static propagate(M) {
    const m = M.length;
    if (m === 0) {
      return new BinaryBoundsPropagator.Result(new Map(), false);
    }
    const n = M[0].length - 1;
    const forced = new Map();
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = 0; i < m; ++i) {
        const row = M[i];
        const b = row[n];
        let totalMin = 0n;
        let totalMax = 0n;
        let unknownCount = 0;
        for (let j = 0; j < n; ++j) {
          const a = row[j];
          if (a === 0n) continue;
          unknownCount++;
          if (a > 0n) {
            totalMax = totalMax + a;
          } else {
            totalMin = totalMin + a;
          }
        }
        if (unknownCount === 0) {
          if (b !== 0n) {
            return new BinaryBoundsPropagator.Result(forced, true);
          }
          continue;
        }
        if (b < totalMin || b > totalMax) {
          return new BinaryBoundsPropagator.Result(forced, true);
        }
        for (let k = 0; k < n; ++k) {
          const ak = row[k];
          if (ak === 0n) continue;
          const minExclK = ak < 0n ? totalMin - ak : totalMin;
          const maxExclK = ak > 0n ? totalMax - ak : totalMax;
          const feasible0 = b >= minExclK && b <= maxExclK;
          const target1 = b - ak;
          const feasible1 = target1 >= minExclK && target1 <= maxExclK;
          if (!feasible0 && !feasible1) {
            return new BinaryBoundsPropagator.Result(forced, true);
          } else if (feasible0 && !feasible1) {
            forced.set(k, 0n);
            BinaryBoundsPropagator.substitute(M, k, 0n);
            changed = true;
            break;
          } else if (!feasible0 && feasible1) {
            forced.set(k, 1n);
            BinaryBoundsPropagator.substitute(M, k, 1n);
            changed = true;
            break;
          }
        }
        if (changed) break;
      }
    }
    return new BinaryBoundsPropagator.Result(forced, false);
  }
  static substitute(M, k, val) {
    const m = M.length;
    const n = M[0].length - 1;
    for (let i = 0; i < m; ++i) {
      const ak = M[i][k];
      if (ak === 0n) continue;
      if (val === 1n) {
        M[i][n] = M[i][n] - ak;
      }
      M[i][k] = 0n;
      BigIntMath.normalizeRow(M[i]);
    }
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
  // static get_unique_solutions(A, b) {
  //   /** @type {Map<number, Rat>} */
  //   const unique_solutions = new Map();
  //   const rref = GaussianRREF.rrefAugmented(A, b);
  //   let current_lower_j = 0;
  //   for (const rats of rref) {
  //     for (; current_lower_j < rref[0].length - 1; ++current_lower_j) {
  //       if (rats[current_lower_j].isOne()) break;
  //     }
  //     if (current_lower_j === rref[0].length - 1) {
  //       if (rats[current_lower_j].isZero()) {
  //         break;
  //       } else {
  //         return null;
  //       }
  //     }
  //     let is_unique = true;
  //     for (let j = current_lower_j + 1; j < rref[0].length - 1; ++j) {
  //       if (!rats[j].isZero()) is_unique = false;
  //     }
  //     if (is_unique) {
  //       unique_solutions.set(current_lower_j, rats[rref[0].length - 1]);
  //     }
  //     ++current_lower_j;
  //   }
  //   return unique_solutions;
  // }
  /**
   * @param {bigint[][]} A
   * @param {bigint[]} b
   * @returns {Map<number, Rat> | null}
   */
  static get_unique_solutions(A, b) {
    const M = FractionFreeEchelon.echelonBackEliminateAugmented(A, b);
    const { forced, inconsistent } = BinaryBoundsPropagator.propagate(M);
    if (inconsistent) return null;
    /** @type {Map<number, Rat>} */
    const unique_solutions = new Map();
    for (const [idx, val] of forced.entries()) {
      if (val === 0n) unique_solutions.set(idx, Rat.ZERO);
      else if (val === 1n) unique_solutions.set(idx, Rat.ONE);
      else return null;
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
export {
  Rat,
  GaussianRREF,
  BigIntMath,
  FractionFreeEchelon,
  BinaryBoundsPropagator,
  GaussianEliminationSolver,
};
