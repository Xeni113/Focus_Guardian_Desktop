import {
  Code2,
  BookOpen,
  Youtube,
  MessageSquare,
  Hash,
  Globe,
  FileText,
  Terminal,
  Chrome,
  Gamepad2,
  Mail,
  Music,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  code: Code2,
  book: BookOpen,
  play: Youtube,
  message: MessageSquare,
  hash: Hash,
  globe: Globe,
  file: FileText,
  terminal: Terminal,
  chrome: Chrome,
  game: Gamepad2,
  mail: Mail,
  music: Music,
};

export function AppIcon({ iconKey, size = 18, color }: { iconKey: string; size?: number; color?: string }) {
  const Icon = iconMap[iconKey] ?? Globe;
  return <Icon size={size} style={color ? { color } : undefined} />;
}

export const ICON_OPTIONS = Object.keys(iconMap);
