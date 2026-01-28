import { MapGenerator } from "./MapGenerator.js";
import { MinesweeperState } from "./MinesweeperState.js";
function set_loading_icon() {
  nstatus.image.src = imgs.s0;
  $(cover).css("visibility", "visible");
  $(loading.image).css("visibility", "visible");
}
function requesthint() {
  if (game.populated && !game.stopped && null == state.hintinterval) {
    game.cheated = !0;
    for (
      var t = game.x + " " + game.y + " " + game.m + "\n", e = 0;
      e < game.f;
      ++e
    )
      t += String.fromCharCode(75 + game.state[e]);
    ((t += "\n"),
      loader.start(),
      (() => {
        let finished = false;
        const timer = setTimeout(
          () => {
            if (finished) return;
            finished = true;
            loader.stop();
            nstatus.image.src = imgs.s2;
            nstatus.tooltiptext = connectionfailed;
          },
          MapGenerator.get_NO_GUESS_TIME_LIMIT(
            MapGenerator.get_ONE_GRID_TIME_LIMIT(
              MapGenerator.get_SINGLE_STEP_TIME_LIMIT(game.x * game.y),
              game.x * game.y,
            ),
            game.x * game.y,
          ),
        );
        set_loading_icon();
        setTimeout(() => {
          if (finished) return;
          try {
            const rows = game.y,
              cols = game.x;
            const temp_map = Array.from({ length: rows }, () =>
              Array.from({ length: cols }, () => MinesweeperState.BLANK),
            );
            for (let idx = 0; idx < game.f; ++idx) {
              const r = Math.floor(idx / cols),
                c = idx % cols;
              const s = game.state[idx];
              temp_map[r][c] =
                -3 === s
                  ? MinesweeperState.BLANK
                  : -4 === s
                    ? MinesweeperState.MINE_FLAG
                    : String(s);
            }
            const game_state = new MinesweeperState(0, game.m, temp_map);
            const predictions = game_state.limit_time_get_prediction(
              MapGenerator.get_NO_GUESS_TIME_LIMIT(
                MapGenerator.get_ONE_GRID_TIME_LIMIT(
                  MapGenerator.get_SINGLE_STEP_TIME_LIMIT(game.x * game.y),
                  game.x * game.y,
                ),
                game.x * game.y,
              ),
            );
            if (null === predictions || 0 === predictions.length) {
              clearTimeout(timer);
              finished = true;
              loader.stop();
              nstatus.image.src = imgs.s2;
              nstatus.tooltiptext = hintunavailable;
              return;
            }
            const random_index = Math.floor(Math.random() * predictions.length);
            const p = predictions[random_index];
            const i = p.getFirst().getFirst();
            const j = p.getFirst().getSecond();
            const act = p.getSecond();
            const o = i * cols + j;
            let e;
            ("FLAG" == (act === MinesweeperState.MINE_FLAG ? "FLAG" : "OPEN") &&
              (e = imgs.tm4),
              "OPEN" ==
                (act === MinesweeperState.MINE_FLAG ? "FLAG" : "OPEN") &&
                (e = imgs.t0),
              $(document).scrollTop(
                $(tiles[o]).offset().top - $(window).height() / 2,
              ),
              $(document).scrollLeft(
                $(tiles[o]).offset().left - $(window).width() / 2,
              ));
            var ii = tiles[o].src;
            ((state.hintat = o),
              (state.hintd = 0),
              (tiles[o].src = e),
              (state.hintinterval = setInterval(function () {
                (state.hintd++,
                  1 < state.hintd && (state.hintd = 0),
                  0 == state.hintd ? (tiles[o].src = e) : (tiles[o].src = ii));
              }, 400)),
              loader.stop());
            clearTimeout(timer);
            finished = true;
          } catch (err) {
            console.log(err);
            if (finished) return;
            clearTimeout(timer);
            finished = true;
            loader.stop();
            nstatus.image.src = imgs.s2;
            nstatus.tooltiptext = connectionfailed;
          }
        }, 0);
      })());
  }
}
function requestuncover(n) {
  var t;
  -3 == game.state[n] &&
    (game.populated
      ? uncover(n)
      : (options.disarm && (game.cheated = !0),
        3 == options.gen
          ? ((t = game.x + " " + game.y + " " + game.m + " " + n + "\n"),
            loader.start(),
            (() => {
              let finished = false;
              const timer = setTimeout(
                () => {
                  if (finished) return;
                  finished = true;
                  loader.stop();
                  nstatus.image.src = imgs.s2;
                  nstatus.tooltiptext = connectionfailed;
                },
                MapGenerator.get_NO_GUESS_TIME_LIMIT(
                  MapGenerator.get_ONE_GRID_TIME_LIMIT(
                    MapGenerator.get_SINGLE_STEP_TIME_LIMIT(game.x * game.y),
                    game.x * game.y,
                  ),
                  game.x * game.y,
                ),
              );
              const cols = game.x,
                rows = game.y;
              const first = n;
              const mines = game.m;
              set_loading_icon();
              setTimeout(() => {
                if (finished) return;
                let grid;
                try {
                  const generator = new MapGenerator();
                  grid = generator.generate_no_guess_map(
                    rows,
                    cols,
                    mines,
                    Math.floor(first / cols),
                    first % cols,
                  );
                  if (null == grid) {
                    clearTimeout(timer);
                    finished = true;
                    loader.stop();
                    nstatus.image.src = imgs.s2;
                    nstatus.tooltiptext = failedtocreateboard;
                    return;
                  }
                  for (let i = 0; i < rows; ++i)
                    for (let j = 0; j < cols; ++j) {
                      const idx = i * cols + j;
                      game.field[idx] = -1 === grid[i][j] ? -1 : 0;
                    }
                  clearTimeout(timer);
                  finished = true;
                  CreateField(n);
                  uncover(n);
                  loader.stop();
                } catch (e) {
                  if (finished) return;
                  clearTimeout(timer);
                  finished = true;
                  loader.stop();
                  nstatus.image.src = imgs.s2;
                  nstatus.tooltiptext = connectionfailed;
                  return;
                }
              }, 0);
            })())
          : (CreateField(n), uncover(n))));
}
globalThis.requestuncover = requestuncover;
globalThis.requesthint = requesthint;
