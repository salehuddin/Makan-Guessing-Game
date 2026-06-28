interface OptionButtonProps {
  label: string;
  selected: boolean;
  disabled: boolean;
  state?: "default" | "correct" | "wrong";
  onClick: () => void;
}

export function OptionButton({
  label,
  selected,
  disabled,
  state = "default",
  onClick,
}: OptionButtonProps) {
  let stateClasses = "border-border-soft bg-white text-cream shadow-sm hover:border-chili/50 hover:shadow-md";

  if (state === "correct") {
    stateClasses = "border-pandan bg-green-50 text-green-700 ring-2 ring-green-100";
  } else if (state === "wrong") {
    stateClasses = "border-chili bg-red-50 text-chili ring-2 ring-red-100";
  } else if (selected) {
    stateClasses = "border-chili bg-red-50 text-chili ring-2 ring-red-100";
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full min-h-[60px] rounded-2xl border-2 px-4 py-3 text-left text-sm font-bold leading-snug transition-all duration-200 active:scale-95 disabled:opacity-70 ${stateClasses}`}
    >
      {label}
    </button>
  );
}
