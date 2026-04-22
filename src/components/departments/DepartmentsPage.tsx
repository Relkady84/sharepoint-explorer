import { useState, useEffect } from "react";
import {
  makeStyles,
  tokens,
  Text,
  Input,
  Spinner,
  Button,
  Badge,
} from "@fluentui/react-components";
import {
  Search20Regular,
  BuildingRegular,
  DismissRegular,
} from "@fluentui/react-icons";
import { useDeptRoot, useDeptFolders, DEPT_ROOT_PATH } from "../../hooks/useDepartments";
import { DepartmentSection } from "./DepartmentSection";
import { useNavigationStore } from "../../store/navigationStore";
import { useDrives } from "../../hooks/useDrives";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
    backgroundColor: tokens.colorNeutralBackground1,
  },

  /* ── Header ── */
  header: {
    padding: "20px 24px 16px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    flexShrink: 0,
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "4px",
  },
  titleIcon: { color: tokens.colorBrandForeground1 },
  title: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  breadcrumb: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginBottom: "14px",
    display: "block",
    fontFamily: tokens.fontFamilyMonospace,
  },

  /* ── Drive selector ── */
  driveRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "12px",
    flexWrap: "wrap",
  },
  driveLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginRight: "2px",
  },

  /* ── Search ── */
  searchRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  searchInput: { flex: 1, maxWidth: "480px" },
  resultsBadge: { flexShrink: 0 },

  /* ── Content ── */
  content: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    flex: 1,
    padding: "40px",
    textAlign: "center",
  },
  centerIcon: { color: tokens.colorNeutralForeground3, opacity: 0.5 },
  errorBox: {
    padding: "16px 20px",
    backgroundColor: tokens.colorPaletteRedBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorPaletteRedBorder2}`,
  },
  errorText: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: tokens.fontSizeBase200,
  },
  noResults: {
    textAlign: "center",
    color: tokens.colorNeutralForeground3,
    padding: "32px 0",
  },
});

export function DepartmentsPage() {
  const styles = useStyles();
  const [search, setSearch] = useState("");
  const { siteId, siteName, driveId, setSite } = useNavigationStore();
  const { data: drives } = useDrives(siteId);

  // Track which drive the user explicitly chose for departments
  const [deptDriveId, setDeptDriveId] = useState<string | null>(null);

  // When drives load, default to the one named "General" (or "Documents partagés"),
  // otherwise fall back to the store's current driveId
  useEffect(() => {
    if (!drives || deptDriveId) return;
    const preferred =
      drives.find((d) =>
        ["general", "documents partagés", "shared documents"].includes(
          d.name.toLowerCase()
        )
      ) ?? drives[0];
    if (preferred) setDeptDriveId(preferred.id);
  }, [drives, deptDriveId]);

  const activeDriveId = deptDriveId ?? driveId;

  const {
    data: root,
    isLoading: rootLoading,
    isError: rootError,
  } = useDeptRoot(activeDriveId);

  const { data: deptFolders, isLoading: foldersLoading } = useDeptFolders(
    activeDriveId,
    root?.id ?? null
  );

  const isLoading = rootLoading || foldersLoading;

  // Count visible (matching) departments when searching
  const visibleCount = search.trim().length >= 1 ? undefined : deptFolders?.length;

  /* ── No site selected ── */
  if (!siteId) {
    return (
      <div className={styles.center}>
        <BuildingRegular fontSize={56} className={styles.centerIcon} />
        <Text size={500} weight="semibold" style={{ color: tokens.colorNeutralForeground2 }}>
          Sélectionnez un site
        </Text>
        <Text style={{ color: tokens.colorNeutralForeground3 }}>
          Choisissez un site SharePoint dans la barre latérale pour accéder aux
          dossiers des départements.
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <BuildingRegular fontSize={26} className={styles.titleIcon} />
          <Text className={styles.title}>Dossiers des Départements</Text>
          {visibleCount !== undefined && (
            <Badge appearance="outline" color="informative">
              {visibleCount} département{visibleCount !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        <Text className={styles.breadcrumb}>
          {siteName} › {DEPT_ROOT_PATH.replace("/", " › ")}
        </Text>

        {/* Drive / library selector */}
        {drives && drives.length > 1 && (
          <div className={styles.driveRow}>
            <Text className={styles.driveLabel}>Bibliothèque :</Text>
            {drives.map((d) => (
              <Button
                key={d.id}
                size="small"
                appearance={activeDriveId === d.id ? "primary" : "outline"}
                shape="circular"
                onClick={() => {
                  setDeptDriveId(d.id);
                  setSite(siteId, siteName, d.id);
                }}
              >
                {d.name}
              </Button>
            ))}
          </div>
        )}

        {/* Search */}
        <div className={styles.searchRow}>
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
                  aria-label="Effacer la recherche"
                />
              ) : undefined
            }
            placeholder="Rechercher un document dans tous les départements…"
            value={search}
            onChange={(_, d) => setSearch(d.value)}
          />
        </div>
      </div>

      {/* ── Content ── */}
      <div className={styles.content}>
        {/* Loading */}
        {isLoading && (
          <div className={styles.center}>
            <Spinner size="medium" label="Chargement des départements…" />
          </div>
        )}

        {/* Error: path not found */}
        {rootError && !isLoading && (
          <div className={styles.errorBox}>
            <Text className={styles.errorText}>
              Dossier introuvable :{" "}
              <strong>{DEPT_ROOT_PATH}</strong>
              <br />
              Vérifiez que la bibliothèque sélectionnée contient bien ce
              chemin, ou changez de bibliothèque ci-dessus.
            </Text>
          </div>
        )}

        {/* Department sections */}
        {!isLoading && !rootError && deptFolders && (
          <>
            {deptFolders.length === 0 ? (
              <div className={styles.center}>
                <Text style={{ color: tokens.colorNeutralForeground3 }}>
                  Aucun sous-dossier trouvé dans « dossiers des dpts ».
                </Text>
              </div>
            ) : (
              deptFolders.map((dept) => (
                <DepartmentSection
                  key={dept.id}
                  folder={dept}
                  driveId={activeDriveId!}
                  searchQuery={search}
                  defaultOpen={search.trim().length > 0 || deptFolders.length <= 6}
                />
              ))
            )}

            {/* All filtered out */}
            {search.trim().length >= 1 &&
              deptFolders.every((dept) => {
                const q = search.trim().toLowerCase();
                return !dept.name.toLowerCase().includes(q);
              }) && (
                <Text className={styles.noResults}>
                  Aucun résultat pour « {search} »
                </Text>
              )}
          </>
        )}
      </div>
    </div>
  );
}
