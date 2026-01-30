import MazeGame from "./maze/MazeGame";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-900 font-sans text-zinc-100">
      <main className="flex min-h-screen w-full max-w-4xl flex-col items-center justify-start py-12 px-4 bg-transparent">
        <MazeGame />
      </main>
    </div>
  );
}
