import { useState, useEffect } from "react";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { Spinner, makeStyles, tokens, Text } from "@fluentui/react-components";
import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

const useStyles = makeStyles({
  loading: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    height: "100vh",
    backgroundColor: tokens.colorNeutralBackground2,
  },
});

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const styles = useStyles();
  const isAuthenticated = useIsAuthenticated();
  const { inProgress } = useMsal();

  // Wait for MSAL to fully settle before making any auth decision.
  // Without this, React renders before MSAL finishes processing the
  // redirect callback — causing a false "not authenticated" flash.
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (inProgress === InteractionStatus.None) {
      // Give React one extra tick to sync MSAL account state
      const timer = setTimeout(() => setSettled(true), 200);
      return () => clearTimeout(timer);
    } else {
      // MSAL is still working (Startup, HandleRedirect, Login...)
      setSettled(false);
    }
  }, [inProgress]);

  // Show spinner while MSAL is processing OR settling
  if (!settled) {
    return (
      <div className={styles.loading}>
        <Spinner size="large" />
        <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
          {inProgress === InteractionStatus.HandleRedirect
            ? "Completing sign-in..."
            : inProgress === InteractionStatus.Startup
            ? "Starting..."
            : "Loading..."}
        </Text>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
