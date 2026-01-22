import { Pair } from "./Pair.js";
import { UnionFindSet } from "./UnionFindSet.js";
import { Graph } from "./Graph.js";
import { RawUnionFindSet } from "./RawUnionFindSet.js";
import { RawGraph } from "./RawGraph.js";
import { GaussianEliminationSolver } from "./GaussianEliminationSolver.js";
class IllegalMapException extends Error {
  constructor(message) {
    super(message);
    this.name = "IllegalMapException";
  }
}
class MinesweeperState {
  static BLANK = "*";
  static QUESTION_MARK = "?";
  static MINE_FLAG = "F";
  static MINE_EXPLODED = "X";
  static MINE_UNFOUND = "U";
  static MINE_WRONGLY_FLAGGED = "W";
  static ZERO = "0";
  static ONE = "1";
  static TWO = "2";
  static THREE = "3";
  static FOUR = "4";
  static FIVE = "5";
  static SIX = "6";
  static SEVEN = "7";
  static EIGHT = "8";
  static unfinished_operands = [
    MinesweeperState.BLANK,
    MinesweeperState.QUESTION_MARK,
  ];
  static lost_operands = [
    MinesweeperState.MINE_EXPLODED,
    MinesweeperState.MINE_UNFOUND,
    MinesweeperState.MINE_WRONGLY_FLAGGED,
  ];
  static operands = [
    MinesweeperState.BLANK,
    MinesweeperState.QUESTION_MARK,
    MinesweeperState.MINE_FLAG,
    MinesweeperState.MINE_EXPLODED,
    MinesweeperState.MINE_UNFOUND,
    MinesweeperState.MINE_WRONGLY_FLAGGED,
    MinesweeperState.ZERO,
    MinesweeperState.ONE,
    MinesweeperState.TWO,
    MinesweeperState.THREE,
    MinesweeperState.FOUR,
    MinesweeperState.FIVE,
    MinesweeperState.SIX,
    MinesweeperState.SEVEN,
    MinesweeperState.EIGHT,
  ];
  static neighborhood = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 0],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];
  static unit_vectors = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];
  static images = null;
  static digits = null;
  #time_passed;
  #remaining_mines;
  #nrows;
  #ncols;
  #map;
  #temp_map;
  #possibility_map;
  #all_points;
  #all_blanks;
  #search_stop_before;
  #force_stopped = false;
  #prediction_tag;
  constructor(time_passed, remaining_mines, map, check = true) {
    if (
      check &&
      !MinesweeperState.check_map_valid(map, remaining_mines, false)
    ) {
      throw new IllegalMapException("The map is invalid.");
    }
    this.#time_passed = time_passed;
    this.#remaining_mines = remaining_mines;
    this.#map = map;
    this.#nrows = map.length;
    this.#ncols = map[0].length;
  }
  reset(map, remaining_mines, time_passed = -1, check = false) {
    if (
      check &&
      !MinesweeperState.check_map_valid(map, remaining_mines, false)
    ) {
      throw new IllegalMapException("The map is invalid.");
    }
    if (time_passed >= 0) {
      this.#time_passed = time_passed;
    }
    this.#remaining_mines = remaining_mines;
    this.#map = map;
    this.#nrows = map.length;
    this.#ncols = map[0].length;
  }
  static is_valid_operand(c) {
    return MinesweeperState.operands.includes(c);
  }
  static is_unfinished_operand(c) {
    return MinesweeperState.unfinished_operands.includes(c);
  }
  static is_lost_operand(c) {
    return MinesweeperState.lost_operands.includes(c);
  }
  static is_number(c) {
    return c >= MinesweeperState.ZERO && c <= MinesweeperState.EIGHT;
  }
  static to_number(c) {
    return c.charCodeAt(0) - "0".charCodeAt(0);
  }
  static check_number_valid(map, i, j, force_finished) {
    if (!MinesweeperState.is_number(map[i][j])) return true;
    let mines = 0;
    let blanks = 0;
    for (const [di, dj] of MinesweeperState.unit_vectors) {
      const ni = i + di,
        nj = j + dj;
      if (ni >= 0 && ni < map.length && nj >= 0 && nj < map[0].length) {
        if (MinesweeperState.MINE_FLAG === map[ni][nj]) ++mines;
        else if (MinesweeperState.is_unfinished_operand(map[ni][nj])) ++blanks;
      }
    }
    const target = MinesweeperState.to_number(map[i][j]);
    if (force_finished && mines !== target) return false;
    return mines <= target && mines + blanks >= target;
  }
  static check_map_valid(map, remaining_mines, force_finished) {
    if (force_finished && remaining_mines !== 0) return false;
    let blanks = 0;
    for (let i = 0; i < map.length; ++i) {
      for (let j = 0; j < map[0].length; ++j) {
        if (MinesweeperState.is_unfinished_operand(map[i][j])) {
          if (force_finished) return false;
          ++blanks;
        }
        if (!MinesweeperState.is_valid_operand(map[i][j])) return false;
        if (!MinesweeperState.check_number_valid(map, i, j, force_finished))
          return false;
      }
    }
    return remaining_mines <= blanks;
  }
  get_status() {
    let started = false;
    let unfinished = false;
    for (let i = 0; i < this.#nrows; ++i) {
      for (let j = 0; j < this.#ncols; ++j) {
        if (MinesweeperState.is_lost_operand(this.#map[i][j])) return "L";
        if (MinesweeperState.is_number(this.#map[i][j])) started = true;
        else if (MinesweeperState.is_unfinished_operand(this.#map[i][j]))
          unfinished = true;
      }
    }
    return started ? (unfinished ? "P" : "W") : "S";
  }
  static get_numbers_in_domain(map, i, j) {
    const numbers = [];
    for (const [di, dj] of MinesweeperState.unit_vectors) {
      const ni = i + di,
        nj = j + dj;
      if (
        ni >= 0 &&
        ni < map.length &&
        nj >= 0 &&
        nj < map[0].length &&
        MinesweeperState.is_number(map[ni][nj])
      ) {
        numbers.push(new Pair(ni, nj));
      }
    }
    return numbers;
  }
  #check_temp_map_position_valid(i, j, force_finished) {
    for (const [di, dj] of MinesweeperState.unit_vectors) {
      const ni = i + di,
        nj = j + dj;
      if (
        ni >= 0 &&
        ni < this.#nrows &&
        nj >= 0 &&
        nj < this.#ncols &&
        MinesweeperState.is_number(this.#map[ni][nj])
      ) {
        if (
          !MinesweeperState.check_number_valid(
            this.#temp_map,
            ni,
            nj,
            force_finished,
          )
        )
          return false;
      }
    }
    return true;
  }
  #check_temp_map_positions_valid(all_points, remaining_mines, force_finished) {
    if (force_finished && 0 !== remaining_mines) {
      return false;
    }
    for (const point of all_points) {
      if (
        !this.#check_temp_map_position_valid(
          point.getFirst(),
          point.getSecond(),
          force_finished,
        )
      ) {
        return false;
      }
    }
    let current_blanks = 0;
    for (let r = 0; r < this.#nrows; ++r) {
      for (let c = 0; c < this.#ncols; ++c) {
        if (MinesweeperState.is_unfinished_operand(this.#temp_map[r][c])) {
          if (force_finished) {
            return false;
          }
          ++current_blanks;
        }
      }
    }
    return 0 <= remaining_mines && remaining_mines <= current_blanks;
  }
  #call_counter = 0;
  #search(
    all_points,
    base_offset,
    point_index,
    remaining_mines,
    number_of_blanks,
    force_finished,
  ) {
    if (this.#force_stopped) return;
    this.#call_counter = this.#call_counter + 1;
    if (0 === (this.#call_counter & 1023)) {
      if (Date.now() > this.#search_stop_before) {
        this.#force_stopped = true;
        return;
      }
      this.#call_counter = 0;
    }
    if (point_index === all_points.length) {
      if (
        this.#check_temp_map_positions_valid(
          all_points,
          remaining_mines,
          force_finished,
        )
      ) {
        for (let i = 0; i < all_points.length; ++i) {
          const pt = all_points[i];
          this.#possibility_map[base_offset + i].add(
            this.#temp_map[pt.getFirst()][pt.getSecond()],
          );
        }
      }
    } else if (0 === remaining_mines) {
      for (let i = point_index; i < all_points.length; ++i)
        this.#temp_map[all_points[i].getFirst()][all_points[i].getSecond()] =
          MinesweeperState.ZERO;
      this.#search(
        all_points,
        base_offset,
        all_points.length,
        0,
        number_of_blanks,
        force_finished,
      );
      for (let i = point_index; i < all_points.length; ++i)
        this.#temp_map[all_points[i].getFirst()][all_points[i].getSecond()] =
          MinesweeperState.BLANK;
    } else if (number_of_blanks - point_index === remaining_mines) {
      for (let i = point_index; i < all_points.length; ++i)
        this.#temp_map[all_points[i].getFirst()][all_points[i].getSecond()] =
          MinesweeperState.MINE_FLAG;
      this.#search(
        all_points,
        base_offset,
        all_points.length,
        0,
        number_of_blanks,
        force_finished,
      );
      for (let i = point_index; i < all_points.length; ++i)
        this.#temp_map[all_points[i].getFirst()][all_points[i].getSecond()] =
          MinesweeperState.BLANK;
    } else {
      const p = all_points[point_index];
      this.#temp_map[p.getFirst()][p.getSecond()] = MinesweeperState.ZERO;
      if (
        this.#check_temp_map_position_valid(p.getFirst(), p.getSecond(), false)
      ) {
        this.#search(
          all_points,
          base_offset,
          point_index + 1,
          remaining_mines,
          number_of_blanks,
          force_finished,
        );
      }
      this.#temp_map[p.getFirst()][p.getSecond()] = MinesweeperState.MINE_FLAG;
      if (
        this.#check_temp_map_position_valid(p.getFirst(), p.getSecond(), false)
      ) {
        this.#search(
          all_points,
          base_offset,
          point_index + 1,
          remaining_mines - 1,
          number_of_blanks,
          force_finished,
        );
      }
      this.#temp_map[p.getFirst()][p.getSecond()] = MinesweeperState.BLANK;
    }
  }
  // #search_iterative(
  //   all_points,
  //   base_offset,
  //   point_index,
  //   remaining_mines,
  //   number_of_blanks,
  //   force_finished,
  // ) {
  //   const stack = [];
  //   stack.push({
  //     kind: "call",
  //     point_index,
  //     remaining_mines,
  //   });
  //   const n = all_points.length;
  //   while (stack.length > 0) {
  //     const frame = stack.pop();
  //     if (frame.kind === "rangeRestore") {
  //       for (let i = frame.start; i < frame.end; ++i) {
  //         const pt = all_points[i];
  //         this.#temp_map[pt.getFirst()][pt.getSecond()] =
  //           MinesweeperState.BLANK;
  //       }
  //       continue;
  //     }
  //     if (frame.kind === "nodeStage") {
  //       const p = all_points[frame.point_index];
  //       const r = p.getFirst();
  //       const c = p.getSecond();
  //       if (frame.stage === 1) {
  //         this.#temp_map[r][c] = MinesweeperState.MINE_FLAG;
  //         if (this.#check_temp_map_position_valid(r, c, false)) {
  //           stack.push({
  //             kind: "nodeStage",
  //             stage: 2,
  //             point_index: frame.point_index,
  //             remaining_mines: frame.remaining_mines,
  //           });
  //           stack.push({
  //             kind: "call",
  //             point_index: frame.point_index + 1,
  //             remaining_mines: frame.remaining_mines - 1,
  //           });
  //         } else {
  //           stack.push({
  //             kind: "nodeStage",
  //             stage: 2,
  //             point_index: frame.point_index,
  //             remaining_mines: frame.remaining_mines,
  //           });
  //         }
  //       } else if (frame.stage === 2) {
  //         this.#temp_map[r][c] = MinesweeperState.BLANK;
  //       }
  //       continue;
  //     }
  //     if (this.#force_stopped) continue;
  //     this.#call_counter = this.#call_counter + 1;
  //     if (0 === (this.#call_counter & 1023)) {
  //       if (Date.now() > this.#search_stop_before) {
  //         this.#force_stopped = true;
  //         continue;
  //       }
  //       this.#call_counter = 0;
  //     }
  //     const idx = frame.point_index;
  //     const mines = frame.remaining_mines;
  //     if (idx === n) {
  //       if (
  //         this.#check_temp_map_positions_valid(
  //           all_points,
  //           mines,
  //           force_finished,
  //         )
  //       ) {
  //         for (let i = 0; i < all_points.length; ++i) {
  //           const pt = all_points[i];
  //           this.#possibility_map[base_offset + i].add(
  //             this.#temp_map[pt.getFirst()][pt.getSecond()],
  //           );
  //         }
  //       }
  //       continue;
  //     }
  //     if (0 === mines) {
  //       for (let i = idx; i < n; ++i) {
  //         const pt = all_points[i];
  //         this.#temp_map[pt.getFirst()][pt.getSecond()] = MinesweeperState.ZERO;
  //       }
  //       stack.push({ kind: "rangeRestore", start: idx, end: n });
  //       stack.push({ kind: "call", point_index: n, remaining_mines: 0 });
  //       continue;
  //     }
  //     if (number_of_blanks - idx === mines) {
  //       for (let i = idx; i < n; ++i) {
  //         const pt = all_points[i];
  //         this.#temp_map[pt.getFirst()][pt.getSecond()] =
  //           MinesweeperState.MINE_FLAG;
  //       }
  //       stack.push({ kind: "rangeRestore", start: idx, end: n });
  //       stack.push({ kind: "call", point_index: n, remaining_mines: 0 });
  //       continue;
  //     }
  //     const p = all_points[idx];
  //     const r = p.getFirst();
  //     const c = p.getSecond();
  //     this.#temp_map[r][c] = MinesweeperState.ZERO;
  //     stack.push({
  //       kind: "nodeStage",
  //       stage: 1,
  //       point_index: idx,
  //       remaining_mines: mines,
  //     });
  //     if (this.#check_temp_map_position_valid(r, c, false)) {
  //       stack.push({
  //         kind: "call",
  //         point_index: idx + 1,
  //         remaining_mines: mines,
  //       });
  //     }
  //   }
  // }
  #search_iterative(
    all_points,
    base_offset,
    point_index,
    remaining_mines,
    number_of_blanks,
    force_finished,
  ) {
    const n = all_points.length;
    const MAX_STACK_SIZE = (n + 1) * 10;
    const stack = new Int32Array(MAX_STACK_SIZE * 4);
    let ptr = 0;
    const K_CALL = 0;
    const K_RESTORE = 1;
    const K_STAGE = 2;
    stack[ptr++] = K_CALL;
    stack[ptr++] = point_index;
    stack[ptr++] = remaining_mines;
    stack[ptr++] = 0;
    while (ptr > 0) {
      ptr -= 4;
      const fKind = stack[ptr];
      const fVal1 = stack[ptr + 1];
      const fVal2 = stack[ptr + 2];
      const fVal3 = stack[ptr + 3];
      if (fKind === K_RESTORE) {
        const start = fVal1;
        const end = fVal2;
        for (let i = start; i < end; ++i) {
          const pt = all_points[i];
          this.#temp_map[pt.getFirst()][pt.getSecond()] =
            MinesweeperState.BLANK;
        }
        continue;
      }
      if (fKind === K_STAGE) {
        const stage = fVal1;
        const pIdx = fVal2;
        const mines = fVal3;
        const p = all_points[pIdx];
        const r = p.getFirst();
        const c = p.getSecond();
        if (stage === 1) {
          this.#temp_map[r][c] = MinesweeperState.MINE_FLAG;
          if (this.#check_temp_map_position_valid(r, c, false)) {
            stack[ptr++] = K_STAGE;
            stack[ptr++] = 2;
            stack[ptr++] = pIdx;
            stack[ptr++] = mines;
            stack[ptr++] = K_CALL;
            stack[ptr++] = pIdx + 1;
            stack[ptr++] = mines - 1;
            stack[ptr++] = 0;
          } else {
            stack[ptr++] = K_STAGE;
            stack[ptr++] = 2;
            stack[ptr++] = pIdx;
            stack[ptr++] = mines;
          }
        } else if (stage === 2) {
          this.#temp_map[r][c] = MinesweeperState.BLANK;
        }
        continue;
      }
      if (this.#force_stopped) continue;
      this.#call_counter = this.#call_counter + 1;
      if (0 === (this.#call_counter & 1023)) {
        if (Date.now() > this.#search_stop_before) {
          this.#force_stopped = true;
          continue;
        }
        this.#call_counter = 0;
      }
      const idx = fVal1;
      const mines = fVal2;
      if (idx === n) {
        if (
          this.#check_temp_map_positions_valid(
            all_points,
            mines,
            force_finished,
          )
        ) {
          for (let i = 0; i < all_points.length; ++i) {
            const pt = all_points[i];
            this.#possibility_map[base_offset + i].add(
              this.#temp_map[pt.getFirst()][pt.getSecond()],
            );
          }
        }
        continue;
      }
      if (0 === mines) {
        for (let i = idx; i < n; ++i) {
          const pt = all_points[i];
          this.#temp_map[pt.getFirst()][pt.getSecond()] = MinesweeperState.ZERO;
        }
        stack[ptr++] = K_RESTORE;
        stack[ptr++] = idx;
        stack[ptr++] = n;
        stack[ptr++] = 0;
        stack[ptr++] = K_CALL;
        stack[ptr++] = n;
        stack[ptr++] = 0;
        stack[ptr++] = 0;
        continue;
      }
      if (number_of_blanks - idx === mines) {
        for (let i = idx; i < n; ++i) {
          const pt = all_points[i];
          this.#temp_map[pt.getFirst()][pt.getSecond()] =
            MinesweeperState.MINE_FLAG;
        }
        stack[ptr++] = K_RESTORE;
        stack[ptr++] = idx;
        stack[ptr++] = n;
        stack[ptr++] = 0;
        stack[ptr++] = K_CALL;
        stack[ptr++] = n;
        stack[ptr++] = 0;
        stack[ptr++] = 0;
        continue;
      }
      const p = all_points[idx];
      const r = p.getFirst();
      const c = p.getSecond();
      this.#temp_map[r][c] = MinesweeperState.ZERO;
      stack[ptr++] = K_STAGE;
      stack[ptr++] = 1;
      stack[ptr++] = idx;
      stack[ptr++] = mines;
      if (this.#check_temp_map_position_valid(r, c, false)) {
        stack[ptr++] = K_CALL;
        stack[ptr++] = idx + 1;
        stack[ptr++] = mines;
        stack[ptr++] = 0;
      }
    }
  }
  #get_prediction_points_in_domain(i, j) {
    const prediction_points = [];
    for (const [di, dj] of MinesweeperState.unit_vectors) {
      const ni = i + di,
        nj = j + dj;
      if (
        ni >= 0 &&
        ni < this.#nrows &&
        nj >= 0 &&
        nj < this.#ncols &&
        this.#prediction_tag[ni][nj]
      ) {
        prediction_points.push(new Pair(ni, nj));
      }
    }
    return prediction_points;
  }
  #get_blocks() {
    const allPointsSet = new Set(this.#all_points.map((p) => p.toString()));
    const keyToPair = new Map(this.#all_points.map((p) => [p.toString(), p]));
    const uf = new UnionFindSet(allPointsSet);
    const graph = new Graph(allPointsSet);
    for (const point of this.#all_points) {
      const neighbors = MinesweeperState.get_numbers_in_domain(
        this.#map,
        point.getFirst(),
        point.getSecond(),
      );
      for (const numPoint of neighbors) {
        const prediction_points = this.#get_prediction_points_in_domain(
          numPoint.getFirst(),
          numPoint.getSecond(),
        );
        for (const prediction_point of prediction_points) {
          const point_str = point.toString();
          const prediction_point_str = prediction_point.toString();
          if (point_str !== prediction_point_str) {
            uf.union(point_str, prediction_point_str);
            graph.add_edge(point_str, prediction_point_str, 0);
          }
        }
      }
    }
    const blocks = [];
    const visitedRoots = new Set();
    for (const point of this.#all_points) {
      const rootKey = uf.find(point.toString());
      if (!visitedRoots.has(rootKey)) {
        blocks.push(graph.get_bfs_order(rootKey).map((p) => keyToPair.get(p)));
        visitedRoots.add(rootKey);
      }
    }
    this.#all_points.length = 0;
    for (const block of blocks) {
      for (const p of block) {
        this.#all_points.push(p);
      }
    }
    return blocks;
  }
  #index_map = null;
  #get_blocks_raw() {
    if (null === this.#index_map) {
      this.#index_map = Array.from(
        { length: this.#nrows },
        () => new Int32Array(this.#ncols),
      );
    }
    for (let i = 0; i < this.#all_points.length; ++i) {
      const point = this.#all_points[i];
      this.#index_map[point.getFirst()][point.getSecond()] = i;
    }
    const set = new RawUnionFindSet(this.#all_points.length);
    const graph = new RawGraph(this.#all_points.length);
    for (const point of this.#all_points) {
      const point_first = point.getFirst();
      const point_second = point.getSecond();
      const numbers_in_domain = MinesweeperState.get_numbers_in_domain(
        this.#map,
        point_first,
        point_second,
      );
      for (const number_point of numbers_in_domain) {
        const prediction_points = this.#get_prediction_points_in_domain(
          number_point.getFirst(),
          number_point.getSecond(),
        );
        for (const prediction_point of prediction_points) {
          const prediction_point_first = prediction_point.getFirst();
          const prediction_point_second = prediction_point.getSecond();
          if (
            !(
              point_first === prediction_point_first &&
              point_second === prediction_point_second
            )
          ) {
            const from_index = this.#index_map[point_first][point_second];
            const to_index =
              this.#index_map[prediction_point_first][prediction_point_second];
            set.union(from_index, to_index);
            graph.add_edge(from_index, to_index, 0);
          }
        }
      }
    }
    const blocks = [];
    const visited = new Set();
    for (let i = 0; i < this.#all_points.length; ++i) {
      const root = set.find(i);
      if (!visited.has(root)) {
        const bfs_order = graph.get_bfs_order(root);
        const real_bfs_order = [];
        for (const k of bfs_order) {
          real_bfs_order.push(this.#all_points[k]);
        }
        blocks.push(real_bfs_order);
        visited.add(root);
      }
    }
    this.#all_points.length = 0;
    for (const block of blocks) {
      this.#all_points.push(...block);
    }
    return blocks;
  }
  #has_found(target_points_max_length) {
    for (let i = 0; i < target_points_max_length; ++i) {
      if (1 == this.#possibility_map[i].size) {
        return true;
      }
    }
    return false;
  }
  #initPossibilityMap(target_points) {
    this.#possibility_map = [];
    for (let i = 0; i < target_points.length; ++i) {
      this.#possibility_map.push(new Set());
    }
  }
  #initialize_get_predictions(search_stop_before) {
    this.#search_stop_before = search_stop_before;
    this.#force_stopped = false;
    this.#all_points = [];
    this.#all_blanks = [];
    this.#prediction_tag = Array.from({ length: this.#nrows }, () =>
      new Array(this.#ncols).fill(false),
    );
    const visited = Array.from({ length: this.#nrows }, () =>
      new Array(this.#ncols).fill(false),
    );
    for (let i = 0; i < this.#nrows; ++i) {
      for (let j = 0; j < this.#ncols; ++j) {
        if (MinesweeperState.is_unfinished_operand(this.#map[i][j])) {
          this.#all_blanks.push(new Pair(i, j));
        } else {
          visited[i][j] = true;
        }
        if (MinesweeperState.is_number(this.#map[i][j])) {
          for (
            let ni = Math.max(0, i - 1);
            ni <= Math.min(this.#nrows - 1, i + 1);
            ++ni
          ) {
            for (
              let nj = Math.max(0, j - 1);
              nj <= Math.min(this.#ncols - 1, j + 1);
              ++nj
            ) {
              if (
                !visited[ni][nj] &&
                MinesweeperState.is_unfinished_operand(this.#map[ni][nj])
              ) {
                this.#all_points.push(new Pair(ni, nj));
                this.#prediction_tag[ni][nj] = true;
              }
              visited[ni][nj] = true;
            }
          }
        }
      }
    }
  }
  get_predictions(search_stop_before) {
    this.#initialize_get_predictions(search_stop_before);
    const predictions = [];
    if (this.#remaining_mines === 0) {
      this.#all_blanks.forEach((p) =>
        predictions.push(new Pair(p, MinesweeperState.ZERO)),
      );
    } else if (this.#remaining_mines === this.#all_blanks.length) {
      this.#all_blanks.forEach((p) =>
        predictions.push(new Pair(p, MinesweeperState.MINE_FLAG)),
      );
    } else {
      const blocks = this.#get_blocks_raw();
      // const gaussian_predictions =
      //   GaussianEliminationSolver.get_predictions_from_blocks(
      //     blocks,
      //     this.#map,
      //     this.#prediction_tag,
      //   );
      // if (null === gaussian_predictions) {
      //   return null;
      // } else if (gaussian_predictions.length > 0) {
      //   return gaussian_predictions;
      // }
      const all_blanks_included =
        this.#all_points.length === this.#all_blanks.length;
      let target_points = this.#all_points;
      let target_points_max_length = 0;
      this.#temp_map = this.#map.map((row) =>
        row.map((cell) =>
          MinesweeperState.is_unfinished_operand(cell)
            ? MinesweeperState.BLANK
            : cell,
        ),
      );
      this.#initPossibilityMap(target_points);
      for (const block of blocks) {
        this.#search_iterative(
          block,
          target_points_max_length,
          0,
          this.#remaining_mines,
          this.#all_blanks.length,
          1 === blocks.length && all_blanks_included,
        );
        if (this.#force_stopped) {
          break;
        }
        target_points_max_length += block.length;
      }
      if (!this.#force_stopped && !this.#has_found(target_points_max_length)) {
        if (blocks.length !== 1) {
          target_points = this.#all_points;
          this.#initPossibilityMap(target_points);
          this.#search_iterative(
            target_points,
            0,
            0,
            this.#remaining_mines,
            this.#all_blanks.length,
            all_blanks_included,
          );
          if (this.#force_stopped) {
            return predictions;
          }
          target_points_max_length = target_points.length;
        }
        if (
          !all_blanks_included &&
          !this.#has_found(target_points_max_length)
        ) {
          target_points = this.#all_blanks;
          this.#initPossibilityMap(target_points);
          this.#search_iterative(
            target_points,
            0,
            0,
            this.#remaining_mines,
            this.#all_blanks.length,
            true,
          );
          if (this.#force_stopped) {
            return predictions;
          }
          target_points_max_length = target_points.length;
        }
      }
      for (let i = 0; i < target_points_max_length; ++i) {
        const p = target_points[i];
        const possibilities = this.#possibility_map[i];
        if (0 === possibilities.size) {
          return null;
        } else if (1 === possibilities.size) {
          predictions.push(new Pair(p, Array.from(possibilities)[0]));
        }
      }
    }
    return predictions;
  }
  limit_time_get_prediction(time_upper_limit) {
    return this.get_predictions(Date.now() + time_upper_limit);
  }
}
export { MinesweeperState };
