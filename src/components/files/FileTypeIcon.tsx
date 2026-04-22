import {
  DocumentRegular,
  FolderRegular,
  ImageRegular,
  VideoRegular,
  MusicNote2Regular,
  ArchiveRegular,
  CodeRegular,
  DocumentTextRegular,
  TableRegular,
  SlideTextRegular,
  DocumentPdfRegular,
} from "@fluentui/react-icons";
import { getFileCategory } from "../../utils/fileIcons";
import type { DriveItem } from "../../types/graph";

interface FileTypeIconProps {
  item: DriveItem;
  size?: 16 | 20 | 24 | 28 | 32 | 48;
}

const iconStyle = (color: string, size: number) => ({
  color,
  fontSize: size,
  flexShrink: 0,
});

const CATEGORY_CONFIG = {
  folder:     { color: "#FFB900", Icon: FolderRegular },
  word:       { color: "#185ABD", Icon: DocumentRegular },
  excel:      { color: "#107C41", Icon: TableRegular },
  powerpoint: { color: "#C43E1C", Icon: SlideTextRegular },
  pdf:        { color: "#C50F1F", Icon: DocumentPdfRegular },
  image:      { color: "#8764B8", Icon: ImageRegular },
  video:      { color: "#00B7C3", Icon: VideoRegular },
  audio:      { color: "#498205", Icon: MusicNote2Regular },
  archive:    { color: "#8A8886", Icon: ArchiveRegular },
  code:       { color: "#0078D4", Icon: CodeRegular },
  text:       { color: "#605E5C", Icon: DocumentTextRegular },
  generic:    { color: "#0078D4", Icon: DocumentRegular },
};

export function FileTypeIcon({ item, size = 20 }: FileTypeIconProps) {
  const category = getFileCategory(item.name, !!item.folder);
  const { color, Icon } = CATEGORY_CONFIG[category];

  return <Icon style={iconStyle(color, size)} />;
}
