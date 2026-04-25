import { useState, useCallback } from "react";
import {
  makeStyles,
  tokens,
  Text,
  Input,
  Spinner,
  Button,
  Badge,
  Tooltip,
} from "@fluentui/react-components";
import {
  Search20Regular,
  BuildingRegular,
  DismissRegular,
  FolderArrowRightRegular,
  Delete20Regular,
  Edit20Regular,
  PinOffRegular,
  ChevronDown20Regular,
  ChevronRight20Regular,
} from "@fluentui/react-icons";
import { useDeptFolders } from "../../hooks/useDepartments";
import type { DriveItem } from "../../types/graph";
import { useAppPins, type AppPin } from "../../hooks/useAppPins";
import { DepartmentSection } from "./DepartmentSection";
import { AssignPinDialog } from "../files/AssignPinDialog";
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
    "@media (max-width: 600px)": {
      padding: "12px 12px 10px",
    },
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
    padding: "8px 12px",
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderLeft: `4px solid ${tokens.colorBrandStroke1}`,
    cursor: "pointer",
    userSelect: "none",
    "&:hover": { backgroundColor: tokens.colorNeutralBackground2Hover },
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
  groupMeta: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    marginTop: "2px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  groupLabelCol: {
    flex: 1,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  groupCount: { flexShrink: 0 },
  adminActions: { display: "flex", gap: "2px", flexShrink: 0 },

  noResults: {
    textAlign: "center",
    color: tokens.colorNeutralForeground3,
    padding: "16px 0",
    fontStyle: "italic",
    fontSize: tokens.fontSizeBase200,
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
  errorBox: {
    padding: "16px 20px",
    backgroundColor: tokens.colorPaletteRedBackground1,
    borderRadius: tokens.borderRadiusLarge,
    border: `1px solid ${tokens.colorPaletteRedBorderActive}`,
    maxWidth: "480px",
    textAlign: "left",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
});

// ── PinnedGroup ───────────────────────────────────────────────────────────────

interface GroupProps {
  pin: AppPin;
  search: string;
  isAdmin: boolean;
  onEdit: (pin: AppPin) => void;
  onDelete: (listItemId: string) => void;
}

function PinnedGroup({ pin, search, isAdmin, onEdit, onDelete }: GroupProps) {
  const styles = useStyles();
  const [groupOpen, setGroupOpen] = useState(true);
  const toggleGroup = useCallback((e: React.MouseEvent) => {
    // Don't toggle when clicking admin action buttons
    if ((e.target as HTMLElement).closest("button")) return;
    setGroupOpen((v) => !v);
  }, []);
  const { data: deptFolders, isLoading } = useDeptFolders(pin.driveId, pin.itemId);
  const visible = deptFolders ?? [];

  // If the pinned folder has no sub-folders (files are directly inside it),
  // treat the folder itself as the single "department" and show its files directly.
  const noSubFolders = !isLoading && visible.length === 0;
  const selfAsFolder: DriveItem | null = noSubFolders
    ? {
        id: pin.itemId,
        name: pin.label,
        folder: { childCount: 0 },
        webUrl: "",
        size: 0,
        lastModifiedDateTime: "",
        createdDateTime: "",
        parentReference: {
          driveId: pin.driveId,
          driveType: "documentLibrary",
          id: pin.itemId,
          path: "",
        },
      }
    : null;

  // Friendly label for who this is assigned to
  const assignedLabel = (() => {
    const raw = pin.assignedTo.trim().toLowerCase();
    if (!raw || raw === "everyone" || raw === "*" || raw === "all") return "Tout le monde";
    return pin.assignedTo.trim().replace(/[\n]/g, ", ");
  })();

  return (
    <div className={styles.group}>
      {/* Group header — click to collapse/expand */}
      <div className={styles.groupHeader} onClick={toggleGroup}>
        {groupOpen
          ? <ChevronDown20Regular style={{ color: tokens.colorBrandForeground1, flexShrink: 0 }} />
          : <ChevronRight20Regular style={{ color: tokens.colorBrandForeground1, flexShrink: 0 }} />
        }

        <div className={styles.groupLabelCol}>
          <Text className={styles.groupLabel} title={pin.label}>
            📁 {pin.label}
          </Text>
          {isAdmin && (
            <Text className={styles.groupMeta} title={`Assigné à : ${assignedLabel}`}>
              👥 {assignedLabel}
            </Text>
          )}
        </div>

        {deptFolders !== undefined && (
          <Badge
            className={styles.groupCount}
            appearance="outline"
            color="informative"
            size="small"
          >
            {visible.length || (selfAsFolder ? 1 : 0)} élém.
          </Badge>
        )}

        {/* Admin controls */}
        {isAdmin && (
          <div className={styles.adminActions}>
            <Tooltip content="Modifier l'assignation" relationship="label">
              <Button
                appearance="subtle"
                size="small"
                icon={<Edit20Regular />}
                onClick={() => onEdit(pin)}
              />
            </Tooltip>
            <Tooltip content="Supprimer cette épingle" relationship="label">
              <Button
                appearance="subtle"
                size="small"
                icon={<Delete20Regular />}
                onClick={() => onDelete(pin.listItemId)}
              />
            </Tooltip>
          </div>
        )}
      </div>

      {/* Department sections — hidden when collapsed */}
      {groupOpen && (
        isLoading ? (
          <Spinner size="tiny" label="Chargement…" />
        ) : selfAsFolder ? (
          // No sub-folders — files are directly inside the pinned folder.
          // hideHeader removes the redundant blue card header (the yellow group
          // header above is already the only toggle the user needs).
          <DepartmentSection
            folder={selfAsFolder}
            driveId={pin.driveId}
            searchQuery={search}
            defaultOpen={true}
            hideHeader
          />
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
        )
      )}
    </div>
  );
}

// ── DepartmentsPage ───────────────────────────────────────────────────────────

export function DepartmentsPage() {
  const styles = useStyles();
  const [search, setSearch] = useState("");
  const { siteId, setActiveView } = useNavigationStore();

  const { myPins, allPins, isLoading, error, isAdmin, remove } = useAppPins();

  // Admin sees all pins; regular user sees only theirs
  const pinsToShow = isAdmin ? allPins : myPins;

  // Edit-pin dialog state
  const [editPin, setEditPin] = useState<AppPin | null>(null);

  const handleDelete = (listItemId: string) => {
    if (confirm("Supprimer cette épingle ?")) {
      remove.mutate(listItemId);
    }
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

  // ── Loading ──
  if (isLoading) {
    return (
      <div className={styles.center}>
        <Spinner size="medium" label="Chargement des dossiers épinglés…" />
      </div>
    );
  }

  // ── AppPins list not found or other error ──
  if (error) {
    const msg = (error as Error).message ?? "";
    const isListMissing = msg.includes("introuvable") || msg.includes("AppPins");

    return (
      <div className={styles.center}>
        <FolderArrowRightRegular fontSize={56} className={styles.centerIcon} />
        {isListMissing ? (
          <div className={styles.instructions}>
            <Text weight="semibold" size={400}>⚙️ Configuration requise</Text>
            <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
              La liste <strong>AppPins</strong> n'existe pas encore sur ce site SharePoint.
              Créez-la en suivant ces étapes :
            </Text>
            <div className={styles.step}>
              <div className={styles.stepNum}>1</div>
              <Text size={200}>
                Allez sur votre site SharePoint → <strong>Contenu du site</strong> →{" "}
                <strong>Nouveau → Liste</strong> → nommez-la <strong>AppPins</strong>
              </Text>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNum}>2</div>
              <Text size={200}>
                Ajoutez 3 colonnes (Ligne de texte simple) :{" "}
                <strong>FolderDriveId</strong>, <strong>FolderItemId</strong>,{" "}
                <strong>AssignedTo</strong> (Plusieurs lignes de texte)
              </Text>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNum}>3</div>
              <Text size={200}>
                Ajoutez votre email dans <strong>VITE_ADMIN_EMAILS</strong> dans{" "}
                <code>.env</code> puis redéployez
              </Text>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNum}>4</div>
              <Text size={200}>
                Allez dans <strong>Explorer</strong>, naviguez jusqu'au dossier voulu,
                cliquez 📌 <strong>Épingler pour des utilisateurs…</strong>
              </Text>
            </div>
          </div>
        ) : (
          <div className={styles.errorBox}>
            <Text weight="semibold" style={{ color: tokens.colorPaletteRedForeground1 }}>
              Erreur de chargement
            </Text>
            <Text size={200}>{msg}</Text>
          </div>
        )}
      </div>
    );
  }

  // ── No pins assigned to this user ──
  if (pinsToShow.length === 0) {
    return (
      <div className={styles.center}>
        <PinOffRegular fontSize={56} className={styles.centerIcon} />
        <Text size={500} weight="semibold" style={{ color: tokens.colorNeutralForeground2 }}>
          {isAdmin ? "Aucune épingle configurée" : "Aucun dossier disponible"}
        </Text>
        {!isAdmin && (
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            Contactez votre administrateur pour obtenir l'accès.
          </Text>
        )}
        {isAdmin ? (
          <div className={styles.instructions}>
            <Text weight="semibold" size={300}>Comment ajouter des dossiers :</Text>
            <div className={styles.step}>
              <div className={styles.stepNum}>1</div>
              <div>
                <Text weight="semibold" size={200}>Allez dans Explorer</Text>
                <br />
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                  Naviguez jusqu'au dossier que vous voulez épingler.
                </Text>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNum}>2</div>
              <div>
                <Text weight="semibold" size={200}>Cliquez 📌 Épingler pour des utilisateurs…</Text>
                <br />
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                  Saisissez les emails des utilisateurs qui verront ce dossier.
                </Text>
              </div>
            </div>
            <Button
              appearance="primary"
              icon={<FolderArrowRightRegular />}
              onClick={() => setActiveView("explorer")}
            >
              Aller dans Explorer
            </Button>
          </div>
        ) : (
          <Text style={{ color: tokens.colorNeutralForeground3 }}>
            L'administrateur ne vous a encore attribué aucun dossier.
          </Text>
        )}
      </div>
    );
  }

  // ── Pinned folders view ──
  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <BuildingRegular fontSize={24} className={styles.titleIcon} />
          <Text className={styles.title}>Dossiers Épinglés</Text>
          <Badge appearance="outline" color="informative">
            {pinsToShow.length} dossier{pinsToShow.length !== 1 ? "s" : ""}
          </Badge>
          {isAdmin && (
            <Badge appearance="filled" color="warning" size="small">
              Admin
            </Badge>
          )}
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
        {pinsToShow.map((pin) => (
          <PinnedGroup
            key={pin.listItemId}
            pin={pin}
            search={search}
            isAdmin={isAdmin}
            onEdit={setEditPin}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Edit dialog */}
      {editPin && (
        <AssignPinDialog
          mode="edit"
          open={!!editPin}
          existingPin={editPin}
          onClose={() => setEditPin(null)}
        />
      )}
    </div>
  );
}
