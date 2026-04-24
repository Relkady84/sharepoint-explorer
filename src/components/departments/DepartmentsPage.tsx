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
  FolderSearchRegular,
  CheckmarkRegular,
} from "@fluentui/react-icons";
import {
  useDeptRoot,
  useDeptFolders,
  getDeptRootPath,
  saveDeptRootPath,
} from "../../hooks/useDepartments";
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
    flex: 1,
  },
  driveRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "10px",
    flexWrap: "wrap",
  },
  driveLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  searchRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  searchInput: { flex: 1, maxWidth: "480px" },
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
  centerIcon: { color: tokens.colorNeutralForeground3, opacity: 0.4 },
  errorBox: {
    padding: "16px 20px",
    backgroundColor: tokens.colorPaletteRedBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorPaletteRedBorder2}`,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  errorText: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: tokens.fontSizeBase300,
  },
  errorHint: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
  },
  pathRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  pathInput: { flex: 1 },
  noResults: {
    textAlign: "center",
    color: tokens.colorNeutralForeground3,
    padding: "32px 0",
  },
  pathHint: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    fontFamily: tokens.fontFamilyMonospace,
    marginBottom: "10px",
    display: "block",
  },
});

export function DepartmentsPage() {
  const styles = useStyles();
  const [search, setSearch] = useState("");
  const [deptPath, setDeptPath] = useState(getDeptRootPath);
  const [pathInput, setPathInput] = useState(getDeptRootPath);
  const { siteId, siteName, driveId, setSite } = useNavigationStore();
  const { data: drives } = useDrives(siteId);
  const [deptDriveId, setDeptDriveId] = useState<string | null>(null);

  // Auto-select "General" or first drive
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

  const { data: root, isLoading: rootLoading, isError: rootError } =
    useDeptRoot(activeDriveId, deptPath);

  const { data: deptFolders, isLoading: foldersLoading } = useDeptFolders(
    activeDriveId,
    root?.id ?? null
  );

  const isLoading = rootLoading || foldersLoading;
  const visibleCount =
    search.trim().length >= 1 ? undefined : deptFolders?.length;

  const applyPath = () => {
    const trimmed = pathInput.trim().replace(/^\/|\/$/g, ""); // strip leading/trailing slashes
    setDeptPath(trimmed);
    setPathInput(trimmed);
    saveDeptRootPath(trimmed);
  };

  /* ── No site selected ── */
  if (!siteId) {
    return (
      <div className={styles.center}>
        <BuildingRegular fontSize={56} className={styles.centerIcon} />
        <Text size={500} weight="semibold" style={{ color: tokens.colorNeutralForeground2 }}>
          Sélectionnez un site
        </Text>
        <Text style={{ color: tokens.colorNeutralForeground3 }}>
          Choisissez un site SharePoint dans la barre latérale.
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

        {/* Current path */}
        <Text className={styles.pathHint}>
          {siteName} › {deptPath.replace(/\//g, " › ")}
        </Text>

        {/* Library selector */}
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
                  aria-label="Effacer"
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
        {isLoading && (
          <div className={styles.center}>
            <Spinner size="medium" label="Chargement des départements…" />
          </div>
        )}

        {/* Path not found — show editable path */}
        {rootError && !isLoading && (
          <div className={styles.errorBox}>
            <Text className={styles.errorText}>
              <FolderSearchRegular style={{ verticalAlign: "middle", marginRight: 6 }} />
              Dossier introuvable : <strong>{deptPath}</strong>
            </Text>
            <Text className={styles.errorHint}>
              Corrigez le chemin ci-dessous (exactement comme dans SharePoint,
              sensible à la casse) puis cliquez sur ✓ :
            </Text>
            <div className={styles.pathRow}>
              <Input
                className={styles.pathInput}
                value={pathInput}
                onChange={(_, d) => setPathInput(d.value)}
                onKeyDown={(e) => e.key === "Enter" && applyPath()}
                placeholder="ex: Organisation/Dossiers des Dpts"
              />
              <Button
                appearance="primary"
                icon={<CheckmarkRegular />}
                onClick={applyPath}
              >
                Appliquer
              </Button>
            </div>
            <Text className={styles.errorHint}>
              💡 Allez dans l'onglet <strong>Explorer</strong>, naviguez
              jusqu'au dossier voulu, et copiez les noms exacts des dossiers
              dans ce champ.
            </Text>
          </div>
        )}

        {/* Department sections */}
        {!isLoading && !rootError && deptFolders && (
          <>
            {deptFolders.length === 0 ? (
              <div className={styles.center}>
                <Text style={{ color: tokens.colorNeutralForeground3 }}>
                  Aucun sous-dossier trouvé dans ce dossier.
                </Text>
              </div>
            ) : (
              deptFolders.map((dept) => (
                <DepartmentSection
                  key={dept.id}
                  folder={dept}
                  driveId={activeDriveId!}
                  searchQuery={search}
                  defaultOpen={
                    search.trim().length > 0 || deptFolders.length <= 6
                  }
                />
              ))
            )}

            {search.trim().length >= 1 &&
              deptFolders.every((dept) =>
                !dept.name
                  .toLowerCase()
                  .includes(search.trim().toLowerCase())
              ) && (
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
