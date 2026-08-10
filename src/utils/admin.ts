export interface AdminAccount {
  id: string;
  name: string;
  pin: string;
  role: string;
}

export function parseAdminAccounts(
  adminPinSetting?: string,
  defaultTreasurerName?: string
): AdminAccount[] {
  const fallbackName = defaultTreasurerName || 'Bendahara 1';

  if (!adminPinSetting || adminPinSetting.trim() === '') {
    return [
      {
        id: '1',
        name: fallbackName,
        pin: '262009',
        role: 'Bendahara Utama',
      },
    ];
  }

  try {
    if (adminPinSetting.trim().startsWith('[')) {
      const parsed = JSON.parse(adminPinSetting);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item, idx) => ({
          id: item.id || String(idx + 1),
          name: item.name || `Admin ${idx + 1}`,
          pin: String(item.pin || '').trim(),
          role: item.role || 'Bendahara',
        }));
      }
    }
  } catch (e) {
    // fallback if not valid JSON
  }

  // Legacy format or single PIN string (e.g., "262009")
  return [
    {
      id: '1',
      name: fallbackName,
      pin: adminPinSetting.trim(),
      role: 'Bendahara Utama',
    },
  ];
}

export function serializeAdminAccounts(accounts: AdminAccount[]): string {
  return JSON.stringify(accounts);
}

export function authenticateAdmin(
  accounts: AdminAccount[],
  inputPin: string,
  selectedAdminId?: string
): AdminAccount | null {
  const cleanPin = inputPin.trim();
  if (!cleanPin) return null;

  if (selectedAdminId) {
    const found = accounts.find((acc) => acc.id === selectedAdminId && acc.pin === cleanPin);
    if (found) return found;
  }

  // Direct PIN match lookup across any admin
  const directMatch = accounts.find((acc) => acc.pin === cleanPin);
  if (directMatch) return directMatch;

  return null;
}
