/* ==========================================================================
   Single source of truth for tuition time slots.

   Every tutor post offers up to 7 daily slots. Durations are a mix of
   1 hour / 1.5 hours / 2 hours. The same subject can be posted with a
   completely different set of slots; slot ids are stable strings so bookings
   and old posts stay valid if labels are ever edited.
   ========================================================================== */

export type TuitionSlot = {
  id: string;
  label: string;
  start: string;
  end: string;
  duration: string;
  durationHours: number;
};

export const TUITION_SLOTS: readonly TuitionSlot[] = [
  { id: "slot-1", label: "Morning I", start: "08:00", end: "09:00", duration: "1 hour", durationHours: 1 },
  { id: "slot-2", label: "Morning II", start: "09:00", end: "10:30", duration: "1.5 hours", durationHours: 1.5 },
  { id: "slot-3", label: "Late Morning", start: "10:30", end: "12:30", duration: "2 hours", durationHours: 2 },
  { id: "slot-4", label: "Afternoon I", start: "14:00", end: "15:00", duration: "1 hour", durationHours: 1 },
  { id: "slot-5", label: "Afternoon II", start: "15:00", end: "16:30", duration: "1.5 hours", durationHours: 1.5 },
  { id: "slot-6", label: "Evening I", start: "16:30", end: "18:30", duration: "2 hours", durationHours: 2 },
  { id: "slot-7", label: "Evening II", start: "19:00", end: "20:00", duration: "1 hour", durationHours: 1 },
] as const;

export const ALL_SLOT_IDS: readonly string[] = TUITION_SLOTS.map((slot) => slot.id);

export function isSlotId(value: unknown): value is string {
  return typeof value === "string" && ALL_SLOT_IDS.includes(value);
}

export function getSlot(id: string): TuitionSlot | undefined {
  return TUITION_SLOTS.find((slot) => slot.id === id);
}

export function slotLabel(id: string): string {
  const slot = getSlot(id);
  return slot
    ? `${slot.start}–${slot.end} (${slot.duration})`
    : id;
}

export function slotsByIds(ids: readonly string[]): TuitionSlot[] {
  return TUITION_SLOTS.filter((slot) => ids.includes(slot.id));
}

/**
 * Validates a stored/posted slot list. Legacy posts without a slot list are
 * treated as offering all 7 slots so nothing breaks for existing tutors.
 */
export function normalizeSlots(value: unknown): string[] {
  if (!Array.isArray(value)) return [...ALL_SLOT_IDS];
  const valid = value.filter(isSlotId);
  return valid.length > 0 ? Array.from(new Set(valid)) : [...ALL_SLOT_IDS];
}
