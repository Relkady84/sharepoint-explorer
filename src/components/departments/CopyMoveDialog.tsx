import { useState } from "react";
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Button,
  Text,
  Spinner,
  tokens,
  makeStyles,
} from "@fluentui/react-components";
import {
  FolderRegular,
  ChevronRight20Regular,
  ChevronDown20Regular,
  Copy20Regular,
  ArrowMove20Regular,
} from "@fluentui/react-icons";
import { useAppPins } from "../../hooks/useAppPins";
import { useDeptFolders } from "../../hooks/useDepartments";
import type { DriveItem } from "../../types/graph";

const useStyles = makeStyles({
  content: { display: "flex", flexDirection: "column", gap: "4px", minHeight: "180px", maxHeight: "360px", overflowY: "auto" },
  destRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 8px",
    borderRadius: tokens.borderRadiusMedium,
    cursor: "pointer",
    "&:hover": { backgroundColor: tokens.colorNeutralBackground2Hover },
  },
  destName: { flex: 1, fontSize: tokens.fontSizeBase300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  actionBtn: { flexShrink: 0 },
  error: { color: tokens.colorPaletteRedForeground1, fontSize: tokens.fontSizeBase200, padding: "8px 0" },
});

interface DestRowProps {
  name: string;
  driveId: string;
  folderId: string;
  depth?: number;
  mode: "copy" | "move";
  onSelect: (driveId: string, folderId: string) => void;
}

function DestFolderRow({ name, driveId, folderId, depth = 0, mode, onSelect }: DestRowProps) {
  const styles = useStyles();
  const [expanded, setExpanded] = useState(false);
  const { data: children, isLoading } = useDeptFolders(expanded ? driveId : null, expanded ? folderId : null);

  return (
    <>
      <div className={styles.destRow} style={{ paddingLeft: `${8 + depth * 16}px` }}>
        <div style={{ width: 20, flexShrink: 0, cursor: "pointer" }} onClick={() => setExpanded(v => !v)}>
          {expanded ? <ChevronDown20Regular style={{ color: tokens.colorNeutralForeground3 }} />
                    : <ChevronRight20Regular style={{ color: tokens.colorNeutralForeground3 }} />}
        </div>
        <FolderRegular style={{ color: tokens.colorBrandForeground1, flexShrink: 0 }} />
        <Text className={styles.destName} title={name}>{name}</Text>
        <Button
          className={styles.actionBtn}
          appearance="primary"
          size="small"
          icon={mode === "copy" ? <Copy20Regular /> : <ArrowMove20Regular />}
          onClick={() => onSelect(driveId, folderId)}
        >
          {mode === "copy" ? "Copier ici" : "Déplacer ici"}
        </Button>
      </div>
      {expanded && isLoading && (
        <div style={{ paddingLeft: `${28 + depth * 16}px`, padding: "4px 8px" }}>
          <Spinner size="tiny" />
        </div>
      )}
      {expanded && !isLoading && (children ?? []).map(child => (
        <DestFolderRow
          key={child.id}
          name={child.name}
          driveId={driveId}
          folderId={child.id}
          depth={depth + 1}
          mode={mode}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  mode: "copy" | "move";
  selectedItems: DriveItem[];
  sourceDriveId: string;
  onConfirm: (destDriveId: string, destFolderId: string) => Promise<void>;
}

export function CopyMoveDialog({ open, onClose, mode, selectedItems, sourceDriveId: _sourceDriveId, onConfirm }: Props) {
  const styles = useStyles();
  const { myPins, allPins, isAdmin } = useAppPins();
  const pins = isAdmin ? allPins : myPins;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleSelect = async (destDriveId: string, destFolderId: string) => {
    setError("");
    setBusy(true);
    try {
      await onConfirm(destDriveId, destFolderId);
      onClose();
    } catch (err) {
      const msg = (err as Error).message ?? String(err);
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const title = mode === "copy"
    ? `Copier ${selectedItems.length} élément${selectedItems.length > 1 ? "s" : ""} vers…`
    : `Déplacer ${selectedItems.length} élément${selectedItems.length > 1 ? "s" : ""} vers…`;

  return (
    <Dialog open={open} onOpenChange={(_, d) => { if (!d.open && !busy) onClose(); }}>
      <DialogSurface style={{ maxWidth: 500 }}>
        <DialogTitle>{mode === "copy" ? <Copy20Regular /> : <ArrowMove20Regular />} {title}</DialogTitle>
        <DialogBody>
          <DialogContent>
            <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
              Sélectionnez le dossier de destination :
            </Text>
            {error && <Text className={styles.error}>⚠️ {error}</Text>}
            <div className={styles.content}>
              {busy ? (
                <Spinner size="small" label={mode === "copy" ? "Copie en cours…" : "Déplacement en cours…"} />
              ) : pins.length === 0 ? (
                <Text style={{ color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 }}>
                  Aucun dossier épinglé disponible.
                </Text>
              ) : (
                pins.map(pin => (
                  <DestFolderRow
                    key={pin.listItemId}
                    name={pin.label}
                    driveId={pin.driveId}
                    folderId={pin.itemId}
                    depth={0}
                    mode={mode}
                    onSelect={handleSelect}
                  />
                ))
              )}
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose} disabled={busy}>
              Annuler
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
