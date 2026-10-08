import GameArena from '@/components/GameArena';
import VantaBackground from '@/components/VantaBackground';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] text-gray-100 selection:bg-red-500/30">
      <VantaBackground />
      <div className="relative z-10">
        <GameArena />
      </div>
    </main>
  );
}
