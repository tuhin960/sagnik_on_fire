// FILE: src/utils/intakeApi.js
//
// Calls the backend's /api/intake route. The Gemini key stays on the
// server; the browser only ever sends the patient's text.

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export async function summarizeIntake(firebaseUser, text) {
  const token = await firebaseUser.getIdToken();
  const res = await fetch(`${API_BASE}/api/intake`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Couldn't prepare the summary.");
  }
  return res.json(); // { language, summary, hasRedFlags }
}