import { makeStyles, tokens, Button } from "@fluentui/react-components";
import {
  GlobeRegular,
  MailRegular,
  NotebookRegular,
} from "@fluentui/react-icons";

interface Link {
  label: string;
  href: string;
  icon: JSX.Element;
  /** When set, open in a sized popup window instead of a new tab. */
  popup?: { width: number; height: number };
}

const LINKS: Link[] = [
  {
    label: "Site du lycée",
    href: "https://www.lycee-montaigne.edu.lb",
    icon: <GlobeRegular />,
  },
  {
    label: "Outlook",
    href: "https://outlook.office.com/mail/",
    icon: <MailRegular />,
  },
  {
    label: "Mes notes",
    href: "https://www.onenote.com/notebooks",
    icon: <NotebookRegular />,
    popup: { width: 1100, height: 750 },
  },
];

/**
 * Open a URL in a sized popup window centered on the current screen.
 * On mobile (Capacitor), this same call should be swapped for
 * `Browser.open({ url })` to use the native in-app browser sheet.
 */
function openInPopup(url: string, width: number, height: number) {
  const dx = window.screenX ?? 0;
  const dy = window.screenY ?? 0;
  const dw = window.outerWidth || document.documentElement.clientWidth;
  const dh = window.outerHeight || document.documentElement.clientHeight;
  const left = Math.max(0, Math.round(dx + (dw - width) / 2));
  const top = Math.max(0, Math.round(dy + (dh - height) / 2));
  const features = [
    "popup=yes",
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
    "noopener",
    "noreferrer",
  ].join(",");
  const win = window.open(url, "_blank", features);
  // If popup was blocked, fall back to a normal tab so the user still gets there.
  if (!win) {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    padding: "8px",
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    flexShrink: 0,
  },
  link: {
    justifyContent: "flex-start",
    width: "100%",
  },
});

export function QuickLinks() {
  const styles = useStyles();
  return (
    <nav className={styles.root} aria-label="Liens rapides">
      {LINKS.map((l) => (
        <Button
          key={l.href}
          appearance="subtle"
          size="small"
          icon={l.icon}
          className={styles.link}
          onClick={() => {
            if (l.popup) {
              openInPopup(l.href, l.popup.width, l.popup.height);
            } else {
              window.open(l.href, "_blank", "noopener,noreferrer");
            }
          }}
        >
          {l.label}
        </Button>
      ))}
    </nav>
  );
}
