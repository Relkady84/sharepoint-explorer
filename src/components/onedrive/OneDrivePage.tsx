import { useState, useMemo } from "react";
import {
  makeStyles,
  mergeClasses,
  tokens,
  Text,
  Input,
  Spinner,
  Button,
  Badge,
  Tooltip,
  TabList,
  Tab,
} from "@fluentui/react-components";
import {
  Search20Regular,
  Cloud24Filled,
  DismissRegular,
  ArrowDownload20Regular,
  Open20Regular,
  ChevronRight16Regular,
  HomeRegular,
  PersonRegular,
  PeopleRegular,
} from "@fluentui/react-icons";
import { FileTypeIcon } from "../files/FileTypeIcon";
import { formatFileSize } from "../../utils/fileSize";
import { formatDate } from "../../utils/dateFormat";
import { useSharedWithMe, useMyDriveChildren } from "../../hooks/useSharedWithMe";
import { useAuth } from "../../auth/useAuth";
import { getItemWithDownloadUrl } from "../../api/driveApi";
import { useTranslation } from "../../i18n/useTranslation";
import type { DriveItem, SharedDriveItem } from "../../types/graph";

const ONEDRIVE_BLUE = "#0364B8";

type SubView = "mine" | "shared";

interface Crumb {
  id: string | null; // null = root
  name: string;
}

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
    backgroundColor: tokens.colorNeutralBackground1,
  },
  header: {
    padding: "16px 24px 12px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    flexShrink: 0,
    "@media (max-width: 600px)": {
      padding: "12px 12px 10px",
    },
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "12px",
  },
  brandIcon: { color: ONEDRIVE_BLUE, flexShrink: 0 },
  title: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightSemibold,
    color: ONEDRIVE_BLUE,
    letterSpacing: "-0.01em",
  },
  searchInput: { maxWidth: "480px", width: "100%" },
  subtabs: {
    padding: "0 24px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    flexShrink: 0,
    backgroundColor: tokens.colorNeutralBackground1,
    overflowX: "auto",
    "@media (max-width: 600px)": {
      padding: "0 12px",
    },
  },
  breadcrumbs: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "10px 24px 4px",
    flexWrap: "wrap",
    "@media (max-width: 600px)": {
      padding: "8px 12px 2px",
    },
  },
  crumb: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorBrandForeground1,
    cursor: "pointer",
    padding: "2px 6px",
    borderRadius: tokens.borderRadiusSmall,
    "&:hover": { backgroundColor: tokens.colorNeutralBackground1Hover },
  },
  crumbCurrent: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground1,
    fontWeight: tokens.fontWeightSemibold,
    padding: "2px 6px",
  },
  crumbSep: { color: tokens.colorNeutralForeground3, flexShrink: 0 },
  content: {
    flex: 1,
    overflowY: "auto",
    padding: "8px 16px 24px",
    "@media (max-width: 600px)": {
      padding: "6px 8px 16px",
    },
  },
  row: {
    display: "grid",
    gridTemplateColumns: "32px 1fr 180px 100px 140px 72px",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    borderRadius: tokens.borderRadiusMedium,
    cursor: "pointer",
    "&:hover": { backgroundColor: tokens.colorNeutralBackground1Hover },
    "&:hover .actions": { opacity: 1 },
    // Touch devices have no hover — show actions always
    "@media (hover: none)": {
      "& .actions": { opacity: 1 },
    },
    // Mobile: 4 cols (icon, name, date, actions). Owner & size are hidden via display:none
    "@media (max-width: 600px)": {
      gridTemplateColumns: "28px 1fr 92px 56px",
      gap: "6px",
      padding: "10px 10px",
    },
  },
  rowMine: {
    gridTemplateColumns: "32px 1fr 100px 140px 72px",
    "@media (max-width: 600px)": {
      gridTemplateColumns: "28px 1fr 92px 56px",
    },
  },
  hideOnMobile: {
    "@media (max-width: 600px)": {
      display: "none",
    },
  },
  nameCell: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  name: {
    fontSize: tokens.fontSizeBase300,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  folderName: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
  },
  meta: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  metaRight: {
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
  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    flex: 1,
    padding: "40px",
    textAlign: "center",
  },
  centerIcon: { color: ONEDRIVE_BLUE, opacity: 0.35 },
  errorBox: {
    padding: "16px 20px",
    backgroundColor: tokens.colorPaletteRedBackground1,
    borderRadius: tokens.borderRadiusLarge,
    border: `1px solid ${tokens.colorPaletteRedBorderActive}`,
    maxWidth: "480px",
    textAlign: "left",
  },
  emptyHint: {
    color: tokens.colorNeutralForeground3,
    maxWidth: "440px",
  },
});

// ── Row for Shared with me ───────────────────────────────────────────────────

function SharedItemRow({ item }: { item: SharedDriveItem }) {
  const styles = useStyles();
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const remote = item.remoteItem;
  const isFolder = !!remote.folder;
  const ownerName =
    remote.shared?.owner?.user?.displayName ??
    remote.shared?.owner?.user?.email ??
    "—";

  const open = () => {
    if (remote.webUrl) window.open(remote.webUrl, "_blank", "noopener,noreferrer");
  };

  const download = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      let url = remote["@microsoft.graph.downloadUrl"];
      if (!url) {
        const token = await getToken();
        const full = await getItemWithDownloadUrl(
          token,
          remote.parentReference.driveId,
          remote.id
        );
        url = full["@microsoft.graph.downloadUrl"];
      }
      if (!url) return;
      const a = document.createElement("a");
      a.href = url;
      a.download = remote.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const iconItem: DriveItem = {
    id: remote.id,
    name: remote.name,
    lastModifiedDateTime: remote.lastModifiedDateTime,
    createdDateTime: remote.createdDateTime,
    webUrl: remote.webUrl,
    folder: remote.folder,
    file: remote.file,
    parentReference: remote.parentReference,
  };

  return (
    <div className={styles.row} onClick={open} role="row" aria-label={remote.name}>
      <FileTypeIcon item={iconItem} size={20} />

      <div className={styles.nameCell}>
        <Text
          className={mergeClasses(styles.name, isFolder && styles.folderName)}
          title={remote.name}
        >
          {remote.name}
        </Text>
      </div>

      <Text
        className={mergeClasses(styles.meta, styles.hideOnMobile)}
        title={`${t("onedrive.sharedBy")} ${ownerName}`}
      >
        👤 {ownerName}
      </Text>

      <Text className={mergeClasses(styles.metaRight, styles.hideOnMobile)}>
        {isFolder
          ? `${remote.folder!.childCount} ${t("common.items")}`
          : formatFileSize(remote.size)}
      </Text>

      <Text className={styles.metaRight}>
        {formatDate(remote.lastModifiedDateTime)}
      </Text>

      <div className={mergeClasses(styles.actions, "actions")}>
        {!isFolder && (
          <Tooltip content={t("common.download")} relationship="label">
            <Button
              appearance="subtle"
              size="small"
              icon={<ArrowDownload20Regular />}
              onClick={download}
            />
          </Tooltip>
        )}
        <Tooltip content={t("onedrive.openInOneDrive")} relationship="label">
          <Button
            appearance="subtle"
            size="small"
            icon={<Open20Regular />}
            onClick={(e) => {
              e.stopPropagation();
              open();
            }}
          />
        </Tooltip>
      </div>
    </div>
  );
}

// ── Row for Mon OneDrive (also drillable on folder click) ────────────────────

interface MineRowProps {
  item: DriveItem;
  onOpenFolder: (item: DriveItem) => void;
}

function MyDriveRow({ item, onOpenFolder }: MineRowProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const isFolder = !!item.folder;

  const handleClick = () => {
    if (isFolder) {
      onOpenFolder(item);
    } else if (item.webUrl) {
      window.open(item.webUrl, "_blank", "noopener,noreferrer");
    }
  };

  const download = async (e: React.MouseEvent) => {
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

  return (
    <div
      className={mergeClasses(styles.row, styles.rowMine)}
      onClick={handleClick}
      role="row"
      aria-label={item.name}
    >
      <FileTypeIcon item={item} size={20} />

      <div className={styles.nameCell}>
        <Text
          className={mergeClasses(styles.name, isFolder && styles.folderName)}
          title={item.name}
        >
          {item.name}
        </Text>
      </div>

      <Text className={mergeClasses(styles.metaRight, styles.hideOnMobile)}>
        {isFolder
          ? `${item.folder!.childCount} ${t("common.items")}`
          : formatFileSize(item.size)}
      </Text>

      <Text className={styles.metaRight}>
        {formatDate(item.lastModifiedDateTime)}
      </Text>

      <div className={mergeClasses(styles.actions, "actions")}>
        {!isFolder && (
          <Tooltip content={t("common.download")} relationship="label">
            <Button
              appearance="subtle"
              size="small"
              icon={<ArrowDownload20Regular />}
              onClick={download}
            />
          </Tooltip>
        )}
        <Tooltip content={t("onedrive.openInOneDrive")} relationship="label">
          <Button
            appearance="subtle"
            size="small"
            icon={<Open20Regular />}
            onClick={(e) => {
              e.stopPropagation();
              if (item.webUrl) {
                window.open(item.webUrl, "_blank", "noopener,noreferrer");
              }
            }}
          />
        </Tooltip>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function OneDrivePage() {
  const styles = useStyles();
  const { t } = useTranslation();
  const [view, setView] = useState<SubView>("mine");
  const [search, setSearch] = useState("");

  // Folder navigation stack for "Mon OneDrive". First entry is always root.
  // Note: stored name is replaced by t("onedrive.myDrive") at render-time so
  // changing language updates the breadcrumb root immediately.
  const [crumbs, setCrumbs] = useState<Crumb[]>([{ id: null, name: "" }]);
  const currentFolderId = crumbs[crumbs.length - 1].id;

  const shared = useSharedWithMe();
  const mine = useMyDriveChildren(view === "mine" ? currentFolderId : null);

  const handleOpenFolder = (item: DriveItem) => {
    setCrumbs((c) => [...c, { id: item.id, name: item.name }]);
    setSearch("");
  };

  const handleCrumbClick = (idx: number) => {
    setCrumbs((c) => c.slice(0, idx + 1));
    setSearch("");
  };

  const handleSwitchView = (next: SubView) => {
    setView(next);
    setSearch("");
    if (next === "mine") {
      // Reset to root when re-entering Mon OneDrive
      setCrumbs([{ id: null, name: "" }]);
    }
  };

  // ── Filtered lists ──
  const filteredShared = useMemo(() => {
    const items = shared.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const name = it.remoteItem.name?.toLowerCase() ?? "";
      const owner =
        it.remoteItem.shared?.owner?.user?.displayName?.toLowerCase() ?? "";
      return name.includes(q) || owner.includes(q);
    });
  }, [shared.data, search]);

  const filteredMine = useMemo(() => {
    const items = mine.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => it.name?.toLowerCase().includes(q));
  }, [mine.data, search]);

  const isLoading = view === "mine" ? mine.isLoading : shared.isLoading;
  const error = view === "mine" ? mine.error : shared.error;
  const totalCount = view === "mine" ? filteredMine.length : filteredShared.length;

  // ── Render ──
  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <Cloud24Filled className={styles.brandIcon} />
          <Text className={styles.title}>{t("onedrive.title")}</Text>
          {!isLoading && !error && (
            <Badge appearance="outline" color="informative">
              {totalCount} {t("common.items")}
            </Badge>
          )}
        </div>
        <Input
          className={styles.searchInput}
          contentBefore={<Search20Regular />}
          contentAfter={
            search ? (
              <Button
                appearance="transparent"
                size="small"
                icon={<DismissRegular />}
                onClick={() => setSearch("")}
                aria-label={t("common.close")}
              />
            ) : undefined
          }
          placeholder={
            view === "mine"
              ? t("onedrive.searchHere")
              : t("onedrive.searchByNameOrAuthor")
          }
          value={search}
          onChange={(_, d) => setSearch(d.value)}
        />
      </div>

      {/* Sub-tabs */}
      <div className={styles.subtabs}>
        <TabList
          selectedValue={view}
          onTabSelect={(_, d) => handleSwitchView(d.value as SubView)}
          size="small"
        >
          <Tab value="mine" icon={<PersonRegular />}>
            {t("onedrive.myDrive")}
          </Tab>
          <Tab value="shared" icon={<PeopleRegular />}>
            {t("onedrive.sharedWithMe")}
          </Tab>
        </TabList>
      </div>

      {/* Breadcrumbs (only for Mon OneDrive) */}
      {view === "mine" && (
        <div className={styles.breadcrumbs}>
          {crumbs.map((c, idx) => {
            const isLast = idx === crumbs.length - 1;
            // Root crumb's display name comes from the active translation
            const displayName = idx === 0 ? t("onedrive.myDrive") : c.name;
            return (
              <span key={`${c.id ?? "root"}-${idx}`} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                {isLast ? (
                  <Text className={styles.crumbCurrent}>
                    {idx === 0 ? <HomeRegular style={{ verticalAlign: "middle", marginRight: 4 }} /> : null}
                    {displayName}
                  </Text>
                ) : (
                  <Text
                    className={styles.crumb}
                    onClick={() => handleCrumbClick(idx)}
                    role="button"
                  >
                    {idx === 0 ? <HomeRegular style={{ verticalAlign: "middle", marginRight: 4 }} /> : null}
                    {displayName}
                  </Text>
                )}
                {!isLast && <ChevronRight16Regular className={styles.crumbSep} />}
              </span>
            );
          })}
        </div>
      )}

      {/* Body */}
      {isLoading ? (
        <div className={styles.center}>
          <Spinner
            size="medium"
            label={
              view === "mine"
                ? t("onedrive.loadingMine")
                : t("onedrive.loadingShared")
            }
          />
        </div>
      ) : error ? (
        <div className={styles.center}>
          <Cloud24Filled fontSize={56} className={styles.centerIcon} />
          <div className={styles.errorBox}>
            <Text weight="semibold" style={{ color: tokens.colorPaletteRedForeground1 }}>
              {(error as Error).message}
            </Text>
          </div>
        </div>
      ) : view === "mine" ? (
        filteredMine.length === 0 ? (
          <div className={styles.center}>
            <Cloud24Filled fontSize={56} className={styles.centerIcon} />
            <Text size={500} weight="semibold" style={{ color: tokens.colorNeutralForeground2 }}>
              {search ? `« ${search} » — ${t("common.search")}` : t("onedrive.emptyMine")}
            </Text>
          </div>
        ) : (
          <div className={styles.content}>
            {filteredMine.map((it) => (
              <MyDriveRow key={it.id} item={it} onOpenFolder={handleOpenFolder} />
            ))}
          </div>
        )
      ) : filteredShared.length === 0 ? (
        <div className={styles.center}>
          <Cloud24Filled fontSize={56} className={styles.centerIcon} />
          <Text size={500} weight="semibold" style={{ color: tokens.colorNeutralForeground2 }}>
            {search ? `« ${search} » — ${t("common.search")}` : t("onedrive.emptyShared")}
          </Text>
          {!search && (
            <Text size={200} className={styles.emptyHint}>
              {t("onedrive.emptySharedHint")}
            </Text>
          )}
        </div>
      ) : (
        <div className={styles.content}>
          {filteredShared.map((it) => (
            <SharedItemRow key={it.id} item={it} />
          ))}
        </div>
      )}
    </div>
  );
}
