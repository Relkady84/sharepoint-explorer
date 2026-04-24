import { useState, useEffect } from "react";
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  Input,
  Textarea,
  Field,
  Text,
  tokens,
  makeStyles,
  Spinner,
} from "@fluentui/react-components";
import { useAppPins, type AppPin } from "../../hooks/useAppPins";

const useStyles = makeStyles({
  content: { display: "flex", flexDirection: "column", gap: "16px" },
  hint: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    lineHeight: "1.4",
  },
  error: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: tokens.fontSizeBase200,
    padding: "10px 12px",
    backgroundColor: tokens.colorPaletteRedBackground1,
    borderRadius: tokens.borderRadiusMedium,
    lineHeight: "1.5",
  },
  success: {
    color: tokens.colorPaletteGreenForeground1,
    fontSize: tokens.fontSizeBase200,
    padding: "10px 12px",
    backgroundColor: tokens.colorPaletteGreenBackground1,
    borderRadius: tokens.borderRadiusMedium,
  },
});

// ── Props ─────────────────────────────────────────────────────────────────────

interface CreateProps {
  mode: "create";
  driveId: string;
  itemId: string;
  defaultLabel: string;
}

interface EditProps {
  mode: "edit";
  existingPin: AppPin;
}

type Props = (CreateProps | EditProps) & {
  open: boolean;
  onClose: () => void;
};

// ── Component ─────────────────────────────────────────────────────────────────

export function AssignPinDialog(props: Props) {
  const { open, onClose } = props;
  const styles = useStyles();
  const isEditing = props.mode === "edit";

  const [label, setLabel] = useState(
    isEditing ? props.existingPin.label : props.defaultLabel
  );
  const [assignedTo, setAssignedTo] = useState(
    isEditing ? props.existingPin.assignedTo : ""
  );
  const [errorMsg, setErrorMsg] = useState("");

  // Reset fields when the dialog opens with fresh data
  useEffect(() => {
    if (open) {
      setLabel(isEditing ? props.existingPin.label : props.defaultLabel);
      setAssignedTo(isEditing ? props.existingPin.assignedTo : "");
      setErrorMsg("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const { create, update } = useAppPins();
  const isPending = create.isPending || update.isPending;

  const handleSave = async () => {
    setErrorMsg("");
    if (!label.trim()) {
      setErrorMsg("Le nom affiché est obligatoire.");
      return;
    }

    try {
      if (isEditing) {
        await update.mutateAsync({
          ...props.existingPin,
          label: label.trim(),
          assignedTo: assignedTo.trim(),
        });
      } else {
        await create.mutateAsync({
          label: label.trim(),
          driveId: props.driveId,
          itemId: props.itemId,
          assignedTo: assignedTo.trim(),
        });
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("403") || msg.toLowerCase().includes("forbidden") || msg.includes("401")) {
        setErrorMsg(
          "Accès refusé (403). Vérifiez que vous êtes bien propriétaire du site SharePoint " +
          "et que la liste AppPins vous autorise à écrire."
        );
      } else if (msg.includes("introuvable") || msg.includes("not found")) {
        setErrorMsg(msg);
      } else {
        setErrorMsg(`Erreur inattendue : ${msg}`);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, d) => { if (!d.open) onClose(); }}>
      <DialogSurface style={{ maxWidth: 500 }}>
        <DialogTitle>
          {isEditing ? "✏️ Modifier l'épingle" : "📌 Épingler ce dossier"}
        </DialogTitle>

        <DialogBody>
          <DialogContent>
            <div className={styles.content}>

              {/* Label */}
              <Field label="Nom affiché dans l'application" required>
                <Input
                  value={label}
                  onChange={(_, d) => setLabel(d.value)}
                  placeholder="Ex : Dossiers des Départements"
                  disabled={isPending}
                />
              </Field>

              {/* Assigned to */}
              <Field label="Visible par (emails des utilisateurs)">
                <Textarea
                  value={assignedTo}
                  onChange={(_, d) => setAssignedTo(d.value)}
                  placeholder={
                    "prof.dupont@montaigne.edu.lb\nprof.martin@montaigne.edu.lb\nkarim@montaigne.edu.lb"
                  }
                  rows={4}
                  disabled={isPending}
                />
                <Text className={styles.hint}>
                  Un email par ligne (ou séparés par des virgules).{" "}
                  <strong>Laissez vide</strong> pour rendre ce dossier visible à tous les utilisateurs connectés.
                </Text>
              </Field>

              {/* Error */}
              {errorMsg && <Text className={styles.error}>{errorMsg}</Text>}

            </div>
          </DialogContent>

          <DialogActions>
            <Button appearance="secondary" onClick={onClose} disabled={isPending}>
              Annuler
            </Button>
            <Button
              appearance="primary"
              onClick={handleSave}
              disabled={isPending}
              icon={isPending ? <Spinner size="tiny" /> : undefined}
            >
              {isPending
                ? isEditing ? "Enregistrement…" : "Épinglage…"
                : isEditing ? "Enregistrer" : "Épingler"}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
