'use client';

import {
  Shirt,
  User,
  CircleUserRound,
  Baby,
  WashingMachine,
  Wind,
  PlusCircle,
  type LucideIcon,
} from 'lucide-react';
import { getApiOrigin } from '@/lib/api';

/** Map stored preset icon value (e.g. from API) to Lucide icon. */
export const ICON_MAP: Record<string, LucideIcon> = {
  'tshirt-crew': Shirt,
  'human-male': User,
  'human-female': CircleUserRound,
  hoodie: Shirt,
  'coat-rack': Shirt,
  'human-child': Baby,
  'washing-machine': WashingMachine,
  'tumble-dryer': Wind,
  'plus-circle': PlusCircle,
};

const DEFAULT_ICON = Shirt;

/** True if icon is a preset key (not a custom URL). */
export function isPresetIcon(icon: string | null | undefined): boolean {
  if (!icon) return false;
  return icon in ICON_MAP && !icon.startsWith('/') && !icon.startsWith('http');
}

interface CatalogItemIconProps {
  /** Icon: preset key (e.g. "tshirt-crew") or custom image URL. */
  icon?: string | null;
  size?: number;
  className?: string;
}

export function CatalogItemIcon({ icon, size = 22, className }: CatalogItemIconProps) {
  if (!icon) {
    const IconComponent = DEFAULT_ICON;
    return <IconComponent size={size} className={className} />;
  }
  if (icon.startsWith('/') || icon.startsWith('http')) {
    const src = icon.startsWith('http') ? icon : `${getApiOrigin()}${icon}`;
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className={className}
        style={{ width: size, height: size, objectFit: 'contain' }}
      />
    );
  }
  const IconComponent = ICON_MAP[icon] ?? DEFAULT_ICON;
  return <IconComponent size={size} className={className} />;
}
