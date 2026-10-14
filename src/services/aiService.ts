/**
 * AI Service Client Module (DISABLED)
 * 
 * TODO: Server Proxy Architecture Required
 * Direct Gemini AI calls from the browser are disabled for security reasons to prevent
 * exposing API keys in client-side bundles. Any future AI-assisted dispatch, diagnostic,
 * or chat features must be routed through a secure backend server endpoint / proxy.
 */

export const requestAIAssistance = async (): Promise<never> => {
  // TODO: Implement server-side proxy route (e.g., /api/ai/dispatch-assist) before enabling AI features.
  throw new Error('AI operations from client browser are disabled. A secure backend proxy is required.');
};
