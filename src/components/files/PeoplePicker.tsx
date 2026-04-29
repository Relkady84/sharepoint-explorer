import { useState, useRef, useEffect } from "react";
import {
  Input,
  Text,
  Spinner,
  Button,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { Person20Regular, People20Regular, Dismiss12Regular } from "@fluentui/react-icons";
import { useAuth } from "../../auth/useAuth";
import { searchUsers } from "../../api/usersApi";
import { searchGroups } from "../../api/groupsApi";

const useStyles = makeStyles({
  wrapper: { position: "relative" },

  // ── Suggestion dropdown ──
  dropdown: {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 0,
    right: 0,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow16,
    zIndex: 9999,
    maxHeight: "260px",
    overflowY: "auto",
  },
  dropdownItem: {
    padding: "8px 12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    "&:last-child": { borderBottom: "none" },
    "&:hover": { backgroundColor: tokens.colorNeutralBackground1Hover },
  },
  dropdownIcon: {
    flexShrink: 0,
    color: tokens.colorNeutralForeground3,
  },
  dropdownIconGroup: {
    flexShrink: 0,
    color: tokens.colorBrandForeground1,
  },
  itemText: {
    display: "flex",
    flexDirection: "column",
    gap: "1px",
    overflow: "hidden",
  },
  itemName: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  itemSubtitle: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  itemSubtitleGroup: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorBrandForeground2,
    fontWeight: tokens.fontWeightSemibold,
  },
  noResults: {
    padding: "10px 12px",
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    fontStyle: "italic",
  },

  // ── Selected people/group tags ──
  tags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginTop: "8px",
  },
  tag: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "3px 10px 3px 8px",
    backgroundColor: tokens.colorBrandBackground2,
    borderRadius: tokens.borderRadiusCircular,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorBrandForeground2,
    fontWeight: tokens.fontWeightSemibold,
    maxWidth: "300px",
    overflow: "hidden",
  },
  tagLabel: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  tagIcon: {
    flexShrink: 0,
    color: tokens.colorBrandForeground2,
  },
  tagRemove: {
    minWidth: "unset",
    height: "auto",
    padding: "0",
    color: tokens.colorBrandForeground2,
    flexShrink: 0,
  },
});

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Build the stored key for a group: "grp:{objectId}:{displayName}" */
export function makeGroupKey(id: string, name: string): string {
  return `grp:${id}:${name}`;
}

/** Extract the display label from any stored entry (email or grp: key). */
export function getPrincipalLabel(entry: string): string {
  if (entry.startsWith("grp:")) {
    // Format: grp:{id}:{name} — name is everything after the second colon
    const third = entry.indexOf(":", 4); // first ":" is at index 3 (after "grp")
    return third >= 0 ? entry.slice(third + 1) : entry;
  }
  return entry;
}

/** Returns true if the entry represents a group. */
export function isGroupEntry(entry: string): boolean {
  return entry.startsWith("grp:");
}

// ── Combined result type ────────────────────────────────────────────────────────

interface ResultItem {
  key: string;       // stored value: email for users, "grp:{id}:{name}" for groups
  name: string;      // display name
  subtitle: string;  // email for users, "Groupe" for groups
  kind: "user" | "group";
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  selected: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
}

export function PeoplePicker({ selected, onChange, disabled }: Props) {
  const styles = useStyles();
  const { getToken } = useAuth();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searched, setSearched] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleInput = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      setSearched(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const [users, groups] = await Promise.all([
          searchUsers(token, value.trim()),
          searchGroups(token, value.trim()),
        ]);

        const userItems: ResultItem[] = users
          .filter((u) => !selected.includes(u.email))
          .map((u) => ({ key: u.email, name: u.name, subtitle: u.email, kind: "user" }));

        const groupItems: ResultItem[] = groups
          .filter((g) => !selected.includes(makeGroupKey(g.id, g.name)))
          .map((g) => ({ key: makeGroupKey(g.id, g.name), name: g.name, subtitle: "Groupe", kind: "group" }));

        setResults([...userItems, ...groupItems]);
        setShowDropdown(true);
        setSearched(true);
      } catch {
        setResults([]);
        setSearched(true);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const addEntry = (key: string) => {
    if (!selected.includes(key)) {
      onChange([...selected, key]);
    }
    setQuery("");
    setResults([]);
    setShowDropdown(false);
    setSearched(false);
  };

  const removeEntry = (key: string) => {
    onChange(selected.filter((e) => e !== key));
  };

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      {/* Search input */}
      <Input
        value={query}
        onChange={(_, d) => handleInput(d.value)}
        placeholder="Tapez un nom pour rechercher un utilisateur ou groupe…"
        disabled={disabled}
        contentBefore={<Person20Regular />}
        contentAfter={loading ? <Spinner size="tiny" /> : undefined}
      />

      {/* Suggestion dropdown */}
      {showDropdown && (
        <div className={styles.dropdown}>
          {results.length > 0 ? (
            results.map((item) => (
              <div
                key={item.key}
                className={styles.dropdownItem}
                // onMouseDown prevents input blur from closing dropdown before click fires
                onMouseDown={(e) => {
                  e.preventDefault();
                  addEntry(item.key);
                }}
              >
                {item.kind === "group" ? (
                  <People20Regular className={styles.dropdownIconGroup} />
                ) : (
                  <Person20Regular className={styles.dropdownIcon} />
                )}
                <div className={styles.itemText}>
                  <Text className={styles.itemName}>{item.name}</Text>
                  <Text className={item.kind === "group" ? styles.itemSubtitleGroup : styles.itemSubtitle}>
                    {item.subtitle}
                  </Text>
                </div>
              </div>
            ))
          ) : searched && !loading ? (
            <Text className={styles.noResults}>Aucun utilisateur ou groupe trouvé.</Text>
          ) : null}
        </div>
      )}

      {/* Selected tags */}
      {selected.length > 0 && (
        <div className={styles.tags}>
          {selected.map((entry) => (
            <div key={entry} className={styles.tag}>
              {isGroupEntry(entry) ? (
                <People20Regular style={{ width: 14, height: 14 }} className={styles.tagIcon} />
              ) : (
                <Person20Regular style={{ width: 14, height: 14 }} className={styles.tagIcon} />
              )}
              <span className={styles.tagLabel} title={entry}>
                {getPrincipalLabel(entry)}
              </span>
              <Button
                className={styles.tagRemove}
                appearance="transparent"
                size="small"
                icon={<Dismiss12Regular />}
                onClick={() => removeEntry(entry)}
                disabled={disabled}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
