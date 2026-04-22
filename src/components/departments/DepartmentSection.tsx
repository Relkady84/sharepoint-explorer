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
  ChevronDown20Regular,
  ChevronRight20Regular,
  ArrowDownload20Regular,
  Open20Regular,
  FolderOpenRegular,
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
  header: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "14px 16px",
    cursor: "pointer",
    backgroundColor: tokens.colorNeutralBackground2,
    userSelect: "none",
    "&:hover": { backgroundColor: tokens.colorNeutralBackground2Hover },
  },
  chevron: { color: tokens.colorNeutralForeground3, flexShrink: 0 },
  folderIcon: { color: tokens.colorBrandForeground1, flexShrink: 0 },
  title: {
    flex: 1,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground1,
  },
  fileList: { padding: "4px 0" },
  fileRow: {
    display: "grid",
    gridTemplateColumns: "28px 1fr 90px 130px 68px",
    alignItems: "center",
    gap: "8px",
    padding: "7px 16px",
    "&:hover": { backgroundColor: tokens.colorNeutralBackground1Hover },
  },
  fileName: {
    fontSize: tokens.fontSizeBase300,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: tokens.colorNeutralForeground1,
  },
  subFolderName: {
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
  meta: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    textAlign: "right",
  },
  actions: {
    display: "flex",
    gap: "2px",
    justifyContent: "flex-end",
    opacity: 0,
    transition: "opacity 0.15s",
    "& button": { minWidth: "auto" },
  },
  actionsVisible: { opacity: 1 },
  empty: {
    padding: "14px 16px",
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    fontStyle: "italic",
  },
  highlight: {
    backgroundColor: tokens.colorPaletteYellowBackground2,
    borderRadius: "2px",
    padding: "0 2px",
    fontWeight: tokens.fontWeightSemibold,
  },
  loadingRow: { padding: "12px 16px" },
  divider: {
    height: "1px",
    backgroundColor: tokens.colorNeutralStroke2,
    margin: "0 16px",
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
  const [hoveredId, setHoveredId] = useState<string | null>(null);
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

  // Hide whole section when searching and nothing matches
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
        <mark className={styles.highlight}>
          {text.slice(idx, idx + q.length)}
        </mark>
        {text.slice(idx + q.length)}
      </>
    );
  };

  const fileCount = filtered.length;

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
          <FolderOpenRegular className={styles.folderIcon} fontSize={20} />
        ) : (
          <FolderRegular className={styles.folderIcon} fontSize={20} />
        )}
        <Text className={styles.title}>{folder.name}</Text>
        {items !== undefined && (
          <Badge appearance="filled" color="informative" size="small">
            {fileCount} {fileCount === 1 ? "fichier" : "fichiers"}
          </Badge>
        )}
      </div>

      {/* File list */}
      {open && (
        <div className={styles.fileList}>
          {isLoading ? (
            <div className={styles.loadingRow}>
              <Spinner size="tiny" label="Chargement..." />
            </div>
          ) : filtered.length === 0 ? (
            <Text className={styles.empty}>
              Aucun document dans ce département.
            </Text>
          ) : (
            filtered.map((item, i) => {
              const isFolder = !!item.folder;
              const isHovered = hoveredId === item.id;
              return (
                <div key={item.id}>
                  {i > 0 && <div className={styles.divider} />}
                  <div
                    className={styles.fileRow}
                    onMouseEnter={() => setHoveredId(item.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <FileTypeIcon item={item} size={18} />

                    <Text
                      className={mergeClasses(
                        styles.fileName,
                        isFolder && styles.subFolderName
                      )}
                      title={item.name}
                    >
                      {highlight(item.name)}
                    </Text>

                    <Text className={styles.meta}>
                      {isFolder
                        ? `${item.folder!.childCount} élém.`
                        : formatFileSize(item.size)}
                    </Text>

                    <Text className={styles.meta}>
                      {formatDate(item.lastModifiedDateTime)}
                    </Text>

                    <div
                      className={mergeClasses(
                        styles.actions,
                        isHovered && styles.actionsVisible
                      )}
                    >
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
                      <Tooltip
                        content="Ouvrir dans SharePoint"
                        relationship="label"
                      >
                        <Button
                          appearance="subtle"
                          size="small"
                          icon={<Open20Regular />}
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(
                              item.webUrl,
                              "_blank",
                              "noopener,noreferrer"
                            );
                          }}
                        />
                      </Tooltip>
                    </div>
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
