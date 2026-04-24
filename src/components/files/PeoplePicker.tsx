import { useState, useRef, useEffect } from "react";
import {
  Input,
  Text,
  Spinner,
  Button,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { Person20Regular, Dismiss12Regular } from "@fluentui/react-icons";
import { useAuth } from "../../auth/useAuth";
import { searchUsers } from "../../api/usersApi";

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
    maxHeight: "220px",
    overflowY: "auto",
  },
  dropdownItem: {
    padding: "8px 12px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    "&:last-child": { borderBottom: "none" },
    "&:hover": { backgroundColor: tokens.colorNeutralBackground1Hover },
  },
  itemName: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  itemEmail: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  noResults: {
    padding: "10px 12px",
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    fontStyle: "italic",
  },

  // ── Selected people tags ──
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
    padding: "3px 10px 3px 10px",
    backgroundColor: tokens.colorBrandBackground2,
    borderRadius: tokens.borderRadiusCircular,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorBrandForeground2,
    fontWeight: tokens.fontWeightSemibold,
    maxWidth: "300px",
    overflow: "hidden",
  },
  tagEmail: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  tagRemove: {
    minWidth: "unset",
    height: "auto",
    padding: "0",
    color: tokens.colorBrandForeground2,
    flexShrink: 0,
  },
});

interface Props {
  selected: string[];
  onChange: (emails: string[]) => void;
  disabled?: boolean;
}

export function PeoplePicker({ selected, onChange, disabled }: Props) {
  const styles = useStyles();
  const { getToken } = useAuth();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ name: string; email: string }[]>([]);
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
        const users = await searchUsers(token, value.trim());
        // Filter out already-selected users
        setResults(users.filter((u) => !selected.includes(u.email)));
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

  const addUser = (email: string) => {
    if (!selected.includes(email)) {
      onChange([...selected, email]);
    }
    setQuery("");
    setResults([]);
    setShowDropdown(false);
    setSearched(false);
  };

  const removeUser = (email: string) => {
    onChange(selected.filter((e) => e !== email));
  };

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      {/* Search input */}
      <Input
        value={query}
        onChange={(_, d) => handleInput(d.value)}
        placeholder="Tapez un nom pour rechercher…"
        disabled={disabled}
        contentBefore={<Person20Regular />}
        contentAfter={loading ? <Spinner size="tiny" /> : undefined}
      />

      {/* Suggestion dropdown */}
      {showDropdown && (
        <div className={styles.dropdown}>
          {results.length > 0 ? (
            results.map((user) => (
              <div
                key={user.email}
                className={styles.dropdownItem}
                // onMouseDown prevents the input blur from closing dropdown before click fires
                onMouseDown={(e) => {
                  e.preventDefault();
                  addUser(user.email);
                }}
              >
                <Text className={styles.itemName}>{user.name}</Text>
                <Text className={styles.itemEmail}>{user.email}</Text>
              </div>
            ))
          ) : searched && !loading ? (
            <Text className={styles.noResults}>Aucun utilisateur trouvé.</Text>
          ) : null}
        </div>
      )}

      {/* Selected users as tags */}
      {selected.length > 0 && (
        <div className={styles.tags}>
          {selected.map((email) => (
            <div key={email} className={styles.tag}>
              <span className={styles.tagEmail} title={email}>
                {email}
              </span>
              <Button
                className={styles.tagRemove}
                appearance="transparent"
                size="small"
                icon={<Dismiss12Regular />}
                onClick={() => removeUser(email)}
                disabled={disabled}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
