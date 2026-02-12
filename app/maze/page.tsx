"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
interface Particle {
  x: number;
  y: number;
  opacity: number;
  size: number;
}

const Maze = () => {
  const [gameover, setGameover] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [cursorImage, setCursorImage] = useState<string>("");

  const requestRef = useRef<number>();
  const [time, setTime] = useState(60);
  const [usedTiles, setUsedTiles] = useState<Set<string>>(new Set());

  const router = useRouter();

  const levels = [
    ["s", 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1],
    [1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],

    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 1], // 20th
    [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1], // 25th
    [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1], // 30th

    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1],
    [1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
    [1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],

    [1, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // 40th
    [1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1], // 45th
    [1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, "e"],
  ];

  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const avatar = localStorage.getItem("mazeAvatar") || "/ALPHA_LOGO.png";
    setCursorImage(avatar);
  }, []);

  useEffect(() => {
    if (!gameStarted || gameover) return;

    const timer = setInterval(() => {
      setTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameover(true);
          toast.error("Time's Up - Gameover");
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, gameover]);

  const handleCellEnter = async (
    r: number,
    c: number,
    cell: number | String,
  ) => {
    const key = `${r}-${c}`;

    if (!gameStarted && r === 0 && c === 0) {
      setGameStarted(true);
      setRevealed(true);
      return;
    }

    if (!gameStarted || gameover) return;

    if (cell === 1) {
      setGameover(true);
      toast.error("You touched the wall - Gameover");
      router.push("/");
      return;
    }

    if (usedTiles.has(key)) return;

    if (cell === 2) {
      setTime((prev) => prev + 20);
      setUsedTiles((prev) => new Set(prev).add(key));
      toast.info("You've reached level 2 - +20 seconds");
      return;
    }

    if (cell === 3) {
      setTime((prev) => prev + 15);
      setUsedTiles((prev) => new Set(prev).add(key));
      toast.info("You've reached level 3 - +15 seconds");
      return;
    }

    if (cell === "e") {
      setGameover(true);
      toast.success(
        "Congratulations! You've completed the maze! Go to an officer for a reward!",
      );

      const username = localStorage.getItem("mazeUsername");

      console.log(username);

      await fetch("/api/new-score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY!,
        },
        body: JSON.stringify({
          username,
        }),
      });

      router.push("/");
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    setMousePos({ x: e.clientX, y: e.clientY });

    setParticles((prev) => [
      ...prev,
      {
        x: e.clientX,
        y: e.clientY,
        opacity: 0.8,
        size: Math.random() * 4 + 2,
      },
    ]);
  };

  useEffect(() => {
    const animate = () => {
      setParticles((prev) =>
        prev
          .map((p) => ({ ...p, y: p.y - 0.5, opacity: p.opacity - 0.02 }))
          .filter((p) => p.opacity > 0),
      );
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => requestRef.current && cancelAnimationFrame(requestRef.current);
  }, []);

  return (
    <div
      className="flex flex-col h-screen cursor-none"
      onMouseMove={handleMouseMove}
    >
      <div className="p-4 text-2xl font-bold text-center">
        Finish all 3 levels in under a minute plus bonuses to win a prize
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div
          className="grid w-full h-full"
          style={{
            gridTemplateColumns: `repeat(${levels[0].length}, 1fr)`,
            gridTemplateRows: `repeat(${levels.length}, 1fr)`,
          }}
        >
          {levels.flatMap((row, r) =>
            row.map((cell, c) => {
              const isStartCell = r === 0 && c === 0;
              const isFirstColumn = c === 0;

              return (
                <div
                  key={`${r}-${c}`}
                  onMouseEnter={() => handleCellEnter(r, c, cell)}
                  className={`aspect-square border flex items-center justify-center relative text-center text-[10px] font-bold ${
                    !revealed
                      ? isStartCell
                        ? "bg-yellow-400 text-black border-black"
                        : "bg-black border-black"
                      : cell === 1
                        ? "bg-gray-800 border-black"
                        : cell === "s"
                          ? "bg-green-400 border-black"
                          : cell === "e"
                            ? "bg-green-400 border-black"
                            : cell === 2
                              ? "bg-green-400 border-black"
                              : cell === 3
                                ? "bg-green-400 border-black"
                                : "bg-white border-gray-200"
                  }`}
                >
                  {!revealed && isStartCell && <span>Hover here to start</span>}

                  {revealed && cell === "s" && (
                    <span className="text-black text-2xl">Level 1</span>
                  )}

                  {revealed && cell === "e" && (
                    <span className="text-black text-2xl">End</span>
                  )}

                  {revealed && cell === 2 && (
                    <span className="text-black">
                      Level 2<br />
                      +20 Seconds
                    </span>
                  )}

                  {revealed && cell === 3 && (
                    <span className="text-black">
                      Level 3<br />
                      +15 Seconds
                    </span>
                  )}

                  {revealed && isFirstColumn && (
                    <span className="absolute left-1 top-1 text-xl text-blue-500">
                      {r + 1}
                    </span>
                  )}
                </div>
              );
            }),
          )}
        </div>
      </div>

      {particles.map((p, i) => (
        <div
          key={i}
          className="fixed rounded-full bg-gray-800 pointer-events-none"
          style={{
            width: p.size,
            height: p.size,
            top: p.y,
            left: p.x,
            opacity: p.opacity,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}

      {cursorImage && (
        <img
          src={cursorImage}
          alt="avatar cursor"
          className="pointer-events-none rounded-full border-black border-1 fixed w-10 h-10 -translate-x-1/2 -translate-y-1/2"
          style={{ top: mousePos.y, left: mousePos.x }}
        />
      )}

      <div className="fixed top-4 right-4 text-white text-xl font-bold z-50">
        ⏱ {time}s
      </div>
    </div>
  );
};

export default Maze;
