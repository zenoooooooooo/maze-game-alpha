"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { availableOfficerFiles, roster } from "./rosterData";

export default function Start() {
  const [username, setUsername] = useState("");
  const [selectedAvatar, setSelectedAvatar] =
    useState<string>("/ALPHA_LOGO.png");
  const [visibleGroup, setVisibleGroup] = useState<string>("All");

  const router = useRouter();

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

  const allGroups = Array.from(new Set(roster.map((r) => r.group)));

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

  function startGame() {
    if (!username) {
      alert("Please enter your username before starting.");
      return;
    }

    localStorage.setItem("mazeUsername", username);
    localStorage.setItem("mazeAvatar", selectedAvatar);

    router.push("/maze");
  }

  return (
    <div className="w-full max-w-4xl px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-col mb-6">
          <div className="flex items-center mb-2">
            <Image
              src="/ALPHA_LOGO.png"
              alt="Alpha Logo"
              width={48}
              height={48}
              style={{ objectFit: "contain" }}
              className="rounded-full mr-2 border-2 border-zinc-700 p-1 bg-zinc-800"
            />
            <h2 className="text-3xl font-bold text-white tracking-wide drop-shadow-md">
              Maze Game
            </h2>
          </div>
          <p className="text-sm text-zinc-300 italic">
            Complete all three levels and win an exclusive prize!
          </p>
        </div>

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

          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {visibleGroup === "Former officers"
              ? former.map((f) => (
                  <button
                    key={f.filename}
                    onClick={() => setSelectedAvatar(f.avatar)}
                    className={`w-12 h-12 rounded overflow-hidden border cursor-pointer ${
                      selectedAvatar === f.avatar
                        ? "ring-2 ring-green-500"
                        : "border-zinc-700"
                    }`}
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
                ))
              : playableByGroup(visibleGroup).map((p) => (
                  <button
                    key={`${p.group}-${p.name}`}
                    onClick={() => setSelectedAvatar(p.avatar)}
                    className={`w-14 h-14 rounded overflow-hidden border cursor-pointer  ${
                      selectedAvatar === p.avatar
                        ? "ring-2 ring-green-500"
                        : "border-zinc-700"
                    }`}
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
                ))}
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

        <div className="w-full flex justify-center">
          <button
            onClick={startGame}
            className="mt-2 px-6 py-2 bg-green-600 text-white font-semibold rounded-md cursor-pointer"
          >
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
}
