"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { availableOfficerFiles, roster } from "./rosterData";

type Difficulty = "Easy" | "Medium" | "Hard";

const DIFFICULTY_SIZE: Record<Difficulty, number> = {
  Easy: 13,
  Medium: 19,
  Hard: 27,
};
const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  Easy: 10,
  Medium: 50,
  Hard: 100,
};

function generateMaze(rows: number, cols: number) {
  if (rows % 2 === 0) rows -= 1;
  if (cols % 2 === 0) cols -= 1;

  const grid = Array.from({ length: rows }, () => Array(cols).fill(0));

  const startR = 1;
  const startC = 1;
  grid[startR][startC] = 1;

  const stack: [number, number][] = [[startR, startC]];
  const dirs: [number, number][] = [
    [0, 2],
    [2, 0],
    [0, -2],
    [-2, 0],
  ];

  while (stack.length) {
    const [r, c] = stack[stack.length - 1];

    const neighbors: [number, number, number, number][] = [];
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr > 0 && nr < rows && nc > 0 && nc < cols && grid[nr][nc] === 0) {
        neighbors.push([nr, nc, dr, dc]);
      }
    }

    if (neighbors.length === 0) {
      stack.pop();
      continue;
    }

    const idx = Math.floor(Math.random() * neighbors.length);
    const [nr, nc, dr, dc] = neighbors[idx];

    grid[r + dr / 2][c + dc / 2] = 1;
    grid[nr][nc] = 1;
    stack.push([nr, nc]);
  }

  return grid;
}

export default function MazeGame() {
  const [username, setUsername] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("Easy");
  const [started, setStarted] = useState(false);
  const [grid, setGrid] = useState<number[][] | null>(null);
  const [player, setPlayer] = useState<[number, number] | null>(null);
  const [exit, setExit] = useState<[number, number] | null>(null);
  const [moves, setMoves] = useState(0);
  const [timeSec, setTimeSec] = useState(0);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[] | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const timerRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [cellSize, setCellSize] = useState(24);
  const [selectedAvatar, setSelectedAvatar] =
    useState<string>("/ALPHA_LOGO.png");

  function normalize(s: string) {
    return s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
  }

  const playable = roster.flatMap((r) => {
    const target = normalize(r.last);
    const found = availableOfficerFiles.find(
      (f) => normalize(f.replace(/\.[^/.]+$/, "")) === target,
    );

    if (!found) return [];

    return [
      {
        ...r,
        avatar: `/officers/${found}`,
      },
    ];
  });

  const usedFiles = new Set(
    playable.map((p) => p.avatar.replace("/officers/", "")),
  );

  const former = availableOfficerFiles
    .filter((f) => !usedFiles.has(f))
    .map((f) => {
      const fileKey = normalize(f.replace(/\.[^/.]+$/, ""));
      const entry = roster.find((r) => normalize(r.last) === fileKey);

      return {
        filename: f,
        avatar: `/officers/${f}`,
        label: entry
          ? `${entry.name} — Former ${entry.role}`
          : `${fileKey} — Former officer`,
      };
    });

  const [visibleGroup, setVisibleGroup] = useState<string>("All");

  const allGroups = Array.from(new Set(roster.map((r) => r.group)));
  const secretariesMap: Record<string, (typeof roster)[0]> = roster
    .filter((r) => r.group === "Secretaries")
    .reduce(
      (acc, cur) => {
        acc[normalize(cur.name)] = cur;
        return acc;
      },
      {} as Record<string, (typeof roster)[0]>,
    );
  const uniqueSecretaries = Object.values(secretariesMap);
  const secretaryNameSet = new Set(
    uniqueSecretaries.map((s) => normalize(s.name)),
  );

  function playableByGroup(group: string) {
    if (group === "Former officers") return [];
    if (group === "All") {
      const map = new Map<string, (typeof playable)[0]>();
      for (const p of playable) {
        const key = normalize(p.name);
        if (!map.has(key)) map.set(key, p);
      }
      return Array.from(map.values());
    }

    return playable.filter((p) => p.group === group);
  }

  useEffect(() => {
    function handleResize() {
      if (!containerRef.current || !grid) return;
      const cols = grid[0].length;
      const width = containerRef.current.clientWidth - 16;
      const maxCell = Math.floor(width / cols);
      setCellSize(Math.max(12, Math.min(32, maxCell)));
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [grid]);

  useEffect(() => {
    if (started) {
      timerRef.current = window.setInterval(() => {
        setTimeSec((t) => t + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [started]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (!started || !grid || !player) return;
      const key = e.key;
      const dirMap: Record<string, [number, number]> = {
        ArrowUp: [-1, 0],
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1],
        w: [-1, 0],
        s: [1, 0],
        a: [0, -1],
        d: [0, 1],
      };
      const d = dirMap[key];
      if (!d) return;
      e.preventDefault();
      movePlayer(d[0], d[1]);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [started, grid, player]);

  function startGame() {
    let maze = grid;
    if (!maze) {
      const size = DIFFICULTY_SIZE[difficulty];
      maze = generateMaze(size, size);
    }
    setGrid(maze);
    setPlayer([1, 1]);
    setMoves(0);
    setTimeSec(0);
    setStarted(true);
  }

  function resetGame() {
    setStarted(false);
    setGrid(null);
    setPlayer(null);
    setMoves(0);
    setTimeSec(0);
    setExit(null);
  }

  function computeFarthestCell(fromR: number, fromC: number, grid: number[][]) {
    const rows = grid.length;
    const cols = grid[0].length;
    const q: [number, number][] = [[fromR, fromC]];
    const dist = Array.from({ length: rows }, () => Array(cols).fill(-1));
    dist[fromR][fromC] = 0;
    let far: [number, number] = [fromR, fromC];

    const neigh = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];

    while (q.length) {
      const [r, c] = q.shift()!;
      for (const [dr, dc] of neigh) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
        if (grid[nr][nc] === 0) continue;
        if (dist[nr][nc] !== -1) continue;
        dist[nr][nc] = dist[r][c] + 1;
        q.push([nr, nc]);
        if (dist[nr][nc] > dist[far[0]][far[1]]) far = [nr, nc];
      }
    }

    return far;
  }

  function regenerateMaze(d: Difficulty) {
    if (!username) {
      setSubmitStatus("Please enter a username before changing difficulty.");
      return;
    }
    const size = DIFFICULTY_SIZE[d];
    const maze = generateMaze(size, size);

    const far = computeFarthestCell(1, 1, maze);
    setGrid(maze);
    setPlayer([1, 1]);
    setExit(far);
    setMoves(0);
    setTimeSec(0);
    setStarted(false);
    setSubmitStatus(null);
  }

  function movePlayer(dr: number, dc: number) {
    if (!player || !grid) return;
    const [r, c] = player;
    const nr = r + dr;
    const nc = c + dc;
    if (nr < 0 || nc < 0 || nr >= grid.length || nc >= grid[0].length) return;
    if (grid[nr][nc] === 0) return;
    setPlayer([nr, nc]);
    setMoves((m) => m + 1);

    const end = exit || [grid.length - 2, grid[0].length - 2];
    if (nr === end[0] && nc === end[1]) {
      setStarted(false);
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;

      const baseScore = 10000 / ((timeSec + 1) * (moves + 1));
      const difficultyBonus = DIFFICULTY_MULTIPLIER[difficulty];

      const score = Math.max(1, Math.round(baseScore * difficultyBonus));

      setLastScore(score);
      setFinished(true);
    }
  }

  async function postScore(payload: {
    username: string;
    difficulty: Difficulty;
    score: number;
    time: number;
  }) {
    if (!payload.username) return;
    try {
      setSubmitStatus("saving");
      const res = await fetch("/api/new-score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "maze-game-alpha",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSubmitStatus(`error: ${data?.message || res.statusText}`);
      } else {
        setSubmitStatus("saved");

        fetchLeaderboard().catch(() => {});
      }
    } catch (err) {
      setSubmitStatus(`error: ${(err as Error).message}`);
    }
  }

  async function fetchLeaderboard() {
    setLeaderboardLoading(true);
    try {
      const res = await fetch("/api/leaderboard", {
        headers: { "x-api-key": "maze-game-alpha" },
      });
      if (!res.ok) {
        setLeaderboard([]);
        return;
      }
      const data = await res.json();
      const items = Array.isArray(data.scores)
        ? data.scores
        : data.scores || [];
      setLeaderboard(items);
    } catch (err) {
      setLeaderboard([]);
      console.error(err);
    } finally {
      setLeaderboardLoading(false);
    }
  }

  useEffect(() => {
    fetchLeaderboard().catch(() => {});
    const id = setInterval(() => {
      fetchLeaderboard().catch(() => {});
    }, 10000);
    return () => clearInterval(id);
  }, []);

  function renderGrid() {
    if (!grid) return null;
    const rows = grid.length;
    const cols = grid[0].length;

    return (
      <div
        className="mx-auto overflow-auto"
        style={{ width: Math.min(cols * cellSize, 800) }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
            gap: 0,
          }}
        >
          {grid.flatMap((row, r) =>
            row.map((cell, c) => {
              const isPlayer = player && player[0] === r && player[1] === c;
              const isExit = exit
                ? r === exit[0] && c === exit[1]
                : r === rows - 2 && c === cols - 2;
              const bg =
                cell === 1
                  ? isPlayer
                    ? "#ef4444"
                    : isExit
                      ? "#10b981"
                      : "#f8f8f8"
                  : "#111827";
              return (
                <div
                  key={`${r}-${c}`}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    background: bg,
                    boxSizing: "border-box",
                    border: cell === 1 ? "1px solid #e5e7eb" : undefined,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isPlayer && (
                    <div
                      style={{
                        width: Math.max(8, cellSize - 6),
                        height: Math.max(8, cellSize - 6),
                        position: "relative",
                      }}
                    >
                      <Image
                        src={selectedAvatar}
                        alt="player"
                        fill
                        style={{ objectFit: "cover", borderRadius: 4 }}
                      />
                    </div>
                  )}
                </div>
              );
            }),
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-2xl font-semibold mb-4">Maze Game</h2>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex-1">
            <div className="text-sm text-zinc-600 mb-1">Username</div>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
              placeholder="Enter your name"
            />
          </label>

          <div className="mt-2 sm:mt-0">
            <div className="text-sm text-zinc-600 mb-1">Difficulty</div>
            <div className="flex gap-2">
              {(["Easy", "Medium", "Hard"] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setDifficulty(d);
                    regenerateMaze(d);
                  }}
                  className={`rounded-md px-3 py-2 border ${difficulty === d ? "bg-black text-white" : "bg-white text-black"}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-zinc-300 mb-2">Choose your avatar</div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-400">Group</label>
              <select
                value={visibleGroup}
                onChange={(e) => setVisibleGroup(e.target.value)}
                className="rounded border bg-zinc-900 text-zinc-100 px-2 py-1 text-sm"
              >
                <option>All</option>
                {allGroups.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-2">
            <div className="flex flex-wrap gap-2">
              {visibleGroup === "Former officers" ? (
                <details className="w-full text-sm text-zinc-400">
                  <summary className="cursor-pointer">
                    Former officers ({former.length})
                  </summary>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {former.map((f) => (
                      <button
                        key={f.filename}
                        onClick={() => setSelectedAvatar(f.avatar)}
                        className={`w-12 h-12 rounded overflow-hidden border ${selectedAvatar === f.avatar ? "ring-2 ring-green-500" : "border-zinc-700"}`}
                        title={f.label}
                      >
                        <Image
                          src={f.avatar}
                          alt={f.label}
                          width={48}
                          height={48}
                          style={{ objectFit: "cover" }}
                        />
                      </button>
                    ))}
                  </div>
                </details>
              ) : (
                playableByGroup(visibleGroup).map((p) => (
                  <button
                    key={`${p.group}-${p.name}`}
                    onClick={() => setSelectedAvatar(p.avatar)}
                    className={`w-14 h-14 rounded overflow-hidden border ${selectedAvatar === p.avatar ? "ring-2 ring-green-500" : "border-zinc-700"}`}
                    title={`${p.name} — ${p.role}`}
                  >
                    <Image
                      src={p.avatar}
                      alt={p.name}
                      width={56}
                      height={56}
                      style={{ objectFit: "cover" }}
                    />
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="mt-2 text-sm text-zinc-400">
            {(() => {
              if (!selectedAvatar) return <span>None selected</span>;
              const p = playable.find((x) => x.avatar === selectedAvatar);
              if (p)
                return (
                  <span>
                    {p.name} — {p.role}
                  </span>
                );
              const f = former.find((x) => x.avatar === selectedAvatar);
              if (f) return <span>{f.label} — Former officer</span>;
              return <span>Custom avatar</span>;
            })()}
          </div>
        </div>

        <div className="mb-4 flex gap-2">
          <button
            disabled={!username}
            onClick={startGame}
            className="px-4 py-2 rounded bg-foreground text-background disabled:opacity-50"
          >
            Start
          </button>
          <button onClick={resetGame} className="px-4 py-2 rounded border">
            Reset
          </button>
        </div>

        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-zinc-700">
            Player: {username || "—"}
            {selectedAvatar &&
              (() => {
                const p = playable.find((x) => x.avatar === selectedAvatar);
                return p ? (
                  <span className="text-xs text-zinc-400 ml-2">
                    {" "}
                    — {p.name} • {p.role}
                  </span>
                ) : null;
              })()}
          </div>
          <div className="text-sm text-zinc-700">Difficulty: {difficulty}</div>
          <div className="text-sm text-zinc-700">
            Moves: {moves} • Time: {timeSec}s
          </div>
        </div>

        <div className="mb-3">
          {submitStatus === "saving" && (
            <div className="text-sm text-zinc-600">Saving score...</div>
          )}
          {submitStatus?.startsWith("error") && (
            <div className="text-sm text-red-600">{submitStatus}</div>
          )}
          {submitStatus === "saved" && (
            <div className="text-sm text-green-600">
              Score saved to leaderboard.
            </div>
          )}
        </div>

        <div ref={containerRef} className="mb-4">
          {renderGrid()}
        </div>

        {finished && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
            <div className="bg-zinc-900 text-zinc-100 p-6 rounded shadow-lg max-w-sm w-full border border-zinc-800">
              <h3 className="text-lg font-semibold mb-2">You finished!</h3>
              <p className="text-sm text-zinc-300">Player: {username}</p>
              <p className="text-sm text-zinc-300">Difficulty: {difficulty}</p>
              <p className="text-sm text-zinc-300">Time: {timeSec}s</p>
              <p className="text-sm text-zinc-300">Moves: {moves}</p>
              <p className="text-sm text-zinc-200">
                Score: <span className="font-semibold">{lastScore}</span>
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  className="px-3 py-2 rounded bg-green-600 text-white"
                  onClick={async () => {
                    if (lastScore != null) {
                      await postScore({
                        username,
                        difficulty,
                        score: lastScore,
                        time: timeSec,
                      });
                      await fetchLeaderboard();
                    }
                    setFinished(false);
                  }}
                >
                  Save & Close
                </button>
                <button
                  className="px-3 py-2 rounded border border-zinc-700 text-zinc-100"
                  onClick={() => {
                    setFinished(false);
                    startGame();
                  }}
                >
                  Play again
                </button>
                <button
                  className="px-3 py-2 rounded border border-zinc-700 text-zinc-100"
                  onClick={() => {
                    setFinished(false);
                    regenerateMaze(difficulty);
                  }}
                >
                  New maze
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="flex gap-2 justify-center items-center">
          <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
            <div />
            <button
              onClick={() => movePlayer(-1, 0)}
              className="px-3 py-2 rounded border"
            >
              ↑
            </button>
            <div />
            <button
              onClick={() => movePlayer(0, -1)}
              className="px-3 py-2 rounded border"
            >
              ←
            </button>
            <div />
            <button
              onClick={() => movePlayer(0, 1)}
              className="px-3 py-2 rounded border"
            >
              →
            </button>
            <div />
            <button
              onClick={() => movePlayer(1, 0)}
              className="px-3 py-2 rounded border"
            >
              ↓
            </button>
            <div />
          </div>
        </div>
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium">Leaderboard</h3>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 rounded border"
                onClick={() => fetchLeaderboard()}
              >
                Refresh
              </button>
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded p-3 text-zinc-100">
            {leaderboard === null && (
              <div className="text-sm text-zinc-400">
                No scores yet. Waiting for data...
              </div>
            )}
            {leaderboard && leaderboard.length === 0 && (
              <div className="text-sm text-zinc-400">No scores available.</div>
            )}
            {leaderboard && leaderboard.length > 0 && (
              <div className="space-y-2">
                {leaderboard
                  .sort((a, b) => b.score - a.score)
                  .slice(0, 10)
                  .map((s, i) => (
                    <div
                      key={s._id}
                      className="flex items-center justify-between gap-3 p-2 rounded bg-zinc-800/40"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center font-semibold">
                          {i + 1}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-zinc-100">
                            {s.username}
                          </div>
                          <div className="text-xs text-zinc-400">
                            {s.difficulty} •{" "}
                            {new Date(s.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-zinc-100">
                        {s.score} pts
                      </div>
                    </div>
                  ))}
              </div>
            )}
            {leaderboardLoading && (
              <div className="text-xs text-zinc-500 mt-2">Refreshing...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
