import {
  makeStyles,
  mergeClasses,
  tokens,
  Text,
  Button,
  Tooltip,
} from "@fluentui/react-components";
import { ArrowDownload20Regular, Open20Regular } from "@fluentui/react-icons";
import { FileTypeIcon } from "./FileTypeIcon";
import { formatFileSize } from "../../utils/fileSize";
import { formatDate } from "../../utils/dateFormat";
import { useNavigationStore } from "../../store/navigationStore";
import { getItemWithDownloadUrl } from "../../api/driveApi";
import { useAuth } from "../../auth/useAuth";
import type { DriveItem } from "../../types/graph";

const useStyles = makeStyles({
  row: {
    display: "grid",
    gridTemplateColumns: "32px 1fr 100px 140px 72px",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    borderRadius: tokens.borderRadiusMedium,
    cursor: "pointer",
    transition: "background-color 0.1s ease",
    "&:hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
    "&:hover .actions": {
      opacity: 1,
    },
    // Touch devices have no hover — show actions always
    "@media (hover: none)": {
      "& .actions": { opacity: 1 },
    },
    // Mobile: drop the size column, narrow the date and actions
    "@media (max-width: 600px)": {
      gridTemplateColumns: "28px 1fr 92px 56px",
      gap: "6px",
      padding: "8px 12px",
    },
  },
  sizeCell: {
    "@media (max-width: 600px)": {
      display: "none",
    },
  },
  nameCell: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    overflow: "hidden",
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
  meta: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    textAlign: "right",
  },
  actions: {
    display: "flex",
    gap: "4px",
    justifyContent: "flex-end",
    opacity: 0,
    transition: "opacity 0.15s ease",
  },
});

interface FileListItemProps {
  item: DriveItem;
}

export function FileListItem({ item }: FileListItemProps) {
  const styles = useStyles();
  const { navigateTo } = useNavigationStore();
  const { getToken } = useAuth();
  const isFolder = !!item.folder;

  const handleClick = () => {
    if (isFolder) {
      navigateTo({
        id: item.id,
        name: item.name,
        driveId: item.parentReference.driveId,
      });
    } else {
      // Opens in Office Online for Office files, SharePoint viewer for all others
      window.open(item.webUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      let url = item["@microsoft.graph.downloadUrl"];
      if (!url) {
        const token = await getToken();
        const full = await getItemWithDownloadUrl(
          token,
          item.parentReference.driveId,
          item.id
        );
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

  const handleOpenInSharePoint = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(item.webUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={styles.row} onClick={handleClick} role="row" aria-label={item.name}>
      <FileTypeIcon item={item} size={20} />

      <div className={styles.nameCell}>
        <Text
          className={mergeClasses(styles.name, isFolder && styles.folderName)}
          title={item.name}
        >
          {item.name}
        </Text>
      </div>

      <Text className={mergeClasses(styles.meta, styles.sizeCell)}>
        {isFolder
          ? `${item.folder!.childCount} items`
          : formatFileSize(item.size)}
      </Text>

      <Text className={styles.meta}>{formatDate(item.lastModifiedDateTime)}</Text>

      <div className={mergeClasses(styles.actions, "actions")}>
        {!isFolder && (
          <Tooltip content="Download" relationship="label">
            <Button
              appearance="subtle"
              size="small"
              icon={<ArrowDownload20Regular />}
              onClick={handleDownload}
            />
          </Tooltip>
        )}
        <Tooltip content="Open in SharePoint" relationship="label">
          <Button
            appearance="subtle"
            size="small"
            icon={<Open20Regular />}
            onClick={handleOpenInSharePoint}
          />
        </Tooltip>
      </div>
    </div>
  );
}
