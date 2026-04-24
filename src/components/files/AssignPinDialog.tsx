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
  Field,
  Text,
  tokens,
  makeStyles,
  Spinner,
  Switch,
} from "@fluentui/react-components";
import { useAppPins, type AppPin } from "../../hooks/useAppPins";
import { PeoplePicker } from "./PeoplePicker";

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
    lineHeight: "1.6",
  },
  everyoneRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 12px",
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  everyoneLabel: {
    flex: 1,
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
  },
  everyoneHint: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
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
type Props = (CreateProps | EditProps) & { open: boolean; onClose: () => void };

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseEmails(raw: string): string[] {
  if (!raw) return [];
  const lower = raw.trim().toLowerCase();
  if (lower === "everyone" || lower === "*" || lower === "all") return [];
  return raw.split(/[,;\n]/).map((s) => s.trim().toLowerCase()).filter(Boolean);
}

function describeError(msg: string): string {
  if (msg.includes("400") || msg.toLowerCase().includes("bad request")) {
    return (
      "Erreur 400 — Le serveur a rejeté la requête. Cause la plus probable : " +
      "la colonne « AssignedTo » (Plusieurs lignes de texte) n'existe pas encore " +
      "dans votre liste AppPins sur SharePoint. Ajoutez-la puis réessayez."
    );
  }
  if (msg.includes("403") || msg.toLowerCase().includes("forbidden") || msg.includes("401")) {
    return (
      "Accès refusé (403). Vérifiez que vous êtes bien propriétaire du site SharePoint " +
      "et que la liste AppPins vous autorise à écrire."
    );
  }
  if (msg.includes("introuvable") || msg.includes("not found")) {
    return msg;
  }
  return `Erreur inattendue : ${msg}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AssignPinDialog(props: Props) {
  const { open, onClose } = props;
  const styles = useStyles();
  const isEditing = props.mode === "edit";

  const initialEmails = isEditing ? parseEmails(props.existingPin.assignedTo) : [];
  const initialLabel = isEditing ? props.existingPin.label : props.defaultLabel;
  const initialEveryone = isEditing
    ? parseEmails(props.existingPin.assignedTo).length === 0
    : true;

  const [label, setLabel] = useState(initialLabel);
  const [selectedEmails, setSelectedEmails] = useState<string[]>(initialEmails);
  const [everyone, setEveryone] = useState(initialEveryone);
  const [errorMsg, setErrorMsg] = useState("");

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setLabel(isEditing ? props.existingPin.label : props.defaultLabel);
      const emails = isEditing ? parseEmails(props.existingPin.assignedTo) : [];
      setSelectedEmails(emails);
      setEveryone(emails.length === 0);
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
    if (!everyone && selectedEmails.length === 0) {
      setErrorMsg("Ajoutez au moins un utilisateur, ou activez « Visible par tout le monde ».");
      return;
    }

    const assignedTo = everyone ? "" : selectedEmails.join("\n");

    try {
      if (isEditing) {
        await update.mutateAsync({ ...props.existingPin, label: label.trim(), assignedTo });
      } else {
        await create.mutateAsync({
          label: label.trim(),
          driveId: props.driveId,
          itemId: props.itemId,
          assignedTo,
        });
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(describeError(msg));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, d) => { if (!d.open) onClose(); }}>
      <DialogSurface style={{ maxWidth: 520 }}>
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

              {/* Everyone toggle */}
              <div className={styles.everyoneRow}>
                <div>
                  <Text className={styles.everyoneLabel}>Visible par tout le monde</Text>
                  <br />
                  <Text className={styles.everyoneHint}>
                    Tous les utilisateurs connectés verront ce dossier
                  </Text>
                </div>
                <Switch
                  checked={everyone}
                  onChange={(_, d) => setEveryone(d.checked)}
                  disabled={isPending}
                />
              </div>

              {/* People picker — only shown when not "everyone" */}
              {!everyone && (
                <Field label="Attribuer à des utilisateurs spécifiques">
                  <PeoplePicker
                    selected={selectedEmails}
                    onChange={setSelectedEmails}
                    disabled={isPending}
                  />
                  <Text className={styles.hint}>
                    Tapez un nom pour rechercher dans votre organisation.
                  </Text>
                </Field>
              )}

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
