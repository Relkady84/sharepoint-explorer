import {
  makeStyles,
  tokens,
  Text,
  Skeleton,
  SkeletonItem,
} from "@fluentui/react-components";
import { FolderOpenRegular } from "@fluentui/react-icons";
import { useDriveItems } from "../../hooks/useDriveItems";
import { useSearch } from "../../hooks/useSearch";
import { useNavigationStore } from "../../store/navigationStore";
import { BreadcrumbNav } from "../navigation/BreadcrumbNav";
import { FileListItem } from "./FileListItem";
import { FileToolbar } from "./FileToolbar";
import { UploadZone } from "./UploadZone";
import type { DriveItem } from "../../types/graph";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
  },
  header: {
    display: "grid",
    gridTemplateColumns: "32px 1fr 100px 140px 72px",
    gap: "8px",
    padding: "6px 16px",
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  headerCell: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  headerRight: {
    textAlign: "right",
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  list: {
    flex: 1,
    overflowY: "auto",
    padding: "4px 0",
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    padding: "64px 32px",
    color: tokens.colorNeutralForeground4,
  },
  emptyIcon: {
    fontSize: "64px",
    color: tokens.colorNeutralForeground4,
    opacity: 0.4,
  },
  emptyText: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
  },
  emptySubtext: {
    fontSize: tokens.fontSizeBase300,
    textAlign: "center",
  },
  noSite: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    gap: "12px",
    color: tokens.colorNeutralForeground3,
  },
  skeletonRow: {
    display: "grid",
    gridTemplateColumns: "32px 1fr 100px 140px 72px",
    gap: "8px",
    padding: "10px 16px",
    alignItems: "center",
  },
  searchBadge: {
    padding: "4px 16px 8px",
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
});

function LoadingSkeleton() {
  const styles = useStyles();
  return (
    <>
      {[...Array(8)].map((_, i) => (
        <div key={i} className={styles.skeletonRow}>
          <Skeleton>
            <SkeletonItem shape="circle" size={20} />
          </Skeleton>
          <Skeleton>
            <SkeletonItem style={{ width: `${40 + Math.random() * 40}%`, height: "16px" }} />
          </Skeleton>
          <Skeleton>
            <SkeletonItem style={{ width: "80px", height: "16px", marginLeft: "auto" }} />
          </Skeleton>
          <Skeleton>
            <SkeletonItem style={{ width: "100px", height: "16px", marginLeft: "auto" }} />
          </Skeleton>
          <div />
        </div>
      ))}
    </>
  );
}

function FileList({ items }: { items: DriveItem[] }) {
  // Sort: folders first, then files alphabetically
  const sorted = [...items].sort((a, b) => {
    if (!!a.folder !== !!b.folder) return a.folder ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <>
      {sorted.map((item) => (
        <FileListItem key={item.id} item={item} />
      ))}
    </>
  );
}

export function FileListPanel() {
  const styles = useStyles();
  const { siteId, driveId, currentItemId, searchQuery } = useNavigationStore();

  const { data: items, isLoading, isError } = useDriveItems(siteId, driveId, currentItemId);
  const { data: searchResults, isLoading: isSearching } = useSearch(driveId, searchQuery);

  const isSearchMode = searchQuery.trim().length >= 2;
  const displayItems = isSearchMode ? (searchResults ?? []) : (items ?? []);
  const isLoadingItems = isSearchMode ? isSearching : isLoading;

  if (!siteId) {
    return (
      <div className={styles.root}>
        <div className={styles.noSite}>
          <FolderOpenRegular style={{ fontSize: 64, opacity: 0.3 }} />
          <Text size={400} weight="semibold">No site selected</Text>
          <Text size={300}>Choose a SharePoint site from the dropdown above to get started.</Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <FileToolbar />
      <BreadcrumbNav />

      {isSearchMode && (
        <div className={styles.searchBadge}>
          {isSearching
            ? "Searching..."
            : `${searchResults?.length ?? 0} result${(searchResults?.length ?? 0) !== 1 ? "s" : ""} for "${searchQuery}"`}
        </div>
      )}

      {/* Column headers */}
      <div className={styles.header}>
        <span />
        <span className={styles.headerCell}>Name</span>
        <span className={styles.headerRight}>Size</span>
        <span className={styles.headerRight}>Modified</span>
        <span />
      </div>

      <UploadZone>
        <div className={styles.list}>
          {isLoadingItems ? (
            <LoadingSkeleton />
          ) : isError ? (
            <div className={styles.empty}>
              <Text className={styles.emptyText} style={{ color: tokens.colorPaletteRedForeground1 }}>
                Failed to load files
              </Text>
              <Text className={styles.emptySubtext}>
                Check your permissions or try refreshing.
              </Text>
            </div>
          ) : displayItems.length === 0 ? (
            <div className={styles.empty}>
              <FolderOpenRegular className={styles.emptyIcon} />
              <Text className={styles.emptyText}>
                {isSearchMode ? "No results found" : "This folder is empty"}
              </Text>
              <Text className={styles.emptySubtext}>
                {isSearchMode
                  ? `No files match "${searchQuery}"`
                  : "Drag and drop files here, or click Upload to add files."}
              </Text>
            </div>
          ) : (
            <FileList items={displayItems} />
          )}
        </div>
      </UploadZone>
    </div>
  );
}
