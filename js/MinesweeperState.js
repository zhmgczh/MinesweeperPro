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
  #point_pool;
  #temp_map = null;
  #possibility_map = null;
  #final_remaining_mines_possibilities = null;
  #all_points = null;
  #all_blanks = null;
  #search_stop_before = -1;
  #mines_already_determined;
  #force_stopped = false;
  #prediction_tag = null;
  #index_map = null;
  #call_counter = 0;
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
    this.#point_pool = Array.from({ length: this.#nrows }, () =>
      Array.from({ length: this.#ncols }, () => null),
    );
  }
  reset(time_passed, remaining_mines, map, check) {
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
    if (
      this.#point_pool.length !== this.#nrows ||
      this.#point_pool[0].length !== this.#ncols
    ) {
      this.#point_pool = Array.from({ length: this.#nrows }, () =>
        Array.from({ length: this.#ncols }, () => null),
      );
    }
  }
  #initialize_point_pool_position(i, j) {
    if (null === this.#point_pool[i][j]) {
      this.#point_pool[i][j] = new Pair(i, j);
    }
  }
  get_time_passed() {
    return this.#time_passed;
  }
  get_remaining_mines() {
    return this.#remaining_mines;
  }
  get_map() {
    return this.#map;
  }
  get_nrows() {
    return this.#nrows;
  }
  get_ncols() {
    return this.#ncols;
  }
  get_state(i, j) {
    if (i >= 0 && i < this.#nrows && j >= 0 && j < this.#ncols) {
      return this.#map[i][j];
    }
    return " ";
  }
  static get_map_as_string(map) {
    let result = "";
    for (let i = 0; i < map[0].length; ++i) {
      result += map[0][i];
      for (let j = 1; j < map.length; ++j) {
        result += " " + map[j][i];
      }
      result += "\n";
    }
    return result;
  }
  get_map_as_string() {
    return MinesweeperState.get_map_as_string(this.#map);
  }
  toString() {
    return (
      "Time passed: " +
      this.#time_passed +
      " Remaining mines: " +
      this.#remaining_mines +
      "\nWidth: " +
      this.#nrows +
      " Height: " +
      this.#ncols +
      "\n" +
      this.get_map_as_string()
    );
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
        if (MinesweeperState.MINE_FLAG === map[ni][nj]) {
          ++mines;
        } else if (MinesweeperState.is_unfinished_operand(map[ni][nj])) {
          ++blanks;
        }
      }
    }
    const target = MinesweeperState.to_number(map[i][j]);
    if (force_finished && mines !== target) return false;
    return mines <= target && mines + blanks >= target;
  }
  check_number_valid(i, j, force_finished) {
    return MinesweeperState.check_number_valid(this.#map, i, j, force_finished);
  }
  static check_map_valid(map, remaining_mines, force_finished) {
    if (force_finished && remaining_mines !== 0) {
      return false;
    }
    let blanks = 0;
    for (let i = 0; i < map.length; ++i) {
      for (let j = 0; j < map[0].length; ++j) {
        if (MinesweeperState.is_unfinished_operand(map[i][j])) {
          if (force_finished) return false;
          ++blanks;
        }
        if (!MinesweeperState.is_valid_operand(map[i][j])) return false;
        if (!MinesweeperState.check_number_valid(map, i, j, force_finished)) {
          return false;
        }
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
  get_numbers_in_domain(i, j) {
    const numbers = [];
    for (const [di, dj] of MinesweeperState.unit_vectors) {
      const ni = i + di,
        nj = j + dj;
      if (
        ni >= 0 &&
        ni < this.#map.length &&
        nj >= 0 &&
        nj < this.#map[0].length &&
        MinesweeperState.is_number(this.#map[ni][nj])
      ) {
        this.#initialize_point_pool_position(ni, nj);
        numbers.push(this.#point_pool[ni][nj]);
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
  #check_final_status_valid(remaining_mines, remaining_blanks, force_finished) {
    if (force_finished && (remaining_mines !== 0 || remaining_blanks !== 0)) {
      return false;
    }
    return 0 <= remaining_mines && remaining_mines <= remaining_blanks;
  }
  #quick_set_and_check_valid(all_points, start_index, value) {
    for (let i = start_index; i < all_points.length; ++i) {
      const point = all_points[i];
      const point_x = point.getFirst();
      const point_y = point.getSecond();
      this.#temp_map[point_x][point_y] = value;
      if (!this.#check_temp_map_position_valid(point_x, point_y, false)) {
        return false;
      }
    }
    return true;
  }
  #quick_reset(all_points, start_index) {
    for (let i = start_index; i < all_points.length; ++i) {
      const point = all_points[i];
      this.#temp_map[point.getFirst()][point.getSecond()] =
        MinesweeperState.BLANK;
    }
  }
  #search(
    all_points,
    base_offset,
    point_index,
    remaining_mines,
    number_of_blanks,
    force_finished,
  ) {
    if (this.#force_stopped) return;
    if (this.#search_stop_before > 0) {
      ++this.#call_counter;
      if (0 === (this.#call_counter & 1023)) {
        if (Date.now() > this.#search_stop_before) {
          this.#force_stopped = true;
          return;
        }
        this.#call_counter = 0;
      }
    }
    if (point_index === all_points.length) {
      if (
        this.#check_final_status_valid(
          remaining_mines,
          number_of_blanks - all_points.length,
          force_finished,
        )
      ) {
        for (let i = 0; i < all_points.length; ++i) {
          const pt = all_points[i];
          this.#possibility_map[base_offset + i].add(
            this.#temp_map[pt.getFirst()][pt.getSecond()],
          );
        }
        this.#final_remaining_mines_possibilities.add(remaining_mines);
      }
    } else if (0 === remaining_mines) {
      if (
        this.#quick_set_and_check_valid(
          all_points,
          point_index,
          MinesweeperState.ZERO,
        )
      ) {
        this.#search(
          all_points,
          base_offset,
          all_points.length,
          0,
          number_of_blanks,
          force_finished,
        );
      }
      this.#quick_reset(all_points, point_index);
    } else if (number_of_blanks - point_index === remaining_mines) {
      if (
        this.#quick_set_and_check_valid(
          all_points,
          point_index,
          MinesweeperState.MINE_FLAG,
        )
      ) {
        this.#search(
          all_points,
          base_offset,
          all_points.length,
          0,
          number_of_blanks,
          force_finished,
        );
      }
      this.#quick_reset(all_points, point_index);
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
  #search_iterative(
    all_points,
    base_offset,
    remaining_mines,
    number_of_blanks,
    force_finished,
  ) {
    const maxDepth = all_points.length + 5;
    const stack_point_index = new Int32Array(maxDepth);
    const stack_remaining_mines = new Int32Array(maxDepth);
    const stack_stage = new Int32Array(maxDepth);
    const stack_x = new Int32Array(maxDepth);
    const stack_y = new Int32Array(maxDepth);
    let stack_pointer = 0;
    stack_point_index[stack_pointer] = 0;
    stack_remaining_mines[stack_pointer] = remaining_mines;
    stack_stage[stack_pointer] = 0;
    while (stack_pointer >= 0) {
      let cur_point_index = stack_point_index[stack_pointer];
      let cur_remaining_mines = stack_remaining_mines[stack_pointer];
      if (stack_stage[stack_pointer] === 0) {
        if (this.#force_stopped) {
          --stack_pointer;
          continue;
        }
        if (this.#search_stop_before > 0) {
          ++this.#call_counter;
          if (0 === (this.#call_counter & 1023)) {
            if (Date.now() > this.#search_stop_before) {
              this.#force_stopped = true;
              --stack_pointer;
              continue;
            }
            this.#call_counter = 0;
          }
        }
        if (cur_point_index === all_points.length) {
          if (
            this.#check_final_status_valid(
              cur_remaining_mines,
              number_of_blanks - all_points.length,
              force_finished,
            )
          ) {
            for (let i = 0; i < all_points.length; ++i) {
              const p = all_points[i];
              const val = this.#temp_map[p.getFirst()][p.getSecond()];
              this.#possibility_map[base_offset + i].add(val);
            }
            this.#final_remaining_mines_possibilities.add(cur_remaining_mines);
          }
          --stack_pointer;
          continue;
        }
        if (0 === cur_remaining_mines) {
          stack_stage[stack_pointer] = 1;
          if (
            this.#quick_set_and_check_valid(
              all_points,
              cur_point_index,
              MinesweeperState.ZERO,
            )
          ) {
            ++stack_pointer;
            stack_point_index[stack_pointer] = all_points.length;
            stack_remaining_mines[stack_pointer] = 0;
            stack_stage[stack_pointer] = 0;
          }
          continue;
        }
        if (number_of_blanks - cur_point_index === cur_remaining_mines) {
          stack_stage[stack_pointer] = 2;
          if (
            this.#quick_set_and_check_valid(
              all_points,
              cur_point_index,
              MinesweeperState.MINE_FLAG,
            )
          ) {
            ++stack_pointer;
            stack_point_index[stack_pointer] = all_points.length;
            stack_remaining_mines[stack_pointer] = 0;
            stack_stage[stack_pointer] = 0;
          }
          continue;
        }
        const p = all_points[cur_point_index];
        stack_x[stack_pointer] = p.getFirst();
        stack_y[stack_pointer] = p.getSecond();
        this.#temp_map[stack_x[stack_pointer]][stack_y[stack_pointer]] =
          MinesweeperState.ZERO;
        stack_stage[stack_pointer] = 3;
        if (
          this.#check_temp_map_position_valid(
            stack_x[stack_pointer],
            stack_y[stack_pointer],
            false,
          )
        ) {
          ++stack_pointer;
          stack_point_index[stack_pointer] = cur_point_index + 1;
          stack_remaining_mines[stack_pointer] = cur_remaining_mines;
          stack_stage[stack_pointer] = 0;
        }
        continue;
      }
      if (stack_stage[stack_pointer] === 1) {
        this.#quick_reset(all_points, cur_point_index);
        --stack_pointer;
        continue;
      }
      if (stack_stage[stack_pointer] === 2) {
        this.#quick_reset(all_points, cur_point_index);
        --stack_pointer;
        continue;
      }
      if (stack_stage[stack_pointer] === 3) {
        this.#temp_map[stack_x[stack_pointer]][stack_y[stack_pointer]] =
          MinesweeperState.MINE_FLAG;
        stack_stage[stack_pointer] = 4;
        if (
          this.#check_temp_map_position_valid(
            stack_x[stack_pointer],
            stack_y[stack_pointer],
            false,
          )
        ) {
          ++stack_pointer;
          stack_point_index[stack_pointer] = cur_point_index + 1;
          stack_remaining_mines[stack_pointer] = cur_remaining_mines - 1;
          stack_stage[stack_pointer] = 0;
        }
        continue;
      }
      if (stack_stage[stack_pointer] === 4) {
        this.#temp_map[stack_x[stack_pointer]][stack_y[stack_pointer]] =
          MinesweeperState.BLANK;
        --stack_pointer;
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
        this.#initialize_point_pool_position(ni, nj);
        prediction_points.push(this.#point_pool[ni][nj]);
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
      const neighbors = this.get_numbers_in_domain(
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
      const numbers_in_domain = this.get_numbers_in_domain(
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
  #search_unfinished(
    target_points,
    base_offset,
    remaining_mines,
    number_of_blanks,
    force_finished,
  ) {
    if (!this.#force_stopped) {
      this.#search(
        target_points,
        base_offset,
        0,
        remaining_mines,
        number_of_blanks,
        force_finished,
      );
    }
    return this.#force_stopped;
  }
  #search_iterative_unfinished(
    target_points,
    base_offset,
    remaining_mines,
    number_of_blanks,
    force_finished,
  ) {
    if (!this.#force_stopped) {
      this.#search_iterative(
        target_points,
        base_offset,
        remaining_mines,
        number_of_blanks,
        force_finished,
      );
    }
    return this.#force_stopped;
  }
  #initialize_temp_map() {
    if (
      null === this.#temp_map ||
      this.#temp_map.length !== this.#nrows ||
      this.#temp_map[0].length !== this.#ncols
    ) {
      this.#temp_map = this.#map.map((row) =>
        row.map((cell) =>
          MinesweeperState.is_unfinished_operand(cell)
            ? MinesweeperState.BLANK
            : cell,
        ),
      );
    } else {
      for (let i = 0; i < this.#nrows; ++i) {
        for (let j = 0; j < this.#ncols; ++j) {
          if (MinesweeperState.is_unfinished_operand(this.#map[i][j])) {
            this.#temp_map[i][j] = MinesweeperState.BLANK;
          } else {
            this.#temp_map[i][j] = this.#map[i][j];
          }
        }
      }
    }
  }
  #initialize_get_predictions() {
    this.#force_stopped = false;
    this.#mines_already_determined = 0;
    if (null === this.#all_points) {
      this.#all_points = [];
    } else {
      this.#all_points.length = 0;
    }
    if (null === this.#all_blanks) {
      this.#all_blanks = [];
    } else {
      this.#all_blanks.length = 0;
    }
    if (
      null === this.#prediction_tag ||
      this.#prediction_tag.length !== this.#nrows ||
      this.#prediction_tag[0].length !== this.#ncols
    ) {
      this.#prediction_tag = Array.from({ length: this.#nrows }, () =>
        new Array(this.#ncols).fill(false),
      );
    } else {
      for (let i = 0; i < this.#nrows; ++i) {
        for (let j = 0; j < this.#ncols; ++j) {
          this.#prediction_tag[i][j] = false;
        }
      }
    }
    const visited = Array.from({ length: this.#nrows }, () =>
      new Array(this.#ncols).fill(false),
    );
    for (let i = 0; i < this.#nrows; ++i) {
      for (let j = 0; j < this.#ncols; ++j) {
        if (MinesweeperState.is_unfinished_operand(this.#map[i][j])) {
          this.#initialize_point_pool_position(i, j);
          this.#all_blanks.push(this.#point_pool[i][j]);
        } else {
          visited[i][j] = true;
        }
        if (MinesweeperState.is_number(this.#map[i][j])) {
          const min_i = Math.max(0, i - 1);
          const max_i = Math.min(this.#nrows - 1, i + 1);
          const min_j = Math.max(0, j - 1);
          const max_j = Math.min(this.#ncols - 1, j + 1);
          for (let ni = min_i; ni <= max_i; ++ni) {
            for (let nj = min_j; nj <= max_j; ++nj) {
              if (
                !visited[ni][nj] &&
                MinesweeperState.is_unfinished_operand(this.#map[ni][nj])
              ) {
                this.#initialize_point_pool_position(ni, nj);
                this.#all_points.push(this.#point_pool[ni][nj]);
                this.#prediction_tag[ni][nj] = true;
              }
              visited[ni][nj] = true;
            }
          }
        }
      }
    }
  }
  #initialize_possibility_map(target_points) {
    if (
      null === this.#possibility_map ||
      this.#possibility_map.length !== target_points.length
    ) {
      this.#possibility_map = [];
      for (let i = 0; i < target_points.length; ++i) {
        this.#possibility_map.push(new Set());
      }
    } else {
      for (let i = 0; i < target_points.length; ++i) {
        this.#possibility_map[i].clear();
      }
    }
    if (null === this.#final_remaining_mines_possibilities) {
      this.#final_remaining_mines_possibilities = new Set();
    } else {
      this.#final_remaining_mines_possibilities.clear();
    }
  }
  #summarize_predictions_failed(target_points, start, end, predictions) {
    for (let i = start; i < end; ++i) {
      const p = target_points[i];
      const possibilities = this.#possibility_map[i];
      if (0 === possibilities.size) {
        return true;
      } else if (1 === possibilities.size) {
        const state = possibilities.values().next().value;
        predictions.push(new Pair(p, state));
        if (MinesweeperState.MINE_FLAG === state) {
          ++this.#mines_already_determined;
        }
      }
    }
    return false;
  }
  get_predictions() {
    this.#initialize_get_predictions();
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
      this.#initialize_temp_map();
      this.#initialize_possibility_map(target_points);
      for (const block of blocks) {
        if (
          this.#search_iterative_unfinished(
            block,
            target_points_max_length,
            this.#remaining_mines - this.#mines_already_determined,
            this.#all_blanks.length - predictions.length,
            1 === blocks.length && all_blanks_included,
          )
        ) {
          return predictions;
        }
        if (
          this.#summarize_predictions_failed(
            target_points,
            target_points_max_length,
            target_points_max_length + block.length,
            predictions,
          )
        ) {
          return null;
        }
        target_points_max_length += block.length;
      }
      if (
        !this.#force_stopped &&
        blocks.length !== 1 &&
        0 === predictions.length
      ) {
        target_points = this.#all_points;
        this.#initialize_possibility_map(target_points);
        if (
          this.#search_iterative_unfinished(
            target_points,
            0,
            this.#remaining_mines,
            this.#all_blanks.length,
            all_blanks_included,
          )
        ) {
          return predictions;
        }
        if (
          this.#summarize_predictions_failed(
            target_points,
            0,
            target_points_max_length,
            predictions,
          )
        ) {
          return null;
        }
      }
      if (
        !this.#force_stopped &&
        0 === predictions.length &&
        1 === this.#final_remaining_mines_possibilities.size
      ) {
        const final_remaining_mines = this.#final_remaining_mines_possibilities
          .values()
          .next().value;
        if (0 === final_remaining_mines) {
          for (const point of this.#all_blanks) {
            if (!this.#prediction_tag[point.getFirst()][point.getSecond()]) {
              predictions.push(new Pair(point, MinesweeperState.ZERO));
            }
          }
        } else if (
          this.#all_blanks.length - this.#all_points.length ===
          final_remaining_mines
        ) {
          for (const point of this.#all_blanks) {
            if (!this.#prediction_tag[point.getFirst()][point.getSecond()]) {
              predictions.push(new Pair(point, MinesweeperState.MINE_FLAG));
            }
          }
        }
      }
    }
    return predictions;
  }
  limit_time_get_prediction(time_upper_limit) {
    if (time_upper_limit < 0) {
      this.#search_stop_before = -1;
    } else {
      this.#search_stop_before = Date.now() + time_upper_limit;
    }
    return this.get_predictions();
  }
}
export { MinesweeperState };
