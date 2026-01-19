import { MinesweeperState } from "./MinesweeperState.js";
class MapGenerator {
  static count_determined_blanks(rows, cols, first_click_row, first_click_col) {
    const min_i = Math.max(0, first_click_row - 1);
    const max_i = Math.min(rows - 1, first_click_row + 1);
    const min_j = Math.max(0, first_click_col - 1);
    const max_j = Math.min(cols - 1, first_click_col + 1);
    return (max_i - min_i + 1) * (max_j - min_j + 1);
  }
  static shuffle(arr) {
    for (let i = arr.length - 1; i > 0; --i) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  static update_mine_count(grid, i, j) {
    const min_i = Math.max(0, i - 1);
    const max_i = Math.min(grid.length - 1, i + 1);
    const min_j = Math.max(0, j - 1);
    const max_j = Math.min(grid[0].length - 1, j + 1);
    for (let new_i = min_i; new_i <= max_i; ++new_i) {
      for (let new_j = min_j; new_j <= max_j; ++new_j) {
        if (-1 !== grid[new_i][new_j]) {
          ++grid[new_i][new_j];
        }
      }
    }
  }
  static generate_first_avoided_map(
    rows,
    cols,
    mines,
    first_click_row,
    first_click_col,
  ) {
    if (rows <= 0 || cols <= 0) {
      throw new Error("invalid map size");
    }
    if (
      first_click_row < 0 ||
      first_click_row >= rows ||
      first_click_col < 0 ||
      first_click_col >= cols
    ) {
      throw new Error("first click out of bounds");
    }
    const grid = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => 0),
    );
    let determined_blanks = MapGenerator.count_determined_blanks(
      rows,
      cols,
      first_click_row,
      first_click_col,
    );
    const random_states = Array.from(
      { length: rows * cols - determined_blanks },
      () => 0,
    );
    let new_mines = Math.round(
      Math.max(0, Math.min(mines, random_states.length)),
    );
    if (new_mines !== mines) {
      throw new Error("mine number invalid");
    }
    for (let i = 0; i < mines; ++i) {
      random_states[i] = -1;
    }
    MapGenerator.shuffle(random_states);
    for (let i = 0; i < rows; ++i) {
      for (let j = 0; j < cols; ++j) {
        if (
          Math.abs(i - first_click_row) > 1 ||
          Math.abs(j - first_click_col) > 1
        ) {
          grid[i][j] = random_states.pop();
        }
      }
    }
    for (let i = 0; i < rows; ++i) {
      for (let j = 0; j < cols; ++j) {
        if (-1 === grid[i][j]) {
          MapGenerator.update_mine_count(grid, i, j);
        }
      }
    }
    return grid;
  }
  static recursive_reveal(temp_map, grid, i, j, visited) {
    if (-1 !== grid[i][j]) {
      temp_map[i][j] = String(grid[i][j]);
    }
    visited[i][j] = true;
    if (0 === grid[i][j]) {
      const min_i = Math.max(0, i - 1);
      const max_i = Math.min(temp_map.length - 1, i + 1);
      const min_j = Math.max(0, j - 1);
      const max_j = Math.min(temp_map[0].length - 1, j + 1);
      for (let new_i = min_i; new_i <= max_i; ++new_i) {
        for (let new_j = min_j; new_j <= max_j; ++new_j) {
          if (!visited[new_i][new_j]) {
            MapGenerator.recursive_reveal(
              temp_map,
              grid,
              new_i,
              new_j,
              visited,
            );
          }
        }
      }
    }
  }
  static iterative_reveal(temp_map, grid, i, j, visited) {
    const stack = [{ i, j, stage: 0 }];
    while (stack.length > 0) {
      const top = stack[stack.length - 1];
      if (top.stage === 0) {
        const ci = top.i;
        const cj = top.j;
        if (-1 !== grid[ci][cj]) {
          temp_map[ci][cj] = String(grid[ci][cj]);
        }
        visited[ci][cj] = true;
        if (0 !== grid[ci][cj]) {
          stack.pop();
          continue;
        }
        top.stage = 1;
        top.min_i = Math.max(0, ci - 1);
        top.max_i = Math.min(temp_map.length - 1, ci + 1);
        top.min_j = Math.max(0, cj - 1);
        top.max_j = Math.min(temp_map[0].length - 1, cj + 1);
        top.next_i = top.min_i;
        top.next_j = top.min_j;
        continue;
      }
      if (top.next_i > top.max_i) {
        stack.pop();
        continue;
      }
      const ni = top.next_i;
      const nj = top.next_j;
      if (top.next_j < top.max_j) {
        top.next_j += 1;
      } else {
        top.next_i += 1;
        top.next_j = top.min_j;
      }
      if (!visited[ni][nj]) {
        stack.push({ i: ni, j: nj, stage: 0 });
      }
    }
  }
  static do_recursive_reveal(temp_map, grid, i, j, visited) {
    if (
      i < 0 ||
      i >= grid.length ||
      j < 0 ||
      j >= grid[0].length ||
      -1 === grid[i][j] ||
      temp_map[i][j] !== MinesweeperState.BLANK
    ) {
      return;
    }
    MapGenerator.iterative_reveal(temp_map, grid, i, j, visited);
  }
  static is_no_guess_solution(
    grid,
    mines,
    first_click_row,
    first_click_col,
    SINGLE_STEP_TIME_LIMIT,
    ONE_GRID_TIME_LIMIT,
  ) {
    const visited = Array.from({ length: grid.length }, () =>
      Array.from({ length: grid[0].length }, () => false),
    );
    const temp_map = Array.from({ length: grid.length }, () =>
      Array.from({ length: grid[0].length }, () => MinesweeperState.BLANK),
    );
    MapGenerator.do_recursive_reveal(
      temp_map,
      grid,
      first_click_row,
      first_click_col,
      visited,
    );
    let remaining_mines = mines;
    let game_state = null;
    let start_time = Date.now();
    do {
      game_state = new MinesweeperState(0, remaining_mines, temp_map);
      if ("W" === game_state.get_status()) {
        return true;
      }
      const predictions = game_state.limit_time_get_prediction(
        SINGLE_STEP_TIME_LIMIT,
      );
      if (null === predictions || 0 === predictions.length) {
        break;
      }
      for (const prediction of predictions) {
        const i = prediction.getFirst().getFirst();
        const j = prediction.getFirst().getSecond();
        const state = prediction.getSecond();
        if (temp_map[i][j] === MinesweeperState.BLANK) {
          if (MinesweeperState.MINE_FLAG === state) {
            temp_map[i][j] = MinesweeperState.MINE_FLAG;
            --remaining_mines;
          } else {
            MapGenerator.do_recursive_reveal(temp_map, grid, i, j, visited);
          }
        }
      }
    } while (Date.now() - start_time <= ONE_GRID_TIME_LIMIT);
    return false;
  }
  static clamp(x, lo, hi) {
    return Math.min(hi, Math.max(lo, x));
  }
  static generate_no_guess_map(
    rows,
    cols,
    mines,
    first_click_row,
    first_click_col,
  ) {
    let area = rows * cols;
    let SINGLE_STEP_TIME_LIMIT = MapGenerator.clamp(
      Math.round(200 + 0.5 * area),
      250,
      1200,
    );
    let ONE_GRID_TIME_LIMIT = MapGenerator.clamp(
      Math.round(SINGLE_STEP_TIME_LIMIT * (15 + 0.8 * Math.sqrt(area))),
      4000,
      30000,
    );
    let NO_GUESS_TIME_LIMIT = MapGenerator.clamp(
      Math.round(3 * ONE_GRID_TIME_LIMIT + 30 * area),
      15000,
      60000,
    );
    console.log(SINGLE_STEP_TIME_LIMIT, ONE_GRID_TIME_LIMIT, NO_GUESS_TIME_LIMIT);
    let grid = null;
    let start_time = Date.now();
    let successful = false;
    do {
      grid = MapGenerator.generate_first_avoided_map(
        rows,
        cols,
        mines,
        first_click_row,
        first_click_col,
      );
      if (
        MapGenerator.is_no_guess_solution(
          grid,
          mines,
          first_click_row,
          first_click_col,
          SINGLE_STEP_TIME_LIMIT,
          ONE_GRID_TIME_LIMIT,
        )
      ) {
        successful = true;
        break;
      }
    } while (Date.now() - start_time <= NO_GUESS_TIME_LIMIT);
    return successful ? grid : null;
  }
}
export { MapGenerator };
