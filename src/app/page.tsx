import RopeSurvivalGame from "@/components/rope-survival-game";

export default function Home() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background text-foreground overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 w-full h-full">
        <div className="flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold text-primary mb-4">Màn hình của bạn</h2>
            <RopeSurvivalGame isPlayerControlled={true} />
        </div>
        <div className="flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold text-secondary mb-4">Trợ lý AI đang chơi</h2>
            <RopeSurvivalGame isPlayerControlled={false} />
        </div>
      </div>
    </main>
  );
}
