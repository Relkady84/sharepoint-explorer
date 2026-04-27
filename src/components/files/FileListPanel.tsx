import { useState, useCallback, useRef } from "react";
import {
  makeStyles,
  tokens,
  Text,
  Skeleton,
  SkeletonItem,
  Input,
  Button,
  Spinner,
} from "@fluentui/react-components";
import {
  FolderOpenRegular,
  FolderAdd20Regular,
  Checkmark20Regular,
  Dismiss20Regular,
} from "@fluentui/react-icons";
import { useDriveItems, useExplorerMutations } from "../../hooks/useDriveItems";
import { useSearch } from "../../hooks/useSearch";
import { useNavigationStore } from "../../store/navigationStore";
import { useTranslation } from "../../i18n/useTranslation";
import { BreadcrumbNav } from "../navigation/BreadcrumbNav";
import { FileListItem, FILE_LIST_GRID, FILE_LIST_GRID_MOBILE } from "./FileListItem";
import { FileToolbar } from "./FileToolbar";
import { UploadZone } from "./UploadZone";
import { CopyMoveDialog } from "../departments/CopyMoveDialog";
import type { DriveItem } from "../../types/graph";

const useStyles = makeStyles({
  root: { display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" },
  header: {
    display: "grid",
    gridTemplateColumns: FILE_LIST_GRID,
    gap: "8px",
    padding: "5px 16px",
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    "@media (max-width: 600px)": {
      gridTemplateColumns: FILE_LIST_GRID_MOBILE,
      gap: "6px",
      padding: "5px 12px",
    },
  },
  sizeHeaderCell: { "@media (max-width: 600px)": { display: "none" } },
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
  list: { flex: 1, overflowY: "auto", padding: "4px 0" },
  empty: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", gap: "16px", padding: "64px 32px",
    color: tokens.colorNeutralForeground4,
  },
  emptyIcon: { fontSize: "64px", color: tokens.colorNeutralForeground4, opacity: 0.4 },
  emptyText: { fontSize: tokens.fontSizeBase400, fontWeight: tokens.fontWeightSemibold },
  emptySubtext: { fontSize: tokens.fontSizeBase300, textAlign: "center" },
  noSite: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", flex: 1, gap: "12px",
    color: tokens.colorNeutralForeground3,
  },
  skeletonRow: {
    display: "grid",
    gridTemplateColumns: FILE_LIST_GRID,
    gap: "8px", padding: "10px 16px", alignItems: "center",
    "@media (max-width: 600px)": {
      gridTemplateColumns: FILE_LIST_GRID_MOBILE,
      gap: "6px", padding: "10px 12px",
    },
  },
  skeletonSize: { "@media (max-width: 600px)": { display: "none" } },
  searchBadge: {
    padding: "4px 16px 8px",
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  actionError: {
    padding: "6px 16px",
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorPaletteRedForeground1,
    backgroundColor: tokens.colorPaletteRedBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  newFolderRow: {
    display: "grid",
    gridTemplateColumns: FILE_LIST_GRID,
    gap: "8px",
    padding: "6px 16px",
    alignItems: "center",
    backgroundColor: tokens.colorBrandBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    "@media (max-width: 600px)": {
      gridTemplateColumns: FILE_LIST_GRID_MOBILE,
      gap: "6px",
      padding: "6px 12px",
    },
  },
  newFolderInput: { gridColumn: "3 / 5", minWidth: 0 },
  newFolderActions: { display: "flex", gap: "4px", gridColumn: "5 / -1", justifyContent: "flex-end" },
});

function LoadingSkeleton() {
  const styles = useStyles();
  return (
    <>
      {[...Array(8)].map((_, i) => (
        <div key={i} className={styles.skeletonRow}>
          <div />
          <Skeleton><SkeletonItem shape="circle" size={20} /></Skeleton>
          <Skeleton><SkeletonItem style={{ width: `${40 + Math.random() * 40}%`, height: "16px" }} /></Skeleton>
          <div className={styles.skeletonSize}>
            <Skeleton><SkeletonItem style={{ width: "80px", height: "16px", marginLeft: "auto" }} /></Skeleton>
          </div>
          <Skeleton><SkeletonItem style={{ width: "100px", height: "16px", marginLeft: "auto" }} /></Skeleton>
          <div />
        </div>
      ))}
    </>
  );
}

function describeError(err: unknown): string {
  const axiosErr = err as { response?: { status?: number; data?: { error?: { message?: string } } } };
  const status = axiosErr?.response?.status;
  const spMsg = axiosErr?.response?.data?.error?.message ?? "";
  if (status === 403 || status === 401) return "Accès refusé — vérifiez vos permissions SharePoint.";
  if (spMsg) return `Erreur SharePoint : ${spMsg}`;
  return err instanceof Error ? err.message : String(err);
}

export function FileListPanel() {
  const styles = useStyles();
  const { t } = useTranslation();
  const { siteId, driveId, currentItemId, searchQuery } = useNavigationStore();

  // ── Data ──
  const { data: items, isLoading, isError } = useDriveItems(siteId, driveId, currentItemId);
  const { data: searchResults, isLoading: isSearching } = useSearch(driveId, searchQuery);
  const mutations = useExplorerMutations(siteId, driveId, currentItemId);

  const isSearchMode = searchQuery.trim().length >= 2;
  const displayItems = isSearchMode ? (searchResults ?? []) : (items ?? []);
  const isLoadingItems = isSearchMode ? isSearching : isLoading;

  // ── Selection ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const allItemIds = displayItems.map((i) => i.id);

  const handleToggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => setSelectedIds(new Set(allItemIds)), [allItemIds]);
  const handleDeselectAll = useCallback(() => setSelectedIds(new Set()), []);

  // ── Rename ──
  const [renamingId, setRenamingId] = useState<string | null>(null);

  const handleStartRename = useCallback((id: string) => {
    setRenamingId(id);
    setSelectedIds(new Set([id]));
  }, []);

  const handleRenameFromToolbar = useCallback(() => {
    const id = [...selectedIds][0];
    if (id) handleStartRename(id);
  }, [selectedIds, handleStartRename]);

  const handleRenameSubmit = useCallback(async (id: string, newName: string) => {
    const trimmed = newName.trim();
    setRenamingId(null);
    if (!trimmed) return;
    setActionError("");
    try { await mutations.rename.mutateAsync({ itemId: id, newName: trimmed }); }
    catch (err) { setActionError(describeError(err)); }
  }, [mutations.rename]);

  const handleRenameCancel = useCallback(() => setRenamingId(null), []);

  // ── Delete ──
  const [actionError, setActionError] = useState("");

  const handleDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (!confirm(t("explorer.deleteConfirm").replace("{count}", String(count)))) return;
    setActionError("");
    try {
      await mutations.deleteItems.mutateAsync([...selectedIds]);
      setSelectedIds(new Set());
    } catch (err) { setActionError(describeError(err)); }
  }, [selectedIds, mutations.deleteItems]);

  // ── New folder ──
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const newFolderInputRef = useRef<HTMLInputElement>(null);

  const handleNewFolder = useCallback(() => {
    setCreatingFolder(true);
    setNewFolderName("");
    setTimeout(() => newFolderInputRef.current?.focus(), 50);
  }, []);

  const handleCreateFolderConfirm = useCallback(async () => {
    const name = newFolderName.trim();
    setCreatingFolder(false); setNewFolderName("");
    if (!name) return;
    setActionError("");
    try { await mutations.createNewFolder.mutateAsync(name); }
    catch (err) { setActionError(describeError(err)); }
  }, [newFolderName, mutations.createNewFolder]);

  // ── Copy / Move ──
  const [copyMoveMode, setCopyMoveMode] = useState<"copy" | "move" | null>(null);

  if (!siteId) {
    return (
      <div className={styles.root}>
        <div className={styles.noSite}>
          <FolderOpenRegular style={{ fontSize: 64, opacity: 0.3 }} />
          <Text size={400} weight="semibold">{t("explorer.noSite")}</Text>
          <Text size={300}>{t("explorer.noSiteHint")}</Text>
        </div>
      </div>
    );
  }

  const toolbarActions = {
    selectedIds,
    allItemIds,
    onSelectAll: handleSelectAll,
    onDeselectAll: handleDeselectAll,
    onDelete: handleDelete,
    onRenameFromToolbar: handleRenameFromToolbar,
    onNewFolder: handleNewFolder,
    onCopy: () => setCopyMoveMode("copy"),
    onMove: () => setCopyMoveMode("move"),
    isBusy: mutations.isBusy,
    isDeleting: mutations.deleteItems.isPending,
  };

  return (
    <div className={styles.root}>
      <FileToolbar actions={toolbarActions} />
      <BreadcrumbNav />

      {isSearchMode && (
        <div className={styles.searchBadge}>
          {isSearching
            ? t("explorer.searching")
            : t("explorer.searchResults")
                .replace("{count}", String(searchResults?.length ?? 0))
                .replace("{query}", searchQuery)}
        </div>
      )}

      {/* Action error */}
      {actionError && (
        <Text className={styles.actionError}>⚠️ {actionError}</Text>
      )}

      {/* Column headers */}
      <div className={styles.header}>
        <span />
        <span />
        <span className={styles.headerCell}>{t("explorer.colName")}</span>
        <span className={`${styles.headerRight} ${styles.sizeHeaderCell}`}>{t("explorer.colSize")}</span>
        <span className={styles.headerRight}>{t("explorer.colModified")}</span>
        <span />
      </div>

      <UploadZone>
        <div className={styles.list}>
          {/* Inline new-folder row */}
          {creatingFolder && !isSearchMode && (
            <div className={styles.newFolderRow}>
              <div />
              <FolderAdd20Regular style={{ color: tokens.colorBrandForeground1 }} />
              <Input
                ref={newFolderInputRef}
                className={styles.newFolderInput}
                size="small"
                placeholder={t("dept.newFolderPlaceholder")}
                value={newFolderName}
                onChange={(_, d) => setNewFolderName(d.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); handleCreateFolderConfirm(); }
                  if (e.key === "Escape") { setCreatingFolder(false); setNewFolderName(""); }
                }}
                disabled={mutations.createNewFolder.isPending}
              />
              <div className={styles.newFolderActions}>
                <Button
                  appearance="primary" size="small"
                  icon={mutations.createNewFolder.isPending ? <Spinner size="tiny" /> : <Checkmark20Regular />}
                  disabled={mutations.createNewFolder.isPending || !newFolderName.trim()}
                  onClick={handleCreateFolderConfirm}
                />
                <Button
                  appearance="subtle" size="small" icon={<Dismiss20Regular />}
                  disabled={mutations.createNewFolder.isPending}
                  onClick={() => { setCreatingFolder(false); setNewFolderName(""); }}
                />
              </div>
            </div>
          )}

          {isLoadingItems ? (
            <LoadingSkeleton />
          ) : isError ? (
            <div className={styles.empty}>
              <Text className={styles.emptyText} style={{ color: tokens.colorPaletteRedForeground1 }}>
                {t("explorer.loadError")}
              </Text>
              <Text className={styles.emptySubtext}>{t("explorer.loadErrorHint")}</Text>
            </div>
          ) : displayItems.length === 0 ? (
            <div className={styles.empty}>
              <FolderOpenRegular className={styles.emptyIcon} />
              <Text className={styles.emptyText}>
                {isSearchMode ? t("explorer.noResults") : t("explorer.emptyFolder")}
              </Text>
              <Text className={styles.emptySubtext}>
                {isSearchMode
                  ? t("explorer.noResultsHint").replace("{query}", searchQuery)
                  : t("explorer.emptyFolderHint")}
              </Text>
            </div>
          ) : (
            [...displayItems]
              .sort((a: DriveItem, b: DriveItem) => {
                if (!!a.folder !== !!b.folder) return a.folder ? -1 : 1;
                return a.name.localeCompare(b.name, "fr");
              })
              .map((item: DriveItem) => (
                <FileListItem
                  key={item.id}
                  item={item}
                  isSelected={selectedIds.has(item.id)}
                  onToggle={handleToggle}
                  isRenaming={renamingId === item.id}
                  onStartRename={handleStartRename}
                  onRenameSubmit={handleRenameSubmit}
                  onRenameCancel={handleRenameCancel}
                />
              ))
          )}
        </div>
      </UploadZone>

      {/* Copy / Move dialog */}
      {copyMoveMode && driveId && (
        <CopyMoveDialog
          open={!!copyMoveMode}
          onClose={() => setCopyMoveMode(null)}
          mode={copyMoveMode}
          selectedItems={displayItems.filter((i) => selectedIds.has(i.id))}
          sourceDriveId={driveId}
          onConfirm={async (destDriveId, destFolderId) => {
            if (copyMoveMode === "copy") {
              await mutations.copyItems.mutateAsync({ itemIds: [...selectedIds], destDriveId, destFolderId });
            } else {
              await mutations.moveItems.mutateAsync({ itemIds: [...selectedIds], destDriveId, destFolderId });
            }
            setSelectedIds(new Set());
            setCopyMoveMode(null);
          }}
        />
      )}
    </div>
  );
}
