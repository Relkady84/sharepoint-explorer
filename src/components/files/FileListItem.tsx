import { useRef } from "react";
import {
  makeStyles,
  mergeClasses,
  tokens,
  Text,
  Button,
  Tooltip,
  Checkbox,
  Input,
} from "@fluentui/react-components";
import {
  ArrowDownload20Regular,
  Open20Regular,
  Rename20Regular,
} from "@fluentui/react-icons";
import { FileTypeIcon } from "./FileTypeIcon";
import { formatFileSize } from "../../utils/fileSize";
import { formatDate } from "../../utils/dateFormat";
import { useNavigationStore } from "../../store/navigationStore";
import { getItemWithDownloadUrl } from "../../api/driveApi";
import { useAuth } from "../../auth/useAuth";
import type { DriveItem } from "../../types/graph";

// Grid: checkbox | icon | name | size | date | actions
const GRID = "20px 32px 1fr 100px 140px 80px";
const GRID_MOBILE = "20px 24px 1fr 92px 60px";

const useStyles = makeStyles({
  row: {
    display: "grid",
    gridTemplateColumns: GRID,
    alignItems: "center",
    gap: "8px",
    padding: "7px 16px",
    cursor: "pointer",
    transition: "background-color 0.1s ease",
    "&:hover": { backgroundColor: tokens.colorNeutralBackground1Hover },
    "&:hover .actions": { opacity: 1 },
    "@media (hover: none)": { "& .actions": { opacity: 1 } },
    "@media (max-width: 600px)": {
      gridTemplateColumns: GRID_MOBILE,
      gap: "6px",
      padding: "8px 12px",
    },
  },
  rowSelected: {
    backgroundColor: tokens.colorNeutralBackground3,
    "&:hover": { backgroundColor: tokens.colorNeutralBackground3Hover },
  },
  checkboxCell: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  sizeCell: {
    "@media (max-width: 600px)": { display: "none" },
  },
  nameCell: {
    display: "flex",
    alignItems: "center",
    gap: "0px",
    overflow: "hidden",
    minWidth: 0,
  },
  name: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightRegular,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: tokens.colorNeutralForeground1,
  },
  folderName: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
  },
  renameInput: {
    flex: 1,
    minWidth: 0,
    fontSize: tokens.fontSizeBase300,
    height: "26px",
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
    transition: "opacity 0.15s ease",
  },
});

export const FILE_LIST_GRID = GRID;
export const FILE_LIST_GRID_MOBILE = GRID_MOBILE;

interface FileListItemProps {
  item: DriveItem;
  isSelected?: boolean;
  onToggle?: (id: string) => void;
  isRenaming?: boolean;
  onStartRename?: (id: string) => void;
  onRenameSubmit?: (id: string, newName: string) => void;
  onRenameCancel?: () => void;
}

export function FileListItem({
  item,
  isSelected = false,
  onToggle,
  isRenaming = false,
  onStartRename,
  onRenameSubmit,
  onRenameCancel,
}: FileListItemProps) {
  const styles = useStyles();
  const { navigateTo } = useNavigationStore();
  const { getToken } = useAuth();
  const isFolder = !!item.folder;
  const renameInputRef = useRef<HTMLInputElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("input")) return;
    if (isRenaming) return;
    if (isFolder) {
      navigateTo({ id: item.id, name: item.name, driveId: item.parentReference.driveId });
    } else {
      window.open(item.webUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      let url = item["@microsoft.graph.downloadUrl"];
      if (!url) {
        const token = await getToken();
        const full = await getItemWithDownloadUrl(token, item.parentReference.driveId, item.id);
        url = full["@microsoft.graph.downloadUrl"];
      }
      if (!url) return;
      const a = document.createElement("a");
      a.href = url; a.download = item.name;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } catch (err) { console.error("Download failed:", err); }
  };

  return (
    <div
      className={mergeClasses(styles.row, isSelected && styles.rowSelected)}
      onClick={handleClick}
      role="row"
      aria-label={item.name}
      aria-selected={isSelected}
    >
      {/* Checkbox */}
      <div className={styles.checkboxCell} onClick={(e) => e.stopPropagation()}>
        {onToggle && (
          <Checkbox
            checked={isSelected}
            onChange={() => onToggle(item.id)}
            aria-label={`Sélectionner ${item.name}`}
          />
        )}
      </div>

      {/* Icon */}
      <FileTypeIcon item={item} size={20} />

      {/* Name or inline rename */}
      <div className={styles.nameCell}>
        {isRenaming ? (
          <Input
            ref={renameInputRef}
            className={styles.renameInput}
            defaultValue={item.name}
            autoFocus
            size="small"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.stopPropagation();
                onRenameSubmit?.(item.id, (e.target as HTMLInputElement).value);
              } else if (e.key === "Escape") {
                e.stopPropagation();
                onRenameCancel?.();
              }
            }}
            onBlur={(e) => onRenameSubmit?.(item.id, e.target.value)}
          />
        ) : (
          <Text
            className={mergeClasses(styles.name, isFolder && styles.folderName)}
            title={item.name}
          >
            {item.name}
          </Text>
        )}
      </div>

      {/* Size */}
      <Text className={mergeClasses(styles.meta, styles.sizeCell)}>
        {isFolder ? `${item.folder!.childCount} élém.` : formatFileSize(item.size)}
      </Text>

      {/* Modified */}
      <Text className={styles.meta}>{formatDate(item.lastModifiedDateTime)}</Text>

      {/* Hover actions */}
      <div className={mergeClasses(styles.actions, "actions")}>
        {onStartRename && (
          <Tooltip content="Renommer" relationship="label">
            <Button
              appearance="subtle" size="small"
              icon={<Rename20Regular />}
              onClick={(e) => { e.stopPropagation(); onStartRename(item.id); }}
            />
          </Tooltip>
        )}
        {!isFolder && (
          <Tooltip content="Télécharger" relationship="label">
            <Button
              appearance="subtle" size="small"
              icon={<ArrowDownload20Regular />}
              onClick={handleDownload}
            />
          </Tooltip>
        )}
        <Tooltip content={isFolder ? "Ouvrir dans SharePoint" : "Ouvrir"} relationship="label">
          <Button
            appearance="subtle" size="small"
            icon={<Open20Regular />}
            onClick={(e) => { e.stopPropagation(); window.open(item.webUrl, "_blank", "noopener,noreferrer"); }}
          />
        </Tooltip>
      </div>
    </div>
  );
}
