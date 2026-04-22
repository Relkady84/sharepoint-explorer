import { useState, useRef, type ReactNode } from "react";
import { makeStyles, tokens, Text } from "@fluentui/react-components";
import { ArrowUpload24Regular } from "@fluentui/react-icons";
import { useUpload } from "../../hooks/useUpload";
import { useNavigationStore } from "../../store/navigationStore";

const useStyles = makeStyles({
  zone: {
    position: "relative",
    height: "100%",
    minHeight: "200px",
  },
  dragOverlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    backgroundColor: tokens.colorBrandBackground2,
    border: `2px dashed ${tokens.colorBrandStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    zIndex: 10,
    pointerEvents: "none",
  },
  uploadIcon: {
    fontSize: "48px",
    color: tokens.colorBrandForeground1,
  },
  dragText: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
  },
});

interface UploadZoneProps {
  children: ReactNode;
}

export function UploadZone({ children }: UploadZoneProps) {
  const styles = useStyles();
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const { driveId, currentItemId, siteId } = useNavigationStore();
  const uploadMutation = useUpload();

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    if (dragCounter.current === 1) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);

    if (!driveId || !siteId) return;

    const files = Array.from(e.dataTransfer.files);
    files.forEach((file) => {
      uploadMutation.mutate({
        driveId,
        parentItemId: currentItemId ?? "root",
        siteId,
        file,
      });
    });
  };

  return (
    <div
      className={styles.zone}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className={styles.dragOverlay}>
          <ArrowUpload24Regular className={styles.uploadIcon} />
          <Text className={styles.dragText}>Drop files to upload</Text>
        </div>
      )}
      {children}
    </div>
  );
}
