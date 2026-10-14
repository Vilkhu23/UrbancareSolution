// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
//
// ==============================================================================
// UrbanCare Solution (PindCare) - SMS & WhatsApp Webhook Hook (STUB)
// Status: DISABLED / NOT DEPLOYED
// Purpose: Ingest incoming delivery receipts, inbound SMS verification callbacks,
//          and WhatsApp conversational events from MSG91 / Gupshup gateways.
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // NOTE: This is an empty stub. Real SMS/WhatsApp integration is currently disabled.
  // When active, verify the provider webhook signature (e.g., MSG91/Gupshup webhook secret)
  // before processing delivery receipts or status updates.

  return new Response(
    JSON.stringify({
      status: "inactive",
      message: "SMS / WhatsApp webhook stub. Gateway provisioning is disabled (VITE_OTP_ENABLED=false).",
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
