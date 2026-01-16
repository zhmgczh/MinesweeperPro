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
  constructor(time_passed, remaining_mines, map) {
    if (!MinesweeperState.check_map_valid(map, remaining_mines, false)) {
      throw new IllegalMapException("The map is invalid.");
    }
    this.#time_passed = time_passed;
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
      for (let j = 0; j < map[i].length; ++j) {
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
            force_finished
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
          force_finished
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
  #search(
    all_points,
    point_index,
    remaining_mines,
    number_of_blanks,
    force_finished
  ) {
    if (this.#force_stopped) return;
    if (Date.now() > this.#search_stop_before) {
      this.#force_stopped = true;
      return;
    }
    if (point_index === all_points.length) {
      if (
        this.#check_temp_map_positions_valid(
          all_points,
          remaining_mines,
          force_finished
        )
      ) {
        for (const point of all_points) {
          this.#possibility_map
            .get(point.toString())
            .add(this.#temp_map[point.getFirst()][point.getSecond()]);
        }
      }
    } else if (0 === remaining_mines) {
      for (let i = point_index; i < all_points.length; ++i)
        this.#temp_map[all_points[i].getFirst()][all_points[i].getSecond()] =
          MinesweeperState.ZERO;
      this.#search(
        all_points,
        all_points.length,
        0,
        number_of_blanks,
        force_finished
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
        all_points.length,
        0,
        number_of_blanks,
        force_finished
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
          point_index + 1,
          remaining_mines,
          number_of_blanks,
          force_finished
        );
      }
      this.#temp_map[p.getFirst()][p.getSecond()] = MinesweeperState.MINE_FLAG;
      if (
        this.#check_temp_map_position_valid(p.getFirst(), p.getSecond(), false)
      ) {
        this.#search(
          all_points,
          point_index + 1,
          remaining_mines - 1,
          number_of_blanks,
          force_finished
        );
      }
      this.#temp_map[p.getFirst()][p.getSecond()] = MinesweeperState.BLANK;
    }
  }
  #get_blocks() {
    const allPointsSet = new Set(this.#all_points);
    const uf = new UnionFindSet(allPointsSet);
    const graph = new Graph(allPointsSet);
    for (const point of this.#all_points) {
      const neighbors = MinesweeperState.get_numbers_in_domain(
        this.#temp_map,
        point.getFirst(),
        point.getSecond()
      );
      for (const numPoint of neighbors) {
        for (const [di, dj] of MinesweeperState.unit_vectors) {
          const ni = numPoint.getFirst() + di,
            nj = numPoint.getSecond() + dj;
          if (
            ni >= 0 &&
            ni < this.#nrows &&
            nj >= 0 &&
            nj < this.#ncols &&
            this.#prediction_tag[ni][nj]
          ) {
            const otherPoint = Array.from(allPointsSet).find(
              (p) => p.getFirst() === ni && p.getSecond() === nj
            );
            if (otherPoint) {
              uf.union(point, otherPoint);
              graph.add_edge(point, otherPoint, 0);
              graph.add_edge(otherPoint, point, 0);
            }
          }
        }
      }
    }
    const blocks = [];
    const visitedRoots = new Set();
    for (const point of this.#all_points) {
      const root = uf.find(point);
      const rootKey = root.toString();
      if (!visitedRoots.has(rootKey)) {
        blocks.push(graph.get_bfs_order(root));
        visitedRoots.add(rootKey);
      }
    }
    this.#all_points = [];
    for (const block of blocks) {
      for (const p of block) {
        this.#all_points.push(p);
      }
    }
    return blocks;
  }
  #initPossibilityMap(points) {
    this.#possibility_map = new Map();
    points.forEach((p) => this.#possibility_map.set(p.toString(), new Set()));
  }
  #has_found() {
    return this.#all_points.some(
      (p) => this.#possibility_map.get(p.toString()).size === 1
    );
  }
  #initialize_get_predictions(search_stop_before) {
    this.#search_stop_before = search_stop_before;
    this.#force_stopped = false;
    this.#all_points = [];
    this.#all_blanks = [];
    this.#prediction_tag = Array.from({ length: this.#nrows }, () =>
      new Array(this.#ncols).fill(false)
    );
    const visited = Array.from({ length: this.#nrows }, () =>
      new Array(this.#ncols).fill(false)
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
        predictions.push(new Pair(p, MinesweeperState.ZERO))
      );
    } else if (this.#remaining_mines === this.#all_blanks.length) {
      this.#all_blanks.forEach((p) =>
        predictions.push(new Pair(p, MinesweeperState.MINE_FLAG))
      );
    } else {
      this.#temp_map = this.#map.map((row) =>
        row.map((cell) =>
          MinesweeperState.is_unfinished_operand(cell)
            ? MinesweeperState.BLANK
            : cell
        )
      );
      const all_blanks_included =
        this.#all_points.length === this.#all_blanks.length;
      var target_points = this.#all_points;
      this.#initPossibilityMap(target_points);
      const blocks = this.#get_blocks();
      for (const block of blocks) {
        this.#search(
          block,
          0,
          this.#remaining_mines,
          this.#all_blanks.length,
          1 === blocks.length && all_blanks_included
        );
        if (this.#force_stopped) return predictions;
      }
      if (blocks.length !== 1 && !this.#has_found()) {
        this.#initPossibilityMap(target_points);
        this.#search(
          target_points,
          0,
          this.#remaining_mines,
          this.#all_blanks.length,
          all_blanks_included
        );
        if (this.#force_stopped) return predictions;
      }
      if (!all_blanks_included && !this.#has_found()) {
        target_points = this.#all_blanks;
        this.#initPossibilityMap(target_points);
        this.#search(
          target_points,
          0,
          this.#remaining_mines,
          this.#all_blanks.length,
          true
        );
        if (this.#force_stopped) return predictions;
      }
      for (const p of target_points) {
        const possibilities = this.#possibility_map.get(p.toString());
        if (0 === possibilities.size) {
          return null;
        } else if (possibilities.size === 1) {
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
