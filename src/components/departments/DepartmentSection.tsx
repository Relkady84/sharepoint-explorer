import { useState, useRef, useCallback } from "react";
import {
  makeStyles,
  mergeClasses,
  tokens,
  Text,
  Button,
  Badge,
  Spinner,
  Tooltip,
  Checkbox,
  Input,
} from "@fluentui/react-components";
import {
  FolderRegular,
  FolderOpenRegular,
  ChevronDown20Regular,
  ChevronRight20Regular,
  ArrowDownload20Regular,
  Open20Regular,
  Delete20Regular,
  ArrowUpload20Regular,
  Rename20Regular,
} from "@fluentui/react-icons";
import { useDeptFiles, useDeptSearch, useDeptMutations } from "../../hooks/useDepartments";
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
    flexShrink: 0,
    overflow: "hidden",
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

  // ── File manager toolbar ──
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: "2px",
    padding: "3px 8px 3px 12px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground2,
    minHeight: "34px",
  },
  actionError: {
    padding: "6px 16px",
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorPaletteRedForeground1,
    backgroundColor: tokens.colorPaletteRedBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },

  // ── File / folder rows ──
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
  rowSelected: {
    backgroundColor: tokens.colorNeutralBackground3,
    "&:hover": { backgroundColor: tokens.colorNeutralBackground3Hover },
  },
  checkboxCell: { width: "20px", flexShrink: 0 },
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
  renameInput: {
    flex: 1,
    minWidth: 0,
    fontSize: tokens.fontSizeBase300,
    height: "26px",
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
    width: "88px",
    flexShrink: 0,
    display: "flex",
    gap: "2px",
    justifyContent: "flex-end",
    opacity: 0,
    transition: "opacity 0.15s ease",
  },

  // ── Sub-folder loading ──
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

  // ── Search result path hint ──
  pathHint: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    minWidth: 0,
  },
  nameWithPath: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    overflow: "hidden",
    minWidth: 0,
  },

  // ── States ──
  loadingRow: { padding: "14px 16px", display: "flex", alignItems: "center", gap: "8px" },
  empty: {
    padding: "14px 16px",
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    fontStyle: "italic",
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function highlightText(text: string, q: string, highlightClass: string) {
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className={highlightClass}>{text.slice(idx, idx + q.length)}</span>
      {text.slice(idx + q.length)}
    </>
  );
}

function extractPath(item: DriveItem): string {
  const raw = item.parentReference?.path ?? "";
  const rootIdx = raw.indexOf("root:");
  if (rootIdx === -1) return "";
  return raw.slice(rootIdx + 5);
}

async function downloadItem(
  item: DriveItem,
  driveId: string,
  getToken: () => Promise<string>
) {
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
}

function describeApiError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const axiosErr = err as { response?: { status?: number; data?: { error?: { message?: string } } } };
  const status = axiosErr?.response?.status;
  const spMsg = axiosErr?.response?.data?.error?.message ?? "";
  if (status === 403 || status === 401)
    return "Accès refusé — vous n'avez pas la permission d'effectuer cette action sur ce dossier SharePoint.";
  if (spMsg) return `Erreur SharePoint : ${spMsg}`;
  return `Erreur : ${msg}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// DeptItemRow — recursive row for files and expandable sub-folders
// ─────────────────────────────────────────────────────────────────────────────

interface RowProps {
  item: DriveItem;
  driveId: string;
  depth?: number;
  searchQuery?: string;
  // Selection
  isSelected: boolean;
  onToggle: (id: string) => void;
  getIsSelected: (id: string) => boolean;
  // Inline rename
  isRenaming: boolean;
  onStartRename: (id: string) => void;
  onRenameSubmit: (id: string, newName: string) => void;
  onRenameCancel: () => void;
}

function DeptItemRow({
  item,
  driveId,
  depth = 0,
  searchQuery = "",
  isSelected,
  onToggle,
  getIsSelected,
  isRenaming,
  onStartRename,
  onRenameSubmit,
  onRenameCancel,
}: RowProps) {
  const styles = useStyles();
  const [expanded, setExpanded] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const { getToken } = useAuth();
  const isFolder = !!item.folder;

  const { data: children, isLoading: childrenLoading } = useDeptFiles(
    expanded && isFolder ? driveId : null,
    expanded && isFolder ? item.id : null
  );

  const indent = 8 + depth * 20;

  const handleRowClick = (e: React.MouseEvent) => {
    // Don't navigate when clicking the checkbox or inside the rename input
    if ((e.target as HTMLElement).closest("input")) return;
    if (isRenaming) return;
    if (isFolder) setExpanded((v) => !v);
    else window.open(item.webUrl, "_blank", "noopener,noreferrer");
  };

  const q = searchQuery.trim().toLowerCase();

  return (
    <>
      <div
        className={mergeClasses(styles.row, isSelected && styles.rowSelected)}
        style={{ paddingLeft: `${indent}px` }}
        onClick={handleRowClick}
        role="row"
        aria-label={item.name}
        aria-selected={isSelected}
      >
        {/* Checkbox */}
        <div className={styles.checkboxCell} onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onChange={() => onToggle(item.id)}
            aria-label={`Sélectionner ${item.name}`}
          />
        </div>

        {/* Expand chevron (folders only) */}
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

        {/* Name — or inline rename input */}
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
                onRenameSubmit(item.id, (e.target as HTMLInputElement).value);
              } else if (e.key === "Escape") {
                e.stopPropagation();
                onRenameCancel();
              }
            }}
            onBlur={(e) => {
              // Submit on blur — clicking away saves the new name
              onRenameSubmit(item.id, e.target.value);
            }}
          />
        ) : (
          <Text
            className={mergeClasses(styles.nameText, isFolder && styles.folderNameText)}
            title={item.name}
          >
            {highlightText(item.name, q, styles.highlight)}
          </Text>
        )}

        <Text className={styles.metaSize}>
          {isFolder ? `${item.folder!.childCount} élém.` : formatFileSize(item.size)}
        </Text>

        <Text className={styles.metaDate}>{formatDate(item.lastModifiedDateTime)}</Text>

        <div className={mergeClasses(styles.actions, "actions")}>
          {/* Rename */}
          <Tooltip content="Renommer" relationship="label">
            <Button
              appearance="subtle"
              size="small"
              icon={<Rename20Regular />}
              onClick={(e) => {
                e.stopPropagation();
                onStartRename(item.id);
              }}
            />
          </Tooltip>
          {/* Download (files only) */}
          {!isFolder && (
            <Tooltip content="Télécharger" relationship="label">
              <Button
                appearance="subtle"
                size="small"
                icon={<ArrowDownload20Regular />}
                onClick={(e) => {
                  e.stopPropagation();
                  downloadItem(item, driveId, getToken);
                }}
              />
            </Tooltip>
          )}
          {/* Open */}
          <Tooltip content={isFolder ? "Ouvrir dans SharePoint" : "Ouvrir"} relationship="label">
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

      {/* Expanded children */}
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
              isSelected={getIsSelected(child.id)}
              onToggle={onToggle}
              getIsSelected={getIsSelected}
              isRenaming={false}
              onStartRename={onStartRename}
              onRenameSubmit={onRenameSubmit}
              onRenameCancel={onRenameCancel}
            />
          ))
        )
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SearchResultRow — flat row used when a search query is active
// ─────────────────────────────────────────────────────────────────────────────

interface SearchRowProps {
  item: DriveItem;
  driveId: string;
  searchQuery: string;
}

function SearchResultRow({ item, driveId, searchQuery }: SearchRowProps) {
  const styles = useStyles();
  const { getToken } = useAuth();
  const isFolder = !!item.folder;
  const path = extractPath(item);

  return (
    <div
      className={styles.row}
      onClick={() => window.open(item.webUrl, "_blank", "noopener,noreferrer")}
      role="row"
      aria-label={item.name}
      title="Cliquez pour ouvrir"
    >
      <div className={styles.checkboxCell} />
      <div className={styles.chevronCell} />

      <FileTypeIcon item={item} size={20} />

      <div className={styles.nameWithPath}>
        <Text
          className={mergeClasses(styles.nameText, isFolder && styles.folderNameText)}
          title={item.name}
        >
          {highlightText(item.name, searchQuery.trim(), styles.highlight)}
        </Text>
        {path && (
          <Text className={styles.pathHint} title={path}>
            {path}
          </Text>
        )}
      </div>

      <Text className={styles.metaSize}>
        {isFolder ? `${item.folder!.childCount} élém.` : formatFileSize(item.size)}
      </Text>

      <Text className={styles.metaDate}>{formatDate(item.lastModifiedDateTime)}</Text>

      <div className={mergeClasses(styles.actions, "actions")}>
        {!isFolder && (
          <Tooltip content="Télécharger" relationship="label">
            <Button
              appearance="subtle"
              size="small"
              icon={<ArrowDownload20Regular />}
              onClick={(e) => { e.stopPropagation(); downloadItem(item, driveId, getToken); }}
            />
          </Tooltip>
        )}
        <Tooltip content={isFolder ? "Ouvrir dans SharePoint" : "Ouvrir"} relationship="label">
          <Button
            appearance="subtle"
            size="small"
            icon={<Open20Regular />}
            onClick={(e) => { e.stopPropagation(); window.open(item.webUrl, "_blank", "noopener,noreferrer"); }}
          />
        </Tooltip>
      </div>
    </div>
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
  hideHeader?: boolean;
}

export function DepartmentSection({
  folder,
  driveId,
  searchQuery = "",
  defaultOpen = true,
  hideHeader = false,
}: Props) {
  const styles = useStyles();
  const [open, setOpen] = useState(defaultOpen);

  // ── File management state ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const q = searchQuery.trim();
  const isSearching = q.length >= 2;
  const effectiveOpen = hideHeader ? true : open;

  // ── Browse mode: load direct children ──
  const { data: items, isLoading: browseLoading, error: browseError } = useDeptFiles(
    !isSearching && effectiveOpen ? driveId : null,
    !isSearching && effectiveOpen ? folder.id : null
  );

  // ── Search mode: Graph full-text search ──
  const { data: searchResults, isLoading: searchLoading } = useDeptSearch(
    driveId,
    folder.id,
    q
  );

  // ── CRUD mutations ──
  const { deleteItems, rename, upload, isBusy } = useDeptMutations(
    isSearching ? null : driveId,
    isSearching ? null : folder.id
  );

  const isOpen = isSearching ? true : effectiveOpen;

  if (isSearching && !searchLoading && (searchResults ?? []).length === 0) return null;

  const isLoading = isSearching ? searchLoading : browseLoading;
  const displayItems = isSearching ? (searchResults ?? []) : (items ?? []);
  const browseErrorMsg = !isSearching && browseError
    ? ((browseError as { message?: string })?.message ?? String(browseError))
    : null;

  // ── Selection helpers ──
  const getIsSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  const handleToggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const topLevelIds = displayItems.map((i) => i.id);
  const allChecked = topLevelIds.length > 0 && topLevelIds.every((id) => selectedIds.has(id));
  const someChecked = !allChecked && topLevelIds.some((id) => selectedIds.has(id));

  const handleSelectAll = () => setSelectedIds(new Set(topLevelIds));
  const handleDeselectAll = () => setSelectedIds(new Set());

  // ── Actions ──
  const clearError = () => setActionError("");

  const handleDelete = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (!confirm(`Supprimer ${count} élément${count > 1 ? "s" : ""} ? Cette action est irréversible.`)) return;
    clearError();
    try {
      await deleteItems.mutateAsync([...selectedIds]);
      setSelectedIds(new Set());
    } catch (err) {
      setActionError(describeApiError(err));
    }
  };

  const handleStartRename = useCallback((id: string) => {
    setRenamingId(id);
    // Also select the item so the user sees which one is being renamed
    setSelectedIds(new Set([id]));
  }, []);

  const handleRenameSubmit = useCallback(async (id: string, newName: string) => {
    const trimmed = newName.trim();
    setRenamingId(null);
    if (!trimmed) return;
    clearError();
    try {
      await rename.mutateAsync({ itemId: id, newName: trimmed });
    } catch (err) {
      setActionError(describeApiError(err));
    }
  }, [rename]);

  const handleRenameCancel = useCallback(() => {
    setRenamingId(null);
  }, []);

  const handleUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    clearError();
    // Upload files one at a time (sequential mutations)
    const fileArray = Array.from(files);
    const uploadNext = (index: number) => {
      if (index >= fileArray.length) return;
      upload.mutate(
        { file: fileArray[index] },
        {
          onSuccess: () => uploadNext(index + 1),
          onError: (err) => setActionError(describeApiError(err)),
        }
      );
    };
    uploadNext(0);
    // Reset the input so the same file can be re-uploaded if needed
    if (uploadInputRef.current) uploadInputRef.current.value = "";
  };

  return (
    <div className={styles.section}>
      {/* ── Card header (collapsible) ── */}
      {!hideHeader && (
        <div
          className={styles.header}
          onClick={() => { if (!isSearching) setOpen((v) => !v); }}
        >
          {isOpen ? (
            <ChevronDown20Regular className={styles.chevronIcon} />
          ) : (
            <ChevronRight20Regular className={styles.chevronIcon} />
          )}
          {isOpen ? (
            <FolderOpenRegular className={styles.folderIcon} />
          ) : (
            <FolderRegular className={styles.folderIcon} />
          )}
          <Text className={styles.headerTitle}>{folder.name}</Text>
          {!isLoading && (
            <Badge appearance="filled" color="informative" size="small">
              {displayItems.length}
            </Badge>
          )}
        </div>
      )}

      {/* ── Body ── */}
      {isOpen && (
        <div>
          {isLoading ? (
            <div className={styles.loadingRow}>
              <Spinner size="tiny" />
              <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
                {isSearching ? "Recherche…" : "Chargement…"}
              </Text>
            </div>
          ) : browseErrorMsg ? (
            <Text className={styles.empty} style={{ color: tokens.colorPaletteRedForeground1 }}>
              ⚠️ Erreur : {browseErrorMsg}
            </Text>
          ) : (
            <>
              {/* ── File manager toolbar (browse mode only) ── */}
              {!isSearching && (
                <div className={styles.toolbar}>
                  {/* Select-all checkbox */}
                  <Checkbox
                    checked={allChecked ? true : someChecked ? "mixed" : false}
                    onChange={(_, d) => { if (d.checked) handleSelectAll(); else handleDeselectAll(); }}
                    disabled={displayItems.length === 0 || isBusy}
                    aria-label="Tout sélectionner"
                  />

                  {/* Delete — icon only, shown when items are selected */}
                  {selectedIds.size > 0 && (
                    <Tooltip
                      content={`Supprimer ${selectedIds.size} élément${selectedIds.size > 1 ? "s" : ""}`}
                      relationship="label"
                    >
                      <Button
                        appearance="subtle"
                        size="small"
                        icon={deleteItems.isPending ? <Spinner size="tiny" /> : <Delete20Regular />}
                        style={{ color: tokens.colorPaletteRedForeground1 }}
                        disabled={deleteItems.isPending}
                        onClick={handleDelete}
                      />
                    </Tooltip>
                  )}

                  {/* Rename — icon + label, shown when exactly 1 item selected */}
                  {selectedIds.size === 1 && renamingId === null && (
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<Rename20Regular />}
                      disabled={rename.isPending}
                      onClick={() => handleStartRename([...selectedIds][0])}
                    >
                      Renommer
                    </Button>
                  )}

                  {/* Upload — icon + label, always visible */}
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={upload.isPending ? <Spinner size="tiny" /> : <ArrowUpload20Regular />}
                    disabled={upload.isPending}
                    onClick={() => uploadInputRef.current?.click()}
                  >
                    Importer
                  </Button>
                  <input
                    ref={uploadInputRef}
                    type="file"
                    multiple
                    style={{ display: "none" }}
                    onChange={(e) => handleUpload(e.target.files)}
                  />
                </div>
              )}

              {/* ── Inline action error ── */}
              {actionError && (
                <Text className={styles.actionError}>
                  ⚠️ {actionError}
                </Text>
              )}

              {/* ── File rows ── */}
              {displayItems.length === 0 ? (
                <Text className={styles.empty}>Aucun document dans ce dossier.</Text>
              ) : isSearching ? (
                displayItems.map((item) => (
                  <SearchResultRow
                    key={item.id}
                    item={item}
                    driveId={driveId}
                    searchQuery={q}
                  />
                ))
              ) : (
                displayItems.map((item) => (
                  <DeptItemRow
                    key={item.id}
                    item={item}
                    driveId={driveId}
                    depth={0}
                    searchQuery=""
                    isSelected={selectedIds.has(item.id)}
                    onToggle={handleToggle}
                    getIsSelected={getIsSelected}
                    isRenaming={renamingId === item.id}
                    onStartRename={handleStartRename}
                    onRenameSubmit={handleRenameSubmit}
                    onRenameCancel={handleRenameCancel}
                  />
                ))
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
