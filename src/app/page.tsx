import RopeSurvivalGame from "@/components/rope-survival-game";

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 text-foreground">
      <div className="grid grid-cols-1 items-start justify-center gap-8 lg:grid-cols-2">
        <div className="flex flex-col items-center justify-center">
          <h2 className="mb-4 text-2xl font-bold text-primary">
            Màn hình của bạn
          </h2>
          <RopeSurvivalGame
            isPlayerControlled={true}
          />
        </div>
        <div className="flex flex-col items-center justify-center">
          <h2 className="mb-4 text-2xl font-bold text-secondary">
            Trợ lý AI đang chơi
          </h2>
          <RopeSurvivalGame
            isPlayerControlled={false}
          />
        </div>
      </div>
    </main>
  );
}
