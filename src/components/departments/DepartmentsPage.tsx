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
  FolderArrowRightRegular,
  PinOffRegular,
} from "@fluentui/react-icons";
import {
  useDeptFolders,
  getPinnedFolders,
  removePinnedFolder,
  type PinnedFolder,
} from "../../hooks/useDepartments";
import { DepartmentSection } from "./DepartmentSection";
import { useNavigationStore } from "../../store/navigationStore";

// ── Styles ────────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
    backgroundColor: tokens.colorNeutralBackground1,
  },
  header: {
    padding: "16px 24px 14px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    flexShrink: 0,
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px",
  },
  titleIcon: { color: tokens.colorBrandForeground1 },
  title: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    flex: 1,
  },
  searchRow: { display: "flex", gap: "8px" },
  searchInput: { flex: 1, maxWidth: "480px" },

  // ── Scrollable content ──
  content: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },

  // ── One group per pinned folder ──
  group: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    flexShrink: 0,
  },
  groupHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    paddingBottom: "6px",
    borderBottom: `2px solid ${tokens.colorBrandStroke1}`,
  },
  groupLabel: {
    flex: 1,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorBrandForeground1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  groupCount: { flexShrink: 0 },
  unpinBtn: { flexShrink: 0 },

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
    maxWidth: "460px",
    textAlign: "left",
  },
  step: { display: "flex", alignItems: "flex-start", gap: "10px" },
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
    padding: "16px 0",
    fontStyle: "italic",
    fontSize: tokens.fontSizeBase200,
  },
});

// ── PinnedGroup — one self-contained group per pinned folder ──────────────────

interface GroupProps {
  pin: PinnedFolder;
  search: string;
  onUnpin: (itemId: string) => void;
}

function PinnedGroup({ pin, search, onUnpin }: GroupProps) {
  const styles = useStyles();
  const { data: deptFolders, isLoading } = useDeptFolders(pin.driveId, pin.itemId);

  const visible = search.trim().length >= 1
    ? (deptFolders ?? []).filter((d) =>
        d.name.toLowerCase().includes(search.trim().toLowerCase())
      )
    : (deptFolders ?? []);

  // Hide entire group when searching and nothing matches
  if (search.trim().length >= 1 && !isLoading && visible.length === 0) return null;

  return (
    <div className={styles.group}>
      {/* Group header */}
      <div className={styles.groupHeader}>
        <Text className={styles.groupLabel} title={pin.label}>
          📁 {pin.label}
        </Text>
        {deptFolders !== undefined && (
          <Badge
            className={styles.groupCount}
            appearance="outline"
            color="informative"
            size="small"
          >
            {visible.length} dept{visible.length !== 1 ? "s" : ""}
          </Badge>
        )}
        <Button
          className={styles.unpinBtn}
          appearance="subtle"
          size="small"
          icon={<PinOffRegular />}
          title="Désépingler ce dossier"
          onClick={() => onUnpin(pin.itemId)}
        />
      </div>

      {/* Department sections */}
      {isLoading ? (
        <Spinner size="tiny" label="Chargement…" />
      ) : visible.length === 0 ? (
        <Text className={styles.noResults}>Aucun sous-dossier trouvé.</Text>
      ) : (
        visible.map((dept) => (
          <DepartmentSection
            key={dept.id}
            folder={dept}
            driveId={pin.driveId}
            searchQuery={search}
            defaultOpen={search.trim().length > 0 || visible.length <= 6}
          />
        ))
      )}
    </div>
  );
}

// ── DepartmentsPage ───────────────────────────────────────────────────────────

export function DepartmentsPage() {
  const styles = useStyles();
  const [search, setSearch] = useState("");
  const { siteId, setActiveView } = useNavigationStore();
  const [pins, setPins] = useState<PinnedFolder[]>(() => getPinnedFolders());

  const handleUnpin = (itemId: string) => {
    setPins(removePinnedFolder(itemId));
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

  // ── Nothing pinned ──
  if (pins.length === 0) {
    return (
      <div className={styles.center}>
        <FolderArrowRightRegular fontSize={56} className={styles.centerIcon} />
        <Text size={500} weight="semibold" style={{ color: tokens.colorNeutralForeground2 }}>
          Aucun dossier épinglé
        </Text>
        <div className={styles.instructions}>
          <Text weight="semibold" size={300}>Comment configurer :</Text>
          <div className={styles.step}>
            <div className={styles.stepNum}>1</div>
            <div>
              <Text weight="semibold" size={200}>Allez dans Explorer</Text>
              <br />
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                Cliquez sur "Explorer" dans la barre latérale.
              </Text>
            </div>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNum}>2</div>
            <div>
              <Text weight="semibold" size={200}>Naviguez jusqu'au dossier voulu</Text>
              <br />
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                Ouvrez le dossier qui contient vos sous-dossiers (ex: dossiers des dpts).
              </Text>
            </div>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNum}>3</div>
            <div>
              <Text weight="semibold" size={200}>Cliquez 📌 Épingler dans la barre d'outils</Text>
              <br />
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                Répétez pour autant de dossiers que vous voulez — chacun aura sa propre section.
              </Text>
            </div>
          </div>
          <Button appearance="primary" icon={<FolderArrowRightRegular />} onClick={() => setActiveView("explorer")}>
            Aller dans Explorer
          </Button>
        </div>
      </div>
    );
  }

  // ── Pinned folders ──
  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <BuildingRegular fontSize={24} className={styles.titleIcon} />
          <Text className={styles.title}>Dossiers des Départements</Text>
          <Badge appearance="outline" color="informative">
            {pins.length} dossier{pins.length !== 1 ? "s" : ""}
          </Badge>
        </div>
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
            placeholder="Rechercher dans tous les dossiers épinglés…"
            value={search}
            onChange={(_, d) => setSearch(d.value)}
          />
        </div>
      </div>

      {/* One group per pin */}
      <div className={styles.content}>
        {pins.map((pin) => (
          <PinnedGroup
            key={pin.itemId}
            pin={pin}
            search={search}
            onUnpin={handleUnpin}
          />
        ))}
      </div>
    </div>
  );
}
