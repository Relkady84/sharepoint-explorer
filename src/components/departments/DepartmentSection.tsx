import { useState } from "react";
import {
  makeStyles,
  mergeClasses,
  tokens,
  Text,
  Button,
  Badge,
  Spinner,
  Tooltip,
} from "@fluentui/react-components";
import {
  FolderRegular,
  FolderOpenRegular,
  ChevronDown20Regular,
  ChevronRight20Regular,
  ArrowDownload20Regular,
  Open20Regular,
} from "@fluentui/react-icons";
import { useDeptFiles, useDeptSearch } from "../../hooks/useDepartments";
import { FileTypeIcon } from "../files/FileTypeIcon";
import { formatFileSize } from "../../utils/fileSize";
import { formatDate } from "../../utils/dateFormat";
import { getItemWithDownloadUrl } from "../../api/driveApi";
import { useAuth } from "../../auth/useAuth";
import type { DriveItem } from "../../types/graph";

const useStyles = makeStyles({
  // ── Section card ──
  section: {
    borderRadius: tokens.borderRadiusLarge,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow2,
    flexShrink: 0,
    overflow: "hidden",
  },

  // ── Card header ──
  header: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 16px",
    cursor: "pointer",
    backgroundColor: tokens.colorNeutralBackground2,
    userSelect: "none",
    "&:hover": { backgroundColor: tokens.colorNeutralBackground2Hover },
  },
  chevronIcon: { color: tokens.colorNeutralForeground3, flexShrink: 0 },
  folderIcon: { color: tokens.colorBrandForeground1, flexShrink: 0 },
  headerTitle: {
    flex: 1,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  // ── File / folder rows ──
  row: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "7px 16px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    cursor: "pointer",
    "&:last-child": { borderBottom: "none" },
    "&:hover": { backgroundColor: tokens.colorNeutralBackground1Hover },
    "&:hover .actions": { opacity: 1 },
  },
  chevronCell: { width: "20px", flexShrink: 0 },
  nameText: {
    flex: 1,
    fontSize: tokens.fontSizeBase300,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: tokens.colorNeutralForeground1,
    minWidth: 0,
  },
  folderNameText: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
  },
  metaSize: {
    width: "80px",
    flexShrink: 0,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    textAlign: "right",
    whiteSpace: "nowrap",
  },
  metaDate: {
    width: "120px",
    flexShrink: 0,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    textAlign: "right",
    whiteSpace: "nowrap",
  },
  actions: {
    width: "68px",
    flexShrink: 0,
    display: "flex",
    gap: "2px",
    justifyContent: "flex-end",
    opacity: 0,
    transition: "opacity 0.15s ease",
  },

  // ── Sub-folder children indent area ──
  subLoading: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },

  // ── Search highlight ──
  highlight: {
    backgroundColor: tokens.colorPaletteYellowBackground2,
    borderRadius: "2px",
    padding: "0 2px",
    fontWeight: tokens.fontWeightSemibold,
  },

  // ── Search result path hint ──
  pathHint: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    minWidth: 0,
  },
  nameWithPath: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    overflow: "hidden",
    minWidth: 0,
  },

  // ── States ──
  loadingRow: { padding: "14px 16px", display: "flex", alignItems: "center", gap: "8px" },
  empty: {
    padding: "14px 16px",
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    fontStyle: "italic",
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function highlightText(text: string, q: string, highlightClass: string) {
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className={highlightClass}>{text.slice(idx, idx + q.length)}</span>
      {text.slice(idx + q.length)}
    </>
  );
}

/** Extract a readable path from parentReference.path, stripping the drive root prefix */
function extractPath(item: DriveItem): string {
  const raw = item.parentReference?.path ?? "";
  // Graph paths look like: /drives/xxx/root:/folder/subfolder
  const rootIdx = raw.indexOf("root:");
  if (rootIdx === -1) return "";
  return raw.slice(rootIdx + 5); // everything after "root:"
}

async function downloadItem(
  item: DriveItem,
  driveId: string,
  getToken: () => Promise<string>
) {
  try {
    let url = item["@microsoft.graph.downloadUrl"];
    if (!url) {
      const token = await getToken();
      const full = await getItemWithDownloadUrl(token, driveId, item.id);
      url = full["@microsoft.graph.downloadUrl"];
    }
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = item.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.error("Download failed:", err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DeptItemRow — recursive row for files and expandable sub-folders
//   (used only in browse mode, not in search mode)
// ─────────────────────────────────────────────────────────────────────────────

interface RowProps {
  item: DriveItem;
  driveId: string;
  depth?: number;
  searchQuery?: string;
}

function DeptItemRow({ item, driveId, depth = 0, searchQuery = "" }: RowProps) {
  const styles = useStyles();
  const [expanded, setExpanded] = useState(false);
  const { getToken } = useAuth();
  const isFolder = !!item.folder;

  const { data: children, isLoading: childrenLoading } = useDeptFiles(
    expanded && isFolder ? driveId : null,
    expanded && isFolder ? item.id : null
  );

  const indent = 16 + depth * 20;

  const handleRowClick = () => {
    if (isFolder) {
      setExpanded((v) => !v);
    } else {
      window.open(item.webUrl, "_blank", "noopener,noreferrer");
    }
  };

  const q = searchQuery.trim().toLowerCase();

  return (
    <>
      <div
        className={styles.row}
        style={{ paddingLeft: `${indent}px` }}
        onClick={handleRowClick}
        role="row"
        aria-label={item.name}
        title={isFolder ? "Cliquez pour développer" : "Cliquez pour ouvrir"}
      >
        <div className={styles.chevronCell}>
          {isFolder ? (
            expanded ? (
              <ChevronDown20Regular className={styles.chevronIcon} />
            ) : (
              <ChevronRight20Regular className={styles.chevronIcon} />
            )
          ) : null}
        </div>

        <FileTypeIcon item={item} size={20} />

        <Text
          className={mergeClasses(styles.nameText, isFolder && styles.folderNameText)}
          title={item.name}
        >
          {highlightText(item.name, q, styles.highlight)}
        </Text>

        <Text className={styles.metaSize}>
          {isFolder ? `${item.folder!.childCount} élém.` : formatFileSize(item.size)}
        </Text>

        <Text className={styles.metaDate}>{formatDate(item.lastModifiedDateTime)}</Text>

        <div className={mergeClasses(styles.actions, "actions")}>
          {!isFolder && (
            <Tooltip content="Télécharger" relationship="label">
              <Button
                appearance="subtle"
                size="small"
                icon={<ArrowDownload20Regular />}
                onClick={(e) => { e.stopPropagation(); downloadItem(item, driveId, getToken); }}
              />
            </Tooltip>
          )}
          <Tooltip content={isFolder ? "Ouvrir dans SharePoint" : "Ouvrir"} relationship="label">
            <Button
              appearance="subtle"
              size="small"
              icon={<Open20Regular />}
              onClick={(e) => { e.stopPropagation(); window.open(item.webUrl, "_blank", "noopener,noreferrer"); }}
            />
          </Tooltip>
        </div>
      </div>

      {isFolder && expanded && (
        childrenLoading ? (
          <div className={styles.subLoading} style={{ paddingLeft: `${indent + 20}px` }}>
            <Spinner size="tiny" />
            <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
              Chargement…
            </Text>
          </div>
        ) : (
          (children ?? []).map((child) => (
            <DeptItemRow
              key={child.id}
              item={child}
              driveId={driveId}
              depth={depth + 1}
              searchQuery={searchQuery}
            />
          ))
        )
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SearchResultRow — flat row used when a search query is active
//   Shows the file path below the name so the user knows where it lives
// ─────────────────────────────────────────────────────────────────────────────

interface SearchRowProps {
  item: DriveItem;
  driveId: string;
  searchQuery: string;
}

function SearchResultRow({ item, driveId, searchQuery }: SearchRowProps) {
  const styles = useStyles();
  const { getToken } = useAuth();
  const isFolder = !!item.folder;
  const path = extractPath(item);

  return (
    <div
      className={styles.row}
      onClick={() => window.open(item.webUrl, "_blank", "noopener,noreferrer")}
      role="row"
      aria-label={item.name}
      title="Cliquez pour ouvrir"
    >
      <div className={styles.chevronCell} />

      <FileTypeIcon item={item} size={20} />

      <div className={styles.nameWithPath}>
        <Text
          className={mergeClasses(styles.nameText, isFolder && styles.folderNameText)}
          title={item.name}
        >
          {highlightText(item.name, searchQuery.trim(), styles.highlight)}
        </Text>
        {path && (
          <Text className={styles.pathHint} title={path}>
            {path}
          </Text>
        )}
      </div>

      <Text className={styles.metaSize}>
        {isFolder ? `${item.folder!.childCount} élém.` : formatFileSize(item.size)}
      </Text>

      <Text className={styles.metaDate}>{formatDate(item.lastModifiedDateTime)}</Text>

      <div className={mergeClasses(styles.actions, "actions")}>
        {!isFolder && (
          <Tooltip content="Télécharger" relationship="label">
            <Button
              appearance="subtle"
              size="small"
              icon={<ArrowDownload20Regular />}
              onClick={(e) => { e.stopPropagation(); downloadItem(item, driveId, getToken); }}
            />
          </Tooltip>
        )}
        <Tooltip content={isFolder ? "Ouvrir dans SharePoint" : "Ouvrir"} relationship="label">
          <Button
            appearance="subtle"
            size="small"
            icon={<Open20Regular />}
            onClick={(e) => { e.stopPropagation(); window.open(item.webUrl, "_blank", "noopener,noreferrer"); }}
          />
        </Tooltip>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DepartmentSection — top-level collapsible card for one department folder
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  folder: DriveItem;
  driveId: string;
  searchQuery?: string;
  defaultOpen?: boolean;
}

export function DepartmentSection({
  folder,
  driveId,
  searchQuery = "",
  defaultOpen = true,
}: Props) {
  const styles = useStyles();
  const [open, setOpen] = useState(defaultOpen);

  const q = searchQuery.trim();
  const isSearching = q.length >= 2;

  // ── Browse mode: load direct children ──
  const { data: items, isLoading: browseLoading, error: browseError } = useDeptFiles(
    !isSearching && open ? driveId : null,
    !isSearching && open ? folder.id : null
  );

  // ── Search mode: Graph full-text search within this department subtree ──
  const { data: searchResults, isLoading: searchLoading } = useDeptSearch(
    driveId,
    folder.id,
    q
  );

  // When searching, always open the section to show results
  const isOpen = isSearching ? true : open;

  // In search mode, hide section if query is long enough and no results came back yet-or-empty
  if (isSearching && !searchLoading && (searchResults ?? []).length === 0) return null;

  const isLoading = isSearching ? searchLoading : browseLoading;
  const displayItems = isSearching ? (searchResults ?? []) : (items ?? []);
  const browseErrorMsg = !isSearching && browseError
    ? ((browseError as { message?: string })?.message ?? String(browseError))
    : null;

  return (
    <div className={styles.section}>
      {/* Header */}
      <div className={styles.header} onClick={() => { if (!isSearching) setOpen((v) => !v); }}>
        {isOpen ? (
          <ChevronDown20Regular className={styles.chevronIcon} />
        ) : (
          <ChevronRight20Regular className={styles.chevronIcon} />
        )}
        {isOpen ? (
          <FolderOpenRegular className={styles.folderIcon} />
        ) : (
          <FolderRegular className={styles.folderIcon} />
        )}
        <Text className={styles.headerTitle}>{folder.name}</Text>
        {!isLoading && (
          <Badge appearance="filled" color="informative" size="small">
            {displayItems.length}
          </Badge>
        )}
      </div>

      {/* Body */}
      {isOpen && (
        <div>
          {isLoading ? (
            <div className={styles.loadingRow}>
              <Spinner size="tiny" />
              <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
                {isSearching ? "Recherche…" : "Chargement…"}
              </Text>
            </div>
          ) : browseErrorMsg ? (
            <Text className={styles.empty} style={{ color: tokens.colorPaletteRedForeground1 }}>
              ⚠️ Erreur : {browseErrorMsg}
            </Text>
          ) : displayItems.length === 0 ? (
            <Text className={styles.empty}>Aucun document dans ce département.</Text>
          ) : isSearching ? (
            // Search mode: flat list with path hints
            displayItems.map((item) => (
              <SearchResultRow
                key={item.id}
                item={item}
                driveId={driveId}
                searchQuery={q}
              />
            ))
          ) : (
            // Browse mode: recursive expandable rows
            displayItems.map((item) => (
              <DeptItemRow
                key={item.id}
                item={item}
                driveId={driveId}
                depth={0}
                searchQuery=""
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
