import "./SearchFilterBar.css";

interface SearchFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  termValue?: string;
  onTermChange?: (value: string) => void;
  termOptions?: string[];
  searchPlaceholder?: string;
  /** Set to false to hide the Term dropdown entirely */
  showTermFilter?: boolean;
}

export default function SearchFilterBar({
  searchValue,
  onSearchChange,
  termValue = "",
  onTermChange,
  termOptions = [],
  searchPlaceholder = "Search...",
  showTermFilter = true,
}: SearchFilterBarProps) {
  return (
    <div className="sfb-row">
      {/* Search input */}
      <div className="sfb-search-wrap">
        <span className="sfb-search-icon" aria-hidden="true">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </span>
        <input
          type="text"
          className="sfb-search"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Term dropdown — only shown when there are options or an active value */}
      {showTermFilter && (
        <select
          className="sfb-term"
          value={termValue}
          onChange={(e) => onTermChange?.(e.target.value)}
        >
          <option value="">All Terms</option>
          {termOptions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
