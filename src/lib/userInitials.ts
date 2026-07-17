function isLatinLetter(character: string): boolean {
  return /^[A-Za-z]$/.test(character);
}

export function getUserInitials(fullname: string): string {
  const parts = fullname.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    const part = parts[0];
    return part.length >= 2 ? part.slice(0, 2) : part;
  }

  const firstInitial = parts[0].charAt(0);
  const lastInitial = parts[parts.length - 1].charAt(0);
  const initials = `${firstInitial}${lastInitial}`;

  if (isLatinLetter(firstInitial) && isLatinLetter(lastInitial)) {
    return initials.toUpperCase();
  }

  return initials;
}
