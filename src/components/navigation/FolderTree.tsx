import {
  Tree,
  TreeItem,
  TreeItemLayout,
  Spinner,
  Text,
  makeStyles,
  mergeClasses,
  tokens,
} from "@fluentui/react-components";
import { FolderRegular } from "@fluentui/react-icons";
import { useSubfolders } from "../../hooks/useDriveItems";
import { useDrives } from "../../hooks/useDrives";
import { useNavigationStore } from "../../store/navigationStore";
import { FolderTreeItem } from "./FolderTreeItem";
import type { Drive } from "../../types/graph";

const useStyles = makeStyles({
  root: {
    padding: "8px 0",
  },
  empty: {
    padding: "16px",
    color: tokens.colorNeutralForeground4,
    fontSize: tokens.fontSizeBase200,
    textAlign: "center",
  },
  libraryItem: {
    cursor: "pointer",
    fontWeight: tokens.fontWeightSemibold,
  },
  libraryActive: {
    backgroundColor: tokens.colorBrandBackground2,
  },
});

interface LibraryTreeProps {
  drive: Drive;
  siteId: string;
}

function LibraryTree({ drive, siteId }: LibraryTreeProps) {
  const styles = useStyles();
  const { currentItemId, driveId, navigateToRoot, setSite, siteName } = useNavigationStore();

  const isRootActive = driveId === drive.id && currentItemId === null;

  const { data: rootFolders, isLoading } = useSubfolders(
    drive.id,
    null,
    siteId,
    true
  );

  const handleRootClick = () => {
    if (driveId !== drive.id) {
      // Switch to this drive's root
      setSite(siteId, siteName, drive.id);
    } else {
      navigateToRoot();
    }
  };

  return (
    <TreeItem
      itemType="branch"
      className={mergeClasses(styles.libraryItem, isRootActive && styles.libraryActive)}
      open
    >
      <TreeItemLayout
        iconBefore={<FolderRegular />}
        onClick={handleRootClick}
      >
        {drive.name}
      </TreeItemLayout>
      <Tree>
        {isLoading ? (
          <TreeItem itemType="leaf">
            <TreeItemLayout>
              <Spinner size="tiny" />
            </TreeItemLayout>
          </TreeItem>
        ) : (
          (rootFolders ?? []).map((folder) => (
            <FolderTreeItem key={folder.id} folder={folder} />
          ))
        )}
      </Tree>
    </TreeItem>
  );
}

export function FolderTree() {
  const styles = useStyles();
  const { siteId } = useNavigationStore();
  const { data: drives, isLoading, isError } = useDrives(siteId);

  if (!siteId) {
    return (
      <div className={styles.empty}>
        <Text>Select a site to browse folders</Text>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.empty}>
        <Spinner size="small" label="Loading libraries..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.empty}>
        <Text style={{ color: tokens.colorPaletteRedForeground1 }}>
          Failed to load libraries
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <Tree aria-label="Document libraries">
        {(drives ?? []).map((drive) => (
          <LibraryTree key={drive.id} drive={drive} siteId={siteId} />
        ))}
      </Tree>
    </div>
  );
}
