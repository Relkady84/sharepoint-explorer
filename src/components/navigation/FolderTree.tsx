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
import { Home20Regular } from "@fluentui/react-icons";
import { useSubfolders } from "../../hooks/useDriveItems";
import { useNavigationStore } from "../../store/navigationStore";
import { FolderTreeItem } from "./FolderTreeItem";

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
  homeItem: {
    cursor: "pointer",
    fontWeight: tokens.fontWeightSemibold,
  },
  homeActive: {
    backgroundColor: tokens.colorBrandBackground2,
  },
});

export function FolderTree() {
  const styles = useStyles();
  const { siteId, driveId, currentItemId, navigateToRoot } = useNavigationStore();

  const { data: rootFolders, isLoading, isError } = useSubfolders(
    driveId,
    null,
    siteId,
    !!siteId && !!driveId
  );

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
        <Spinner size="small" label="Loading folders..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.empty}>
        <Text style={{ color: tokens.colorPaletteRedForeground1 }}>
          Failed to load folders
        </Text>
      </div>
    );
  }

  const isRootActive = currentItemId === null;

  return (
    <div className={styles.root}>
      <Tree aria-label="Folder navigation">
        {/* Root / Home item */}
        <TreeItem
          itemType="branch"
          className={mergeClasses(styles.homeItem, isRootActive && styles.homeActive)}
          open
        >
          <TreeItemLayout
            iconBefore={<Home20Regular />}
            onClick={navigateToRoot}
          >
            Documents
          </TreeItemLayout>
          <Tree>
            {(rootFolders ?? []).map((folder) => (
              <FolderTreeItem key={folder.id} folder={folder} />
            ))}
          </Tree>
        </TreeItem>
      </Tree>
    </div>
  );
}
