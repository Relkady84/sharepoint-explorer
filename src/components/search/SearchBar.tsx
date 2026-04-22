import { useState, useEffect, useCallback } from "react";
import { SearchBox, makeStyles } from "@fluentui/react-components";
import { useNavigationStore } from "../../store/navigationStore";

const useStyles = makeStyles({
  root: {
    width: "280px",
    "@media (max-width: 768px)": {
      width: "180px",
    },
  },
});

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function SearchBar() {
  const styles = useStyles();
  const { setSearchQuery, driveId } = useNavigationStore();
  const [inputValue, setInputValue] = useState("");
  const debouncedValue = useDebounce(inputValue, 300);

  useEffect(() => {
    setSearchQuery(debouncedValue);
  }, [debouncedValue, setSearchQuery]);

  const handleChange = useCallback(
    (_: unknown, data: { value: string }) => {
      setInputValue(data.value);
      if (!data.value) setSearchQuery("");
    },
    [setSearchQuery]
  );

  return (
    <SearchBox
      className={styles.root}
      placeholder={driveId ? "Search files..." : "Select a site first"}
      value={inputValue}
      onChange={handleChange}
      disabled={!driveId}
      size="medium"
    />
  );
}
