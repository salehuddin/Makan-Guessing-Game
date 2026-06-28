import { useTranslation } from "../../lib/i18n";

const CATEGORIES = [
  { slug: "signature_dish", emoji: "🍛" },
  { slug: "ambience", emoji: "🪑" },
  { slug: "exterior", emoji: "🏠" },
  { slug: "table_setting", emoji: "🍽️" },
  { slug: "staff_uniforms", emoji: "👔" },
  { slug: "menu_signage", emoji: "📋" },
  { slug: "general", emoji: "📷" },
] as const;

interface CategoryChipsProps {
  value: string;
  onChange: (slug: string) => void;
}

export function CategoryChips({ value, onChange }: CategoryChipsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 gap-3">
      {CATEGORIES.map((cat) => {
        const active = value === cat.slug;
        return (
          <button
            key={cat.slug}
            type="button"
            onClick={() => onChange(cat.slug)}
            className={`flex items-center gap-2 rounded-2xl border-2 px-4 py-3 text-sm font-semibold transition-all duration-200 active:scale-95 ${
              active
                ? "border-chili bg-chili text-white shadow-lg shadow-chili/20"
                : "border-transparent bg-white text-slate-700 shadow-sm hover:border-chili/30"
            }`}
          >
            <span className="mr-1">{cat.emoji}</span>
            {t(`category.${cat.slug}` as never)}
          </button>
        );
      })}
    </div>
  );
}

export { CATEGORIES };
