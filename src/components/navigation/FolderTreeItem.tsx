import { useState } from "react";
import {
  TreeItem,
  TreeItemLayout,
  Tree,
  Spinner,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { Folder20Regular, FolderOpen20Regular, ChevronRight20Regular } from "@fluentui/react-icons";
import { useSubfolders } from "../../hooks/useDriveItems";
import { useNavigationStore } from "../../store/navigationStore";
import type { DriveItem } from "../../types/graph";

const useStyles = makeStyles({
  treeItem: {
    cursor: "pointer",
    "&:hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  activeItem: {
    backgroundColor: tokens.colorBrandBackground2,
    "&:hover": {
      backgroundColor: tokens.colorBrandBackground2Hover,
    },
  },
});

interface FolderTreeItemProps {
  folder: DriveItem;
  depth?: number;
}

export function FolderTreeItem({ folder, depth = 0 }: FolderTreeItemProps) {
  const styles = useStyles();
  const [isExpanded, setIsExpanded] = useState(false);
  const { navigateTo, currentItemId } = useNavigationStore();

  const { data: subfolders, isLoading } = useSubfolders(
    folder.parentReference.driveId,
    folder.id,
    undefined,
    isExpanded
  );

  const isActive = currentItemId === folder.id;
  const hasChildren = (folder.folder?.childCount ?? 0) > 0;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigateTo({
      id: folder.id,
      name: folder.name,
      driveId: folder.parentReference.driveId,
    });
  };

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded((prev) => !prev);
  };

  return (
    <TreeItem
      itemType={hasChildren ? "branch" : "leaf"}
      className={isActive ? styles.activeItem : styles.treeItem}
      open={isExpanded}
    >
      <TreeItemLayout
        onClick={handleClick}
        expandIcon={
          hasChildren ? (
            <span onClick={handleExpand}>
              <ChevronRight20Regular
                style={{
                  transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                  transition: "transform 0.15s ease",
                }}
              />
            </span>
          ) : undefined
        }
        iconBefore={isExpanded ? <FolderOpen20Regular /> : <Folder20Regular />}
      >
        {folder.name}
      </TreeItemLayout>

      {isExpanded && (
        <Tree>
          {isLoading ? (
            <TreeItem itemType="leaf">
              <TreeItemLayout iconBefore={<Spinner size="tiny" />}>
                Loading...
              </TreeItemLayout>
            </TreeItem>
          ) : (subfolders ?? []).length === 0 ? null : (
            subfolders!.map((sub) => (
              <FolderTreeItem key={sub.id} folder={sub} depth={depth + 1} />
            ))
          )}
        </Tree>
      )}
    </TreeItem>
  );
}
