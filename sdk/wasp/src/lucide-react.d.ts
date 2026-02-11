/**
 * Type declarations for lucide-react
 *
 * lucide-react is a library of icons that doesn't ship with TypeScript definitions
 * in the npm package, so we declare the module here to allow TypeScript compilation.
 */

declare module 'lucide-react' {
  import { ComponentType, SVGProps } from 'react';

  export interface LucideProps extends Partial<Omit<SVGProps<SVGSVGElement>, 'ref'>> {
    size?: string | number;
    absoluteStrokeWidth?: boolean;
  }

  export type LucideIcon = ComponentType<LucideProps>;

  // Export all the icons as LucideIcon type
  export const Activity: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const AlignLeft: LucideIcon;
  export const Archive: LucideIcon;
  export const ArrowDown: LucideIcon;
  export const ArrowLeft: LucideIcon;
  export const ArrowLeftRight: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const ArrowUp: LucideIcon;
  export const ArrowUpRight: LucideIcon;
  export const BarChart: LucideIcon;
  export const BarChart2: LucideIcon;
  export const BarChart3: LucideIcon;
  export const Bell: LucideIcon;
  export const Calendar: LucideIcon;
  export const Check: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const CheckSquare: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ChevronLeft: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const ChevronUp: LucideIcon;
  export const Circle: LucideIcon;
  export const Clock: LucideIcon;
  export const Copy: LucideIcon;
  export const CreditCard: LucideIcon;
  export const Crown: LucideIcon;
  export const Database: LucideIcon;
  export const DollarSign: LucideIcon;
  export const Download: LucideIcon;
  export const Edit: LucideIcon;
  export const Edit2: LucideIcon;
  export const Edit3: LucideIcon;
  export const Ellipsis: LucideIcon;
  export const ExternalLink: LucideIcon;
  export const Eye: LucideIcon;
  export const EyeOff: LucideIcon;
  export const FileText: LucideIcon;
  export const Filter: LucideIcon;
  export const Heart: LucideIcon;
  export const HelpCircle: LucideIcon;
  export const Home: LucideIcon;
  export const Info: LucideIcon;
  export const Key: LucideIcon;
  export const Layers: LucideIcon;
  export const LayoutDashboard: LucideIcon;
  export const Link2: LucideIcon;
  export const Loader: LucideIcon;
  export const Loader2: LucideIcon;
  export const Lock: LucideIcon;
  export const LogIn: LucideIcon;
  export const LogOut: LucideIcon;
  export const Mail: LucideIcon;
  export const Menu: LucideIcon;
  export const MessageCircleMore: LucideIcon;
  export const MessageSquare: LucideIcon;
  export const Moon: LucideIcon;
  export const MoreHorizontal: LucideIcon;
  export const MoreVertical: LucideIcon;
  export const Package: LucideIcon;
  export const Pause: LucideIcon;
  export const PauseCircle: LucideIcon;
  export const Play: LucideIcon;
  export const PlayCircle: LucideIcon;
  export const Plus: LucideIcon;
  export const PlusCircle: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const Save: LucideIcon;
  export const Search: LucideIcon;
  export const Send: LucideIcon;
  export const Server: LucideIcon;
  export const Settings: LucideIcon;
  export const Settings2: LucideIcon;
  export const Sheet: LucideIcon;
  export const Shield: LucideIcon;
  export const ShoppingBag: LucideIcon;
  export const ShoppingCart: LucideIcon;
  export const Sparkles: LucideIcon;
  export const SquarePen: LucideIcon;
  export const Star: LucideIcon;
  export const Sun: LucideIcon;
  export const Table: LucideIcon;
  export const Trash: LucideIcon;
  export const Trash2: LucideIcon;
  export const TrendingDown: LucideIcon;
  export const TrendingUp: LucideIcon;
  export const Unplug: LucideIcon;
  export const Upload: LucideIcon;
  export const User: LucideIcon;
  export const UserIcon: LucideIcon;
  export const UserCheck: LucideIcon;
  export const UserCog: LucideIcon;
  export const UserPlus: LucideIcon;
  export const Users: LucideIcon;
  export const UsersRound: LucideIcon;
  export const UserX: LucideIcon;
  export const X: LucideIcon;
  export const XCircle: LucideIcon;
  export const Zap: LucideIcon;

  // Add more icons as needed - this is a subset of all available icons
  // For a complete list, see: https://lucide.dev/icons/
}
