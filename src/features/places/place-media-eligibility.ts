/**
 * YouTube / place reels are only for leisure stops along the route —
 * never for home, work, or charge anchors.
 */

const HOME_WORK_NAME_RE =
  /\b(home|house|apartment|condo|work|office|workplace|дом|квартира|работа|офис)\b/i;

export function isAlongRoutePlaceStop(stop: {
  name: string;
  kind: string;
  role: string;
}): boolean {
  if (stop.kind === "charge" || stop.role === "charge") {
    return false;
  }
  if (stop.kind === "anchor") {
    return false;
  }
  if (HOME_WORK_NAME_RE.test(stop.name.trim())) {
    return false;
  }
  return true;
}
