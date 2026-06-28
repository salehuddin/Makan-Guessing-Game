import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Award, ChevronRight, Flame, History, Target, Trophy, Utensils, Zap } from "lucide-react";
import { useAuth } from "../lib/auth";
import { AdBanner } from "../components/AdBanner";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: "/login" });
    }
  }, [user, isLoading, navigate]);

  if (!user) return null;

  const guessesPlayed = user.guesses_played_count ?? 0;
  const correctGuesses = user.correct_guesses_count ?? 0;
  const accuracy = guessesPlayed > 0 ? Math.round((correctGuesses / guessesPlayed) * 100) : 0;

  return (
    <main className="flex-1 px-6 pb-32 pt-24">
      <section className="mb-8">
        <h2 className="text-xl font-black text-cream">Welcome back, {user.username}!</h2>
        <p className="mt-1 text-sm font-medium text-slate-600">Ready to test your palate today?</p>
      </section>

      <section className="mb-8">
        <div className="group relative h-72 overflow-hidden rounded-[2rem] shadow-xl shadow-chili/20">
          <img
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1000"
            alt="Daily Challenge"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-2xl border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-md">
            <Flame size={14} className="text-orange-400" />
            <span className="text-xs font-bold uppercase tracking-wide text-white">Daily Challenge</span>
          </div>
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-6">
            <div>
              <h3 className="mb-1 text-2xl font-bold text-white">Authentic Malaysian</h3>
              <p className="text-sm font-medium text-white/85">Can you identify these local hidden gems?</p>
            </div>
            <div>
              <div className="mb-2 flex items-end justify-between">
                <span className="text-sm font-medium text-white/90">Current Progress</span>
                <span className="text-lg font-bold text-white">0/5</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/20 backdrop-blur-sm">
                <div className="h-full w-0 rounded-full bg-white" />
              </div>
            </div>
            <button
              onClick={() => navigate({ to: "/daily" })}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-chili py-4 font-bold text-white shadow-lg shadow-chili/20 active:scale-95"
            >
              <span>Play Now</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-cream">Modes</h3>
          <button className="text-sm font-bold text-chili">View All</button>
        </div>
        <button
          onClick={() => navigate({ to: "/play" })}
          className="flex w-full items-center gap-4 rounded-[2rem] border border-border-soft bg-white p-5 text-left shadow-sm transition-colors hover:border-chili/30"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
            <Zap size={28} fill="currentColor" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-bold text-cream">Classic Mode</h4>
            <p className="text-sm font-medium text-slate-600">Speed-guess random restaurants</p>
          </div>
          <div className="rounded-full bg-gray-50 p-2 text-gray-400">
            <ChevronRight size={20} />
          </div>
        </button>
      </section>

      <section className="mb-8">
        <h3 className="mb-4 text-lg font-bold text-cream">Statistics</h3>
        <div className="flex gap-4">
          <StatCard label="Total Guesses" value={String(guessesPlayed)} icon={<Target size={16} />} color="bg-blue-500" />
          <StatCard label="Accuracy" value={`${accuracy}%`} icon={<Trophy size={16} />} color="bg-amber-500" />
        </div>
      </section>

      <section className="mb-4 grid grid-cols-2 gap-4">
        <MiniCard icon={<History className="text-indigo-500" />} label="Past Guesses" value={String(guessesPlayed)} />
        <MiniCard icon={<Award className="text-rose-500" />} label="XP Total" value={String(user.xp_total)} />
      </section>

      <AdBanner placement="home_banner" />

      <section className="mt-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-indigo-600 p-6 text-white">
          <div className="relative z-10">
            <h4 className="mb-2 flex items-center gap-2 text-lg font-bold">
              <Utensils size={18} />
              <span>Foodie Tip</span>
            </h4>
            <p className="text-sm leading-relaxed text-indigo-100">
              Nasi lemak is often called Malaysia's national dish. Try identifying the variations from different states!
            </p>
          </div>
          <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -left-10 top-0 h-24 w-24 rounded-full bg-indigo-400/20 blur-xl" />
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="flex-1 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full text-white ${color}`}>{icon}</div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-xl font-bold text-cream">{value}</p>
    </div>
  );
}

function MiniCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-3xl border border-dashed border-gray-200 bg-gray-50/50 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">{icon}</div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-tight text-slate-500">{label}</p>
        <p className="font-bold text-cream">{value}</p>
      </div>
    </div>
  );
}
