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
import { useDeptFiles } from "../../hooks/useDepartments";
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
    flexShrink: 0, // prevent flex parent from compressing this card
    overflow: "hidden", // needed for border-radius clipping
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

  // ── File / folder rows (flex-based so depth indent works cleanly) ──
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

  // ── States ──
  loadingRow: { padding: "14px 16px" },
  empty: {
    padding: "14px 16px",
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    fontStyle: "italic",
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// DeptItemRow — recursive row for files and expandable sub-folders
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

  // Load folder children only when expanded
  const { data: children, isLoading: childrenLoading } = useDeptFiles(
    expanded && isFolder ? driveId : null,
    expanded && isFolder ? item.id : null
  );

  const indent = 16 + depth * 20; // px indent per depth level

  const handleRowClick = () => {
    if (isFolder) {
      setExpanded((v) => !v);
    } else {
      // webUrl opens Office Online for Office files; SharePoint viewer for others
      window.open(item.webUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
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
  };

  const q = searchQuery.trim().toLowerCase();
  const highlight = (text: string) => {
    if (!q) return <>{text}</>;
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return <>{text}</>;
    return (
      <>
        {text.slice(0, idx)}
        <span className={styles.highlight}>{text.slice(idx, idx + q.length)}</span>
        {text.slice(idx + q.length)}
      </>
    );
  };

  return (
    <>
      {/* Row */}
      <div
        className={styles.row}
        style={{ paddingLeft: `${indent}px` }}
        onClick={handleRowClick}
        role="row"
        aria-label={item.name}
        title={isFolder ? "Cliquez pour développer" : "Cliquez pour ouvrir"}
      >
        {/* Chevron (folders) or spacer (files) */}
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
          className={mergeClasses(
            styles.nameText,
            isFolder && styles.folderNameText
          )}
          title={item.name}
        >
          {highlight(item.name)}
        </Text>

        <Text className={styles.metaSize}>
          {isFolder
            ? `${item.folder!.childCount} élém.`
            : formatFileSize(item.size)}
        </Text>

        <Text className={styles.metaDate}>
          {formatDate(item.lastModifiedDateTime)}
        </Text>

        <div className={mergeClasses(styles.actions, "actions")}>
          {!isFolder && (
            <Tooltip content="Télécharger" relationship="label">
              <Button
                appearance="subtle"
                size="small"
                icon={<ArrowDownload20Regular />}
                onClick={handleDownload}
              />
            </Tooltip>
          )}
          <Tooltip
            content={isFolder ? "Ouvrir dans SharePoint" : "Ouvrir"}
            relationship="label"
          >
            <Button
              appearance="subtle"
              size="small"
              icon={<Open20Regular />}
              onClick={(e) => {
                e.stopPropagation();
                window.open(item.webUrl, "_blank", "noopener,noreferrer");
              }}
            />
          </Tooltip>
        </div>
      </div>

      {/* Recursive children when expanded */}
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

  const { data: items, isLoading } = useDeptFiles(
    open ? driveId : null,
    open ? folder.id : null
  );

  const q = searchQuery.trim().toLowerCase();
  const filtered =
    q.length >= 1
      ? (items ?? []).filter((item) => item.name.toLowerCase().includes(q))
      : (items ?? []);

  // Hide whole section when searching and nothing matches
  if (q.length >= 1 && !isLoading && filtered.length === 0) return null;

  return (
    <div className={styles.section}>
      {/* Header */}
      <div className={styles.header} onClick={() => setOpen((v) => !v)}>
        {open ? (
          <ChevronDown20Regular className={styles.chevronIcon} />
        ) : (
          <ChevronRight20Regular className={styles.chevronIcon} />
        )}
        {open ? (
          <FolderOpenRegular className={styles.folderIcon} />
        ) : (
          <FolderRegular className={styles.folderIcon} />
        )}
        <Text className={styles.headerTitle}>{folder.name}</Text>
        {items !== undefined && (
          <Badge appearance="filled" color="informative" size="small">
            {filtered.length}
          </Badge>
        )}
      </div>

      {/* Body */}
      {open && (
        <div>
          {isLoading ? (
            <div className={styles.loadingRow}>
              <Spinner size="tiny" label="Chargement…" />
            </div>
          ) : filtered.length === 0 ? (
            <Text className={styles.empty}>Aucun document dans ce département.</Text>
          ) : (
            filtered.map((item) => (
              <DeptItemRow
                key={item.id}
                item={item}
                driveId={driveId}
                depth={0}
                searchQuery={searchQuery}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
