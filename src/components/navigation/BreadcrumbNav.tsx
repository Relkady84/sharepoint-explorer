import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbButton,
  BreadcrumbDivider,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { Home20Regular } from "@fluentui/react-icons";
import { useNavigationStore } from "../../store/navigationStore";

const useStyles = makeStyles({
  root: {
    padding: "8px 16px",
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    minHeight: "40px",
    display: "flex",
    alignItems: "center",
  },
});

export function BreadcrumbNav() {
  const styles = useStyles();
  const { siteName, breadcrumbs, navigateToRoot, navigateToBreadcrumb } =
    useNavigationStore();

  if (!siteName) return null;

  return (
    <div className={styles.root}>
      <Breadcrumb aria-label="File path">
        <BreadcrumbItem>
          <BreadcrumbButton
            icon={<Home20Regular />}
            onClick={navigateToRoot}
            current={breadcrumbs.length === 0}
          >
            {siteName}
          </BreadcrumbButton>
        </BreadcrumbItem>

        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <div
              key={crumb.id}
              style={{ display: "flex", alignItems: "center" }}
            >
              <BreadcrumbDivider />
              <BreadcrumbItem>
                <BreadcrumbButton
                  current={isLast}
                  onClick={() => {
                    if (!isLast) navigateToBreadcrumb(index);
                  }}
                >
                  {crumb.name}
                </BreadcrumbButton>
              </BreadcrumbItem>
            </div>
          );
        })}
      </Breadcrumb>
    </div>
  );
}
