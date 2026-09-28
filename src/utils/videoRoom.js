// src/utils/videoRoom.js

export const JITSI_DOMAIN = "meet.jit.si";

/**
 * Generates a unique, consistent room name for a given appointment,
 * so both doctor and patient join the same room.
 */
export function roomNameForPatient(appointmentId) {
  if (!appointmentId) return "swasth-setu-default-room";
  return `swasth-setu-appointment-${appointmentId}`;
}

/**
 * Builds the full Jitsi meeting URL for a given appointment.
 */
export function getJitsiMeetingUrl(appointmentId) {
  const room = roomNameForPatient(appointmentId);
  return `https://${JITSI_DOMAIN}/${room}`;
}