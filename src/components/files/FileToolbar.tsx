import { useRef, useState } from "react";
import {
  Button,
  Checkbox,
  makeStyles,
  tokens,
  Spinner,
  Text,
  Tooltip,
} from "@fluentui/react-components";
import {
  ArrowUpload20Regular,
  ArrowClockwise20Regular,
  Pin20Regular,
  Delete20Regular,
  Rename20Regular,
  FolderAdd20Regular,
  Copy20Regular,
  ArrowMove20Regular,
} from "@fluentui/react-icons";
import { useUpload } from "../../hooks/useUpload";
import { useNavigationStore } from "../../store/navigationStore";
import { useQueryClient } from "@tanstack/react-query";
import { useIsAdmin } from "../../hooks/useAppPins";
import { AssignPinDialog } from "./AssignPinDialog";

const useStyles = makeStyles({
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "6px 12px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    flexWrap: "wrap",
    minHeight: "42px",
  },
  separator: {
    width: "1px",
    height: "20px",
    backgroundColor: tokens.colorNeutralStroke2,
    margin: "0 4px",
    flexShrink: 0,
  },
  statusText: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginLeft: "4px",
  },
  selectionCount: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    padding: "0 4px",
  },
});

export interface FileToolbarActions {
  selectedIds: Set<string>;
  allItemIds: string[];
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDelete: () => void;
  onRenameFromToolbar: () => void;
  onNewFolder: () => void;
  onCopy: () => void;
  onMove: () => void;
  isBusy: boolean;
  isDeleting: boolean;
}

interface FileToolbarProps {
  actions?: FileToolbarActions;
}

export function FileToolbar({ actions }: FileToolbarProps) {
  const styles = useStyles();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { driveId, currentItemId, siteId, breadcrumbs, activeView } = useNavigationStore();
  const uploadMutation = useUpload();
  const queryClient = useQueryClient();
  const isAdmin = useIsAdmin();

  const [pinDialogOpen, setPinDialogOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!driveId || !siteId || files.length === 0) return;
    files.forEach((file) => {
      uploadMutation.mutate({ driveId, parentItemId: currentItemId ?? "root", siteId, file });
    });
    e.target.value = "";
  };

  const handleRefresh = () => queryClient.invalidateQueries({ queryKey: ["driveItems"] });

  const showPinButton = isAdmin && activeView === "explorer" && !!currentItemId && !!driveId;
  const defaultPinLabel = breadcrumbs.length > 0
    ? breadcrumbs.map((b) => b.name).join(" › ")
    : "Dossier épinglé";

  const sel = actions?.selectedIds;
  const selCount = sel?.size ?? 0;
  const allIds = actions?.allItemIds ?? [];
  const allChecked = allIds.length > 0 && allIds.every((id) => sel?.has(id));
  const someChecked = !allChecked && allIds.some((id) => sel?.has(id));

  return (
    <div className={styles.toolbar}>
      <input ref={fileInputRef} type="file" multiple style={{ display: "none" }} onChange={handleFileChange} />

      {/* ── Selection checkbox ── */}
      {actions && (
        <Tooltip content={allChecked ? "Tout désélectionner" : "Tout sélectionner"} relationship="label">
          <Checkbox
            checked={allChecked ? true : someChecked ? "mixed" : false}
            onChange={(_, d) => { if (d.checked) actions.onSelectAll(); else actions.onDeselectAll(); }}
            disabled={allIds.length === 0 || actions.isBusy}
            aria-label="Tout sélectionner"
          />
        </Tooltip>
      )}

      {/* ── Contextual actions (visible when items are selected) ── */}
      {actions && selCount > 0 && (
        <>
          {/* Selection count */}
          <Text className={styles.selectionCount}>{selCount} sélectionné{selCount > 1 ? "s" : ""}</Text>

          <div className={styles.separator} />

          {/* Delete */}
          <Tooltip content={`Supprimer ${selCount} élément${selCount > 1 ? "s" : ""}`} relationship="label">
            <Button
              appearance="subtle" size="small"
              icon={actions.isDeleting ? <Spinner size="tiny" /> : <Delete20Regular />}
              style={{ color: tokens.colorPaletteRedForeground1 }}
              disabled={actions.isDeleting || actions.isBusy}
              onClick={actions.onDelete}
            />
          </Tooltip>

          {/* Rename — only for a single selection */}
          {selCount === 1 && (
            <Button
              appearance="subtle" size="small"
              icon={<Rename20Regular />}
              disabled={actions.isBusy}
              onClick={actions.onRenameFromToolbar}
            >
              Renommer
            </Button>
          )}

          {/* Copy */}
          <Button
            appearance="subtle" size="small"
            icon={<Copy20Regular />}
            disabled={actions.isBusy}
            onClick={actions.onCopy}
          >
            Copier
          </Button>

          {/* Move */}
          <Button
            appearance="subtle" size="small"
            icon={<ArrowMove20Regular />}
            disabled={actions.isBusy}
            onClick={actions.onMove}
          >
            Déplacer
          </Button>

          <div className={styles.separator} />
        </>
      )}

      {/* ── Always-visible actions ── */}

      {/* New folder */}
      {actions && (
        <Button
          appearance="subtle" size="small"
          icon={<FolderAdd20Regular />}
          disabled={actions.isBusy || !driveId}
          onClick={actions.onNewFolder}
        >
          Nouveau dossier
        </Button>
      )}

      {/* Upload */}
      <Tooltip content="Importer des fichiers" relationship="label">
        <Button
          appearance="primary" size="small"
          icon={<ArrowUpload20Regular />}
          onClick={() => fileInputRef.current?.click()}
          disabled={!driveId}
        >
          Importer
        </Button>
      </Tooltip>

      <div className={styles.separator} />

      {/* Refresh */}
      <Tooltip content="Actualiser" relationship="label">
        <Button
          appearance="subtle" size="small"
          icon={<ArrowClockwise20Regular />}
          onClick={handleRefresh}
          disabled={!driveId}
        />
      </Tooltip>

      {/* Pin — admin only */}
      {showPinButton && (
        <>
          <div className={styles.separator} />
          <Tooltip content="Épingler ce dossier et l'assigner à des utilisateurs" relationship="label">
            <Button
              appearance="subtle" size="small"
              icon={<Pin20Regular />}
              onClick={() => setPinDialogOpen(true)}
            >
              Épingler…
            </Button>
          </Tooltip>
        </>
      )}

      {/* Upload status */}
      {uploadMutation.isPending && (
        <><Spinner size="tiny" /><Text className={styles.statusText}>Importation…</Text></>
      )}
      {uploadMutation.isSuccess && (
        <Text className={styles.statusText} style={{ color: tokens.colorPaletteGreenForeground1 }}>✓ Importé</Text>
      )}
      {uploadMutation.isError && (
        <Text className={styles.statusText} style={{ color: tokens.colorPaletteRedForeground1 }}>Échec — vérifiez les permissions</Text>
      )}

      {showPinButton && pinDialogOpen && (
        <AssignPinDialog
          mode="create" open={pinDialogOpen}
          driveId={driveId!} itemId={currentItemId!}
          defaultLabel={defaultPinLabel}
          onClose={() => setPinDialogOpen(false)}
        />
      )}
    </div>
  );
}
