interface EmptyStateProps {
  icon: string;
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="text-4xl guesseat-pop-in">{icon}</span>
      <h3 className="text-lg font-black font-display text-cream">{title}</h3>
      {message && <p className="text-sm font-medium text-slate-600 max-w-xs">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
