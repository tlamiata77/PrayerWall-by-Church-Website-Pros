import { Church } from '../types';

export interface ThemeStyles {
  primary: string;
  accent: string;
  primaryBg: string;
  primaryHoverBg: string;
  primaryText: string;
  primaryBorder: string;
  primaryLightBg: string;
  accentBg: string;
  accentHoverBg: string;
  accentText: string;
  accentBorder: string;
  accentLightBg: string;
  btnPrimaryStyle: React.CSSProperties;
  btnAccentStyle: React.CSSProperties;
  badgePrimaryStyle: React.CSSProperties;
  badgeAccentStyle: React.CSSProperties;
  headerGradientStyle: React.CSSProperties;
}

export const PRESET_THEMES = [
  {
    id: 'teal_pink',
    name: 'Teal & Pink (Default)',
    description: 'Fresh #4eb8b9 teal base with vivid #c219b0 pink accent',
    primary: '#4eb8b9',
    accent: '#c219b0',
    tag: 'Default',
  },
  {
    id: 'amber',
    name: 'Warm Amber & Gold',
    description: 'Traditional reverent sanctuary warmth',
    primary: '#d97706',
    accent: '#b45309',
  },
  {
    id: 'emerald',
    name: 'Living Hope Emerald',
    description: 'Growth, life, and restorative peace',
    primary: '#059669',
    accent: '#10b981',
  },
  {
    id: 'indigo',
    name: 'Royal Indigo & Violet',
    description: 'Majestic worship and contemplation',
    primary: '#4f46e5',
    accent: '#7c3aed',
  },
  {
    id: 'rose',
    name: 'Grace Rose & Coral',
    description: 'Compassion, sacrificial love, and grace',
    primary: '#e11d48',
    accent: '#be123c',
  },
  {
    id: 'sky',
    name: 'Heavenly Sky & Sapphire',
    description: 'Clarity, faith, and living waters',
    primary: '#0284c7',
    accent: '#1d4ed8',
  },
  {
    id: 'custom',
    name: 'Custom Church Palette',
    description: 'Pick custom hex colors to match your church brand guide',
    primary: '#4eb8b9',
    accent: '#c219b0',
  },
];

export function getChurchTheme(church?: Church | null): ThemeStyles {
  const themeId = church?.themeColor || 'teal_pink';
  
  let primary = church?.primaryColor || '#4eb8b9';
  let accent = church?.accentColor || '#c219b0';

  if (themeId !== 'custom') {
    const preset = PRESET_THEMES.find((p) => p.id === themeId);
    if (preset) {
      primary = church?.primaryColor || preset.primary;
      accent = church?.accentColor || preset.accent;
    }
  }

  return {
    primary,
    accent,
    primaryBg: `bg-[${primary}]`,
    primaryHoverBg: `hover:opacity-90`,
    primaryText: `text-[${primary}]`,
    primaryBorder: `border-[${primary}]`,
    primaryLightBg: `bg-[${primary}]/10`,
    accentBg: `bg-[${accent}]`,
    accentHoverBg: `hover:opacity-90`,
    accentText: `text-[${accent}]`,
    accentBorder: `border-[${accent}]`,
    accentLightBg: `bg-[${accent}]/10`,
    btnPrimaryStyle: {
      backgroundColor: primary,
      color: '#ffffff',
    },
    btnAccentStyle: {
      backgroundColor: accent,
      color: '#ffffff',
    },
    badgePrimaryStyle: {
      backgroundColor: `${primary}18`,
      color: primary,
      borderColor: `${primary}40`,
    },
    badgeAccentStyle: {
      backgroundColor: `${accent}18`,
      color: accent,
      borderColor: `${accent}40`,
    },
    headerGradientStyle: {
      background: `linear-gradient(135deg, ${primary}12 0%, ${accent}08 100%)`,
    },
  };
}
