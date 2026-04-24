import { useRef, useState } from "react";
import {
  Button,
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
    gap: "8px",
    padding: "10px 16px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    flexWrap: "wrap",
  },
  uploadStatus: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginLeft: "8px",
  },
  statusText: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  separator: {
    width: "1px",
    height: "20px",
    backgroundColor: tokens.colorNeutralStroke2,
    margin: "0 4px",
  },
});

export function FileToolbar() {
  const styles = useStyles();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { driveId, currentItemId, siteId, breadcrumbs, activeView } = useNavigationStore();
  const uploadMutation = useUpload();
  const queryClient = useQueryClient();
  const isAdmin = useIsAdmin();

  const [pinDialogOpen, setPinDialogOpen] = useState(false);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!driveId || !siteId || files.length === 0) return;
    files.forEach((file) => {
      uploadMutation.mutate({
        driveId,
        parentItemId: currentItemId ?? "root",
        siteId,
        file,
      });
    });
    e.target.value = "";
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["driveItems"] });
  };

  // Pin button: only for admins, and only when inside a subfolder in Explorer
  const showPinButton =
    isAdmin && activeView === "explorer" && !!currentItemId && !!driveId;

  const defaultPinLabel =
    breadcrumbs.length > 0
      ? breadcrumbs.map((b) => b.name).join(" › ")
      : "Dossier épinglé";

  return (
    <div className={styles.toolbar}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <Tooltip content="Upload files" relationship="label">
        <Button
          appearance="primary"
          size="small"
          icon={<ArrowUpload20Regular />}
          onClick={handleUploadClick}
          disabled={!driveId}
        >
          Upload
        </Button>
      </Tooltip>

      <div className={styles.separator} />

      <Tooltip content="Refresh" relationship="label">
        <Button
          appearance="subtle"
          size="small"
          icon={<ArrowClockwise20Regular />}
          onClick={handleRefresh}
          disabled={!driveId}
        />
      </Tooltip>

      {/* Pin button — admin only, inside a folder in Explorer */}
      {showPinButton && (
        <>
          <div className={styles.separator} />
          <Tooltip
            content="Épingler ce dossier et l'assigner à des utilisateurs"
            relationship="label"
          >
            <Button
              appearance="subtle"
              size="small"
              icon={<Pin20Regular />}
              onClick={() => setPinDialogOpen(true)}
            >
              Épingler pour des utilisateurs…
            </Button>
          </Tooltip>
        </>
      )}

      {/* Upload status */}
      {uploadMutation.isPending && (
        <div className={styles.uploadStatus}>
          <Spinner size="tiny" />
          <Text className={styles.statusText}>Uploading...</Text>
        </div>
      )}

      {uploadMutation.isSuccess && (
        <Text className={styles.statusText} style={{ color: tokens.colorPaletteGreenForeground1 }}>
          ✓ Upload complete
        </Text>
      )}

      {uploadMutation.isError && (
        <Text className={styles.statusText} style={{ color: tokens.colorPaletteRedForeground1 }}>
          Upload failed — check permissions
        </Text>
      )}

      {/* Assign-pin dialog (admin only) */}
      {showPinButton && pinDialogOpen && (
        <AssignPinDialog
          mode="create"
          open={pinDialogOpen}
          driveId={driveId!}
          itemId={currentItemId!}
          defaultLabel={defaultPinLabel}
          onClose={() => setPinDialogOpen(false)}
        />
      )}
    </div>
  );
}
