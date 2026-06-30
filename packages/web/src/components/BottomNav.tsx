import { Link, useLocation } from "@tanstack/react-router";
import { Calendar, Home, PlusSquare, Trophy, User } from "lucide-react";

const items = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/daily", icon: Calendar, label: "Daily" },
  { to: "/play", icon: Trophy, label: "Classic" },
  { to: "/upload", icon: PlusSquare, label: "Submit" },
  { to: "/profile", icon: User, label: "Me" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <div className="fixed bottom-5 left-1/2 z-50 w-[90%] max-w-lg -translate-x-1/2">
      <nav className="glass-effect flex items-center justify-around rounded-[2.25rem] border border-white/70 p-2 shadow-2xl">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center gap-1 rounded-3xl px-3 py-2 transition-all duration-300 active:scale-95 ${
                active ? "bg-chili text-white" : "text-slate-500 hover:bg-black/5 hover:text-cream"
              }`}
            >
              <Icon size={active ? 23 : 21} />
              <span className={`text-[11px] font-bold ${active ? "block" : "hidden"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
