import {
  Dropdown,
  Option,
  Spinner,
  Text,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { Globe24Regular } from "@fluentui/react-icons";
import { useSites } from "../../hooks/useSites";
import { useNavigationStore } from "../../store/navigationStore";
import { getSiteDrive } from "../../api/sitesApi";
import { useAuth } from "../../auth/useAuth";

const useStyles = makeStyles({
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "12px 16px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  label: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  dropdown: {
    width: "100%",
  },
});

export function SiteSelector() {
  const styles = useStyles();
  const { data: sites, isLoading, isError } = useSites();
  const { setSite } = useNavigationStore();
  const { getToken } = useAuth();

  const handleSelect = async (_: unknown, data: { optionValue?: string; optionText?: string }) => {
    if (!data.optionValue) return;
    const [siteId, siteName] = data.optionValue.split("|||");
    try {
      const token = await getToken();
      const drive = await getSiteDrive(token, siteId);
      setSite(siteId, siteName, drive.id);
    } catch (err) {
      console.error("Failed to load site drive:", err);
    }
  };

  return (
    <div className={styles.wrapper}>
      <Text className={styles.label}>
        <Globe24Regular fontSize={14} />
        SharePoint Site
      </Text>
      {isLoading ? (
        <Spinner size="tiny" label="Loading sites..." />
      ) : isError ? (
        <Text size={200} style={{ color: tokens.colorPaletteRedForeground1 }}>
          Failed to load sites
        </Text>
      ) : (
        <Dropdown
          className={styles.dropdown}
          placeholder="Select a site..."
          onOptionSelect={handleSelect}
        >
          {(sites ?? []).map((site) => (
            <Option
              key={site.id}
              value={`${site.id}|||${site.displayName}`}
            >
              {site.displayName}
            </Option>
          ))}
        </Dropdown>
      )}
    </div>
  );
}
