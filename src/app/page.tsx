import RopeSurvivalGame from "@/components/rope-survival-game";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground overflow-hidden">
      <RopeSurvivalGame />
    </main>
  );
}
