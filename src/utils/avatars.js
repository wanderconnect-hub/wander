export const DEFAULT_AVATARS = {
  Male: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23E0F2FE" stroke="%230284C7" stroke-width="2"/><rect x="45" y="52" width="10" height="10" fill="%23FDBA74" /><path d="M25 80 C25 68 35 62 50 62 C65 62 75 68 75 80 L75 85 H25 Z" fill="%230284C7" /><polygon points="45,62 55,62 50,70" fill="%23FDBA74" /><circle cx="50" cy="38" r="16" fill="%23FDBA74" /><circle cx="33" cy="38" r="4" fill="%23FDBA74" /><circle cx="67" cy="38" r="4" fill="%23FDBA74" /><path d="M32 38 C32 22 68 22 68 38 C62 30 38 30 32 38 Z" fill="%231E293B" /><path d="M34 30 L38 24 L44 28 L50 22 L56 28 L62 24 L66 30 Z" fill="%231E293B" /></svg>`,
  Female: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23FCE7F3" stroke="%23DB2777" stroke-width="2"/><path d="M30 38 C30 20 70 20 70 38 C70 55 66 65 66 65 H34 C34 65 30 55 30 38 Z" fill="%23475569" /><rect x="45" y="52" width="10" height="10" fill="%23FDBA74" /><path d="M25 80 C25 68 35 62 50 62 C65 62 75 68 75 80 L75 85 H25 Z" fill="%23DB2777" /><polygon points="45,62 55,62 50,70" fill="%23FDBA74" /><circle cx="50" cy="38" r="15" fill="%23FDBA74" /><path d="M33 34 C33 24 67 24 67 34 C60 28 40 28 33 34 Z" fill="%23475569" /><path d="M33 34 C35 38 42 36 45 32 C48 36 55 38 67 34 Z" fill="%23475569" /></svg>`,
  "Non-binary": `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23F3E8FF" stroke="%237C3AED" stroke-width="2"/><rect x="45" y="52" width="10" height="10" fill="%23FDBA74" /><path d="M25 80 C25 68 35 62 50 62 C65 62 75 68 75 80 L75 85 H25 Z" fill="%237C3AED" /><polygon points="45,62 55,62 50,70" fill="%23FDBA74" /><circle cx="50" cy="38" r="15.5" fill="%23FDBA74" /><path d="M33 34 C33 22 67 22 67 34 C63 28 37 28 33 34 Z" fill="%231E293B" /></svg>`,
  Other: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23F3E8FF" stroke="%237C3AED" stroke-width="2"/><rect x="45" y="52" width="10" height="10" fill="%23FDBA74" /><path d="M25 80 C25 68 35 62 50 62 C65 62 75 68 75 80 L75 85 H25 Z" fill="%237C3AED" /><polygon points="45,62 55,62 50,70" fill="%23FDBA74" /><circle cx="50" cy="38" r="15.5" fill="%23FDBA74" /><path d="M33 34 C33 22 67 22 67 34 C63 28 37 28 33 34 Z" fill="%231E293B" /></svg>`
};

export const getFallbackAvatar = (gender, currentAvatar) => {
  if (!currentAvatar || 
      (typeof currentAvatar === 'string' && currentAvatar.includes('photo-1535713875002-d1d0cf377fde'))) {
    return DEFAULT_AVATARS[gender] || DEFAULT_AVATARS.Male;
  }
  return currentAvatar;
};
