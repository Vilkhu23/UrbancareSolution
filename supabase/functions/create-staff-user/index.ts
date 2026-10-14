// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This is a Supabase Edge Function to securely create staff accounts with the service-role key.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Shared blocked passwords list (identical to src/utils/authValidation.ts)
const BLOCKED_PASSWORDS = new Set([
  "123456",
  "password",
  "12345678",
  "qwerty",
  "123456789",
  "1234567890",
  "admin123",
  "resident123",
  "welcome123",
  "pindcare123",
  "urbancare123",
  // Compromised legacy demo passwords:
  "opslead@2026",
  "techpass@101",
  "malwapass@2026",
]);

serve(async (req: Request) => {
  // SEC-11: Restrict CORS to ALLOWED_ORIGIN or production domain
  const configuredOrigin = Deno.env.get("ALLOWED_ORIGIN") || "https://urbancaresolution.in";
  const requestOrigin = req.headers.get("origin") || "";
  
  // Allow localhost for local development if configured or if origin matches
  const allowOrigin =
    configuredOrigin === "*" ||
    requestOrigin === configuredOrigin ||
    requestOrigin.startsWith("http://localhost:") ||
    requestOrigin.startsWith("http://127.0.0.1:")
      ? requestOrigin || configuredOrigin
      : configuredOrigin;

  const corsHeaders = {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[create-staff-user] Server configuration missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
      return new Response(
        JSON.stringify({ error: "Server configuration error. Please contact the administrator." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Verify caller's JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Missing Authorization header." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Validate the caller's JWT token
    const { data: { user: callerUser }, error: userAuthError } = await supabaseAdmin.auth.getUser(token);
    if (userAuthError || !callerUser) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid or expired session." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Load caller's role from the database profiles table
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", callerUser.id)
      .single();

    if (profileError || !callerProfile) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Caller profile not found." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const callerRole = callerProfile.role;

    // 3. Verify caller authorization to create accounts
    if (callerRole !== "admin" && callerRole !== "ops_manager") {
      return new Response(
        JSON.stringify({ error: "Forbidden: Only administrators and operations managers can provision staff accounts." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse input body
    const body = await req.json();
    const { email, role: targetRole, fullName, phone, temporaryPassword, entityId } = body;

    if (!email || !targetRole || !fullName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, role, and fullName are mandatory." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate role hierarchy:
    // Only admin can create admin or ops_manager accounts; ops_manager can create technician and vendor only.
    if (targetRole === "admin" || targetRole === "ops_manager") {
      if (callerRole !== "admin") {
        return new Response(
          JSON.stringify({ error: "Forbidden: Only full administrators can create admin or operations manager accounts." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else if (targetRole !== "technician" && targetRole !== "vendor") {
      return new Response(
        JSON.stringify({ error: "Invalid role specified. Must be technician, vendor, ops_manager, or admin." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SEC-04 Pre-Validation: If entityId is provided, verify entity exists AND user_id is currently NULL
    if (entityId) {
      if (targetRole === "technician") {
        const { data: existingEmp, error: empErr } = await supabaseAdmin
          .from("employees")
          .select("id, user_id")
          .eq("id", entityId)
          .maybeSingle();

        if (empErr || !existingEmp) {
          return new Response(
            JSON.stringify({ error: "Invalid entity ID: Specified technician does not exist." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (existingEmp.user_id) {
          return new Response(
            JSON.stringify({ error: "Entity already linked: This technician is already assigned to an active user account." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else if (targetRole === "vendor") {
        const { data: existingVnd, error: vndErr } = await supabaseAdmin
          .from("vendors")
          .select("id, user_id")
          .eq("id", entityId)
          .maybeSingle();

        if (vndErr || !existingVnd) {
          return new Response(
            JSON.stringify({ error: "Invalid entity ID: Specified vendor does not exist." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (existingVnd.user_id) {
          return new Response(
            JSON.stringify({ error: "Entity already linked: This vendor is already assigned to an active user account." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // SEC-09: Password validation against blocklist and complexity
    let finalTempPass: string;

    if (temporaryPassword && typeof temporaryPassword === "string" && temporaryPassword.trim().length > 0) {
      const trimmed = temporaryPassword.trim();

      if (trimmed.length < 8) {
        return new Response(
          JSON.stringify({ error: "Password policy violation: Temporary password must be at least 8 characters long." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (BLOCKED_PASSWORDS.has(trimmed.toLowerCase())) {
        return new Response(
          JSON.stringify({ error: "Password policy violation: Provided password is on the common or compromised blocklist." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const hasNumbersOrSpecial = /[0-9]/.test(trimmed) || /[^A-Za-z0-9]/.test(trimmed);
      if (!hasNumbersOrSpecial) {
        return new Response(
          JSON.stringify({ error: "Password policy violation: Temporary password must contain numbers or special characters." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      finalTempPass = trimmed;
    } else {
      // Generate a strong temporary password containing upper, lower, numbers, symbols
      const randomSegment = crypto.randomUUID().replace(/-/g, "").substring(0, 8);
      finalTempPass = `PindCare#${randomSegment}!`;
    }

    // 4. Create user in auth.users via Admin API (service role)
    const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: finalTempPass,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone: phone || "",
        role: targetRole,
      },
    });

    if (createError || !newUserData?.user) {
      console.error("[create-staff-user] Auth user creation failed:", createError);
      return new Response(
        JSON.stringify({ error: "Failed to create user account. Please verify input or try again." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const createdUserId = newUserData.user.id;

    // 5. Update profiles record with targetRole and must_change_password = true
    const { error: updateProfileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: createdUserId,
        role: targetRole,
        full_name: fullName,
        phone: phone || "",
        phone_verified: false,
        must_change_password: true, // Mandatory password change on first login
        updated_at: new Date().toISOString(),
      });

    if (updateProfileError) {
      console.error("[create-staff-user] Profile update failed:", updateProfileError);
      // Roll back created user
      await supabaseAdmin.auth.admin.deleteUser(createdUserId);
      return new Response(
        JSON.stringify({ error: "Failed to initialize staff profile. User creation rolled back." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Link entityId with strict validation and rollback on error
    if (entityId) {
      const targetTable = targetRole === "technician" ? "employees" : "vendors";
      const { data: linkResult, error: linkError } = await supabaseAdmin
        .from(targetTable)
        .update({ user_id: createdUserId })
        .eq("id", entityId)
        .is("user_id", null)
        .select();

      if (linkError || !linkResult || linkResult.length === 0) {
        console.error(`[create-staff-user] Failed to link ${targetTable} ${entityId}:`, linkError);
        // Roll back created user
        await supabaseAdmin.auth.admin.deleteUser(createdUserId);
        return new Response(
          JSON.stringify({ error: "Unable to link staff profile to existing entity. User creation rolled back." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Return response with the one-time temporary password (never logged)
    return new Response(
      JSON.stringify({
        success: true,
        userId: createdUserId,
        email,
        role: targetRole,
        temporaryPassword: finalTempPass,
        message: `Staff account (${targetRole}) successfully provisioned. User must change password on first login.`,
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("[create-staff-user] Uncaught error:", err);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please contact the administrator." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
