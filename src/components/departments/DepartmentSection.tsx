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
  section: {
    borderRadius: tokens.borderRadiusLarge,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    overflow: "hidden",
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow2,
  },

  // ── Header ──
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
  chevron: { color: tokens.colorNeutralForeground3, flexShrink: 0 },
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

  // ── File rows (mirrors FileListItem exactly) ──
  fileList: { padding: "2px 0" },
  row: {
    display: "grid",
    gridTemplateColumns: "32px 1fr 100px 140px 72px",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    cursor: "default",
    "&:last-child": { borderBottom: "none" },
    "&:hover": { backgroundColor: tokens.colorNeutralBackground1Hover },
    "&:hover .actions": { opacity: 1 },
  },
  nameCell: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    overflow: "hidden",
    minWidth: 0,
  },
  name: {
    fontSize: tokens.fontSizeBase300,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: tokens.colorNeutralForeground1,
    flex: 1,
    minWidth: 0,
  },
  folderName: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
  },
  meta: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    textAlign: "right",
    whiteSpace: "nowrap",
  },
  actions: {
    display: "flex",
    gap: "4px",
    justifyContent: "flex-end",
    opacity: 0,
    transition: "opacity 0.15s ease",
  },

  // ── Highlight (search match) ──
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
  const { getToken } = useAuth();

  const { data: items, isLoading } = useDeptFiles(
    open ? driveId : null,
    open ? folder.id : null
  );

  const q = searchQuery.trim().toLowerCase();
  const filtered =
    q.length >= 1
      ? (items ?? []).filter((item) => item.name.toLowerCase().includes(q))
      : (items ?? []);

  // Hide entire section when searching and no files match
  if (q.length >= 1 && !isLoading && filtered.length === 0) return null;

  const handleDownload = async (e: React.MouseEvent, item: DriveItem) => {
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
    <div className={styles.section}>
      {/* Header */}
      <div className={styles.header} onClick={() => setOpen((v) => !v)}>
        {open ? (
          <ChevronDown20Regular className={styles.chevron} />
        ) : (
          <ChevronRight20Regular className={styles.chevron} />
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
        <div className={styles.fileList}>
          {isLoading ? (
            <div className={styles.loadingRow}>
              <Spinner size="tiny" label="Chargement…" />
            </div>
          ) : filtered.length === 0 ? (
            <Text className={styles.empty}>Aucun document dans ce département.</Text>
          ) : (
            filtered.map((item) => {
              const isFolder = !!item.folder;
              return (
                <div key={item.id} className={styles.row} role="row" aria-label={item.name}>
                  <FileTypeIcon item={item} size={20} />

                  <div className={styles.nameCell}>
                    <Text
                      className={mergeClasses(styles.name, isFolder && styles.folderName)}
                      title={item.name}
                    >
                      {highlight(item.name)}
                    </Text>
                  </div>

                  <Text className={styles.meta}>
                    {isFolder
                      ? `${item.folder!.childCount} élém.`
                      : formatFileSize(item.size)}
                  </Text>

                  <Text className={styles.meta}>
                    {formatDate(item.lastModifiedDateTime)}
                  </Text>

                  <div className={mergeClasses(styles.actions, "actions")}>
                    {!isFolder && (
                      <Tooltip content="Télécharger" relationship="label">
                        <Button
                          appearance="subtle"
                          size="small"
                          icon={<ArrowDownload20Regular />}
                          onClick={(e) => handleDownload(e, item)}
                        />
                      </Tooltip>
                    )}
                    <Tooltip content="Ouvrir dans SharePoint" relationship="label">
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
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
