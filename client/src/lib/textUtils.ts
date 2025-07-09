export function truncateText(text: string, maxLength: number = 30): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function formatTextForMobile(text: string, isMobile: boolean): string {
  if (!isMobile) return text;
  return truncateText(text, 20);
}