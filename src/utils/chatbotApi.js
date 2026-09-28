// FILE: src/utils/chatbotApi.js
//
// Calls the backend's /api/chatbot proxy — never talks to Gemini
// directly, so the API key never reaches the browser.

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export async function askChatbot(firebaseUser, message, history) {
  const token = await firebaseUser.getIdToken();
  const res = await fetch(`${API_BASE}/api/chatbot`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message, history }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Chatbot request failed.");
  }

  const data = await res.json();
  return data.reply;
}