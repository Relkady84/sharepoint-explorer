import { makeStyles, tokens, Button } from "@fluentui/react-components";
import {
  GlobeRegular,
  MailRegular,
  NotebookRegular,
} from "@fluentui/react-icons";

const LINKS = [
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
  },
] as const;

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
          onClick={() => window.open(l.href, "_blank", "noopener,noreferrer")}
        >
          {l.label}
        </Button>
      ))}
    </nav>
  );
}
