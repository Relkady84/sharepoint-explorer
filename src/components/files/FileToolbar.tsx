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
  CheckmarkCircle20Regular,
} from "@fluentui/react-icons";
import { useUpload } from "../../hooks/useUpload";
import { useNavigationStore } from "../../store/navigationStore";
import { useQueryClient } from "@tanstack/react-query";
import { addPinnedFolder } from "../../hooks/useDepartments";

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
  pinConfirm: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorPaletteGreenForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
});

export function FileToolbar() {
  const styles = useStyles();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { driveId, currentItemId, siteId, breadcrumbs, activeView } = useNavigationStore();
  const uploadMutation = useUpload();
  const queryClient = useQueryClient();
  const [pinned, setPinned] = useState(false);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

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

  const handlePin = () => {
    if (!driveId || !currentItemId) return;
    // Build a readable label from breadcrumbs (last segment = current folder name)
    const label = breadcrumbs.length > 0
      ? breadcrumbs.map((b) => b.name).join(" › ")
      : "Dossier épinglé";
    addPinnedFolder(driveId, currentItemId, label);
    setPinned(true);
    setTimeout(() => setPinned(false), 3000);
  };

  // Only show the Pin button when in Explorer and inside a folder
  const showPinButton = activeView === "explorer" && !!currentItemId && !!driveId;

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

      {/* Pin button — only shown when browsing a subfolder in Explorer */}
      {showPinButton && (
        <>
          <div className={styles.separator} />
          <Tooltip
            content="Épingler ce dossier comme racine des Départements"
            relationship="label"
          >
            <Button
              appearance="subtle"
              size="small"
              icon={<Pin20Regular />}
              onClick={handlePin}
            >
              Épingler comme Départements
            </Button>
          </Tooltip>
        </>
      )}

      {/* Pin confirmation */}
      {pinned && (
        <span className={styles.pinConfirm}>
          <CheckmarkCircle20Regular />
          Dossier épinglé ! Allez dans l'onglet Départements.
        </span>
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
    </div>
  );
}
