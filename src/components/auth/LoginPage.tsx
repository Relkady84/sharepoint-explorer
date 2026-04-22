import {
  makeStyles,
  tokens,
  Button,
  Text,
} from "@fluentui/react-components";
import { useAuth } from "../../auth/useAuth";

const useStyles = makeStyles({
  root: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    backgroundColor: tokens.colorNeutralBackground2,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "24px",
    padding: "48px 56px",
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusXLarge,
    boxShadow: tokens.shadow28,
    maxWidth: "420px",
    width: "100%",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logoImg: {
    width: "40px",
    height: "40px",
  },
  title: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  subtitle: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground3,
    textAlign: "center",
    lineHeight: tokens.lineHeightBase400,
  },
  divider: {
    width: "100%",
    height: "1px",
    backgroundColor: tokens.colorNeutralStroke2,
  },
  signInButton: {
    width: "100%",
    height: "44px",
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
  },
  footer: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground4,
    textAlign: "center",
  },
});

function MicrosoftLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

function SharePointIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="8" fill="#0078D4" />
      <circle cx="17" cy="20" r="8" fill="white" fillOpacity="0.9" />
      <circle cx="17" cy="20" r="5" fill="#0078D4" />
      <rect x="22" y="15" width="12" height="2.5" rx="1.25" fill="white" fillOpacity="0.8" />
      <rect x="22" y="19" width="10" height="2.5" rx="1.25" fill="white" fillOpacity="0.8" />
      <rect x="22" y="23" width="8" height="2.5" rx="1.25" fill="white" fillOpacity="0.8" />
    </svg>
  );
}

export function LoginPage() {
  const styles = useStyles();
  const { login } = useAuth();

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <SharePointIcon />
          <Text className={styles.title}>SharePoint Explorer</Text>
        </div>

        <Text className={styles.subtitle}>
          Browse, upload, and manage your SharePoint files with a clean,
          modern interface built for Microsoft 365.
        </Text>

        <div className={styles.divider} />

        <Button
          className={styles.signInButton}
          appearance="primary"
          size="large"
          icon={<MicrosoftLogo />}
          onClick={login}
        >
          Sign in with Microsoft
        </Button>

        <Text className={styles.footer}>
          By signing in, you agree to your organization's terms of use.
          Your credentials are handled securely by Microsoft.
        </Text>
      </div>
    </div>
  );
}
