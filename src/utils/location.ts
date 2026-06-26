interface ExactLocation {
  address?: string;
  name?: string;
  latitude?: number;
  longitude?: number;
}

export const parseExactLocation = (value: string): ExactLocation | null => {
  if (!value.trim()) return null;

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as ExactLocation;
  } catch {
    return null;
  }
};

export const getLocationLabel = (location: string, exactLocation: string) => {
  const exact = parseExactLocation(exactLocation);
  return exact?.name || exact?.address || location || "地点待定";
};
