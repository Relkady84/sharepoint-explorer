import { useState } from "react";
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
  PinOffRegular,
  FolderArrowRightRegular,
} from "@fluentui/react-icons";
import {
  useDeptFolders,
  getPinnedFolder,
  clearPinnedFolder,
} from "../../hooks/useDepartments";
import { DepartmentSection } from "./DepartmentSection";
import { useNavigationStore } from "../../store/navigationStore";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
    backgroundColor: tokens.colorNeutralBackground1,
  },

  // ── Header ──
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
  breadcrumb: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginBottom: "14px",
    display: "block",
    fontFamily: tokens.fontFamilyMonospace,
  },
  searchRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  searchInput: { flex: 1, maxWidth: "480px" },

  // ── Content ──
  content: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  // ── Empty / center states ──
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
  instructions: {
    padding: "24px",
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusLarge,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    maxWidth: "480px",
    textAlign: "left",
  },
  instructionStep: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
  },
  stepNum: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
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
  const [pinVersion, setPinVersion] = useState(0); // bump to re-read localStorage
  const { siteId, siteName, setActiveView } = useNavigationStore();

  const pinned = getPinnedFolder();

  const { data: deptFolders, isLoading } = useDeptFolders(
    pinned?.driveId ?? null,
    pinned?.itemId ?? null
  );

  const visibleCount =
    search.trim().length >= 1 ? undefined : deptFolders?.length;

  const handleUnpin = () => {
    clearPinnedFolder();
    setPinVersion((v) => v + 1); // force re-render
  };

  // ── No site selected ──
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

  // ── Nothing pinned yet ──
  if (!pinned) {
    return (
      <div className={styles.center}>
        <FolderArrowRightRegular fontSize={56} className={styles.centerIcon} />
        <Text size={500} weight="semibold" style={{ color: tokens.colorNeutralForeground2 }}>
          Aucun dossier sélectionné
        </Text>

        <div className={styles.instructions}>
          <Text weight="semibold" size={300}>
            Comment configurer les Départements :
          </Text>

          <div className={styles.instructionStep}>
            <div className={styles.stepNum}>1</div>
            <div>
              <Text weight="semibold" size={200}>Allez dans l'onglet Explorer</Text>
              <br />
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                Cliquez sur "Explorer" en haut de la barre latérale.
              </Text>
            </div>
          </div>

          <div className={styles.instructionStep}>
            <div className={styles.stepNum}>2</div>
            <div>
              <Text weight="semibold" size={200}>Naviguez jusqu'au dossier</Text>
              <br />
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                Ouvrez le dossier qui contient vos sous-dossiers de départements (ex: <em>dossiers des dpts</em>).
              </Text>
            </div>
          </div>

          <div className={styles.instructionStep}>
            <div className={styles.stepNum}>3</div>
            <div>
              <Text weight="semibold" size={200}>Cliquez sur 📌 Épingler</Text>
              <br />
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                Le bouton apparaît dans la barre d'outils en haut. Un seul clic suffit — c'est enregistré automatiquement.
              </Text>
            </div>
          </div>

          <Button
            appearance="primary"
            onClick={() => setActiveView("explorer")}
            icon={<FolderArrowRightRegular />}
          >
            Aller dans Explorer
          </Button>
        </div>
      </div>
    );
  }

  // ── Pinned folder loaded ──
  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <BuildingRegular fontSize={26} className={styles.titleIcon} />
          <Text className={styles.title}>Dossiers des Départements</Text>
          {visibleCount !== undefined && (
            <Badge appearance="outline" color="informative">
              {visibleCount} département{visibleCount !== 1 ? "s" : ""}
            </Badge>
          )}
          <Button
            appearance="subtle"
            size="small"
            icon={<PinOffRegular />}
            onClick={handleUnpin}
            title="Changer de dossier"
          />
        </div>

        <Text className={styles.breadcrumb}>
          {siteName} › {pinned.label}
        </Text>

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

      {/* Content */}
      <div className={styles.content}>
        {isLoading && (
          <div className={styles.center}>
            <Spinner size="medium" label="Chargement des départements…" />
          </div>
        )}

        {!isLoading && deptFolders && (
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
                  driveId={pinned.driveId}
                  searchQuery={search}
                  defaultOpen={
                    search.trim().length > 0 || deptFolders.length <= 6
                  }
                />
              ))
            )}

            {search.trim().length >= 1 &&
              deptFolders.every(
                (dept) =>
                  !dept.name.toLowerCase().includes(search.trim().toLowerCase())
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
