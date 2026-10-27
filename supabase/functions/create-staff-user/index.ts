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

  let createdUserId: string | null = null;
  let attachedEntityId: string | null = null;
  let targetTableForRollback: string | null = null;

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

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Parse input body
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    // =========================================================================
    // ACTION: submit-partner-application (Public prospective partner registration)
    // =========================================================================
    if (action === "submit-partner-application") {
      const {
        id,
        businessName,
        ownerName,
        phone,
        email,
        category,
        categories,
        serviceAreas,
        experienceYears,
        plan,
        password,
      } = body;

      if (!businessName || !ownerName || !phone || !password) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: businessName, ownerName, phone, and password are mandatory." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (typeof password === "string" && password.trim().length < 8) {
        return new Response(
          JSON.stringify({ error: "Password must be at least 8 characters long." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check phone duplication
      const rawDigits = phone.replace(/\D/g, "");
      let normPhone = rawDigits;
      if (normPhone.length === 12 && normPhone.startsWith("91")) {
        normPhone = normPhone.slice(2);
      } else if (normPhone.length > 10 && normPhone.startsWith("0")) {
        normPhone = normPhone.replace(/^0+/, "");
      }

      if (normPhone && normPhone.length === 10) {
        const { data: existingProfile } = await supabaseAdmin
          .from("profiles")
          .select("id, phone")
          .eq("phone_normalized", normPhone)
          .maybeSingle();

        if (existingProfile) {
          return new Response(
            JSON.stringify({ error: `Mobile number ${phone} is already registered. Please log in or contact support.` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: existingVendor } = await supabaseAdmin
          .from("vendors")
          .select("id, mobile")
          .ilike("mobile", `%${normPhone}%`)
          .maybeSingle();

        if (existingVendor) {
          return new Response(
            JSON.stringify({ error: `A vendor partner application with mobile ${phone} is already pending or active.` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      const newVndId = id && typeof id === "string" && id.startsWith("vnd-")
        ? id
        : `vnd-${Date.now()}`;

      const cats = Array.isArray(categories) && categories.length > 0
        ? categories
        : [category || "AC & Appliances"];

      const areas = Array.isArray(serviceAreas) && serviceAreas.length > 0
        ? serviceAreas
        : ["Sector 94 (JLPL / Fateh Burj)", "Sector 104, Mohali", "Sector 110, Mohali"];

      const defaultPlan = {
        name: "Enterprise Crew Plan",
        price: 4999,
        totalOpportunities: 30,
        usedOpportunities: 0,
        remainingOpportunities: 30,
        validityDays: 45,
        expiryDate: new Date(Date.now() + 45 * 86400000).toISOString().split("T")[0],
      };

      const finalPlan = plan && typeof plan === "object" ? plan : defaultPlan;

      const { data: insertedVendor, error: insertError } = await supabaseAdmin
        .from("vendors")
        .insert({
          id: newVndId,
          business_name: businessName.trim(),
          owner_name: ownerName.trim(),
          mobile: phone.trim(),
          email: email ? email.trim().toLowerCase() : `${ownerName.toLowerCase().replace(/\s+/g, "")}@gmail.com`,
          status: "PENDING_VERIFICATION",
          categories: cats,
          service_areas: areas,
          experience_years: Number(experienceYears) || 5,
          rating: 5.0,
          plan: finalPlan,
          password: password.trim(),
        })
        .select()
        .single();

      if (insertError) {
        console.error("[create-staff-user] Partner application insert error:", insertError);
        return new Response(
          JSON.stringify({ error: `Failed to save partner application: ${insertError.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          vendor: insertedVendor,
          message: "Partner application submitted! Queued for Operations Manager review & activation.",
        }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Verify caller's JWT for staff/management actions
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Missing Authorization header." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Helper to completely roll back all records created in a failed attempt
    const performRollback = async (userId: string | null, targetTable?: string | null, entityId?: string | null) => {
      if (!userId) return;
      try {
        if (entityId && targetTable) {
          await supabaseAdmin.from(targetTable).delete().eq("id", entityId);
        }
        await supabaseAdmin.from("employees").delete().eq("user_id", userId);
        await supabaseAdmin.from("vendors").delete().eq("user_id", userId);
        await supabaseAdmin.from("profiles").delete().eq("id", userId);
        await supabaseAdmin.auth.admin.deleteUser(userId);
      } catch (rbErr) {
        console.error("[create-staff-user] Rollback error:", rbErr);
      }
    };

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

    // 3. Verify caller authorization to create accounts (allow admin, ops_manager, or operations)
    if (callerRole !== "admin" && callerRole !== "ops_manager" && callerRole !== "operations") {
      return new Response(
        JSON.stringify({ error: "Forbidden: Only administrators and operations managers can perform staff operations." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =========================================================================
    // ACTION: approve-vendor (Operations Manager / Admin activates pending vendor)
    // =========================================================================
    if (action === "approve-vendor") {
      const { vendorId, paymentDetails } = body;
      if (!vendorId) {
        return new Response(
          JSON.stringify({ error: "Missing vendorId parameter." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: vnd, error: vndFetchErr } = await supabaseAdmin
        .from("vendors")
        .select("*")
        .eq("id", vendorId)
        .maybeSingle();

      if (vndFetchErr || !vnd) {
        return new Response(
          JSON.stringify({ error: "Vendor not found." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let finalUserId = vnd.user_id;

      if (!finalUserId && vnd.email && vnd.password) {
        const rawDigits = vnd.mobile ? vnd.mobile.replace(/\D/g, "") : "";
        let normPhone = rawDigits;
        if (normPhone.length === 12 && normPhone.startsWith("91")) normPhone = normPhone.slice(2);
        else if (normPhone.length > 10 && normPhone.startsWith("0")) normPhone = normPhone.replace(/^0+/, "");

        let existingUser: any = null;
        if (normPhone && normPhone.length === 10) {
          const { data: prof } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("phone_normalized", normPhone)
            .maybeSingle();
          if (prof) existingUser = prof;
        }

        if (existingUser) {
          finalUserId = existingUser.id;
          await supabaseAdmin
            .from("profiles")
            .update({ role: "vendor" })
            .eq("id", finalUserId);
        } else {
          const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
            email: vnd.email,
            password: vnd.password,
            email_confirm: true,
            user_metadata: {
              full_name: vnd.owner_name || vnd.business_name,
              phone: vnd.mobile || "",
              role: "vendor",
            },
          });

          if (!createErr && newUser?.user) {
            finalUserId = newUser.user.id;
            await supabaseAdmin
              .from("profiles")
              .update({ role: "vendor" })
              .eq("id", finalUserId);
          }
        }
      }

      const updatedPlan = {
        ...(vnd.plan || {}),
        onboardingPayment: paymentDetails || vnd.plan?.onboardingPayment,
      };

      const { data: updatedVnd, error: updateErr } = await supabaseAdmin
        .from("vendors")
        .update({
          status: "ACTIVE",
          documents_verified: true,
          user_id: finalUserId || vnd.user_id,
          plan: updatedPlan,
        })
        .eq("id", vendorId)
        .select()
        .single();

      if (updateErr) {
        return new Response(
          JSON.stringify({ error: `Failed to update vendor: ${updateErr.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          vendor: updatedVnd,
          message: `Vendor ${vnd.business_name} approved and activated successfully.`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const {
      email,
      role: rawRole,
      fullName,
      phone,
      temporaryPassword,
      entityId,
      employeeCode,
      employeeRole,
      skills,
      serviceAreas,
      categories,
      businessName,
      ownerName,
      experienceYears,
    } = body;

    // Normalize roles to database check constraint
    let targetRole = rawRole;
    if (targetRole === "operations") targetRole = "ops_manager";
    if (targetRole === "employee") targetRole = "technician";

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

    // Pre-check phone uniqueness to provide clear feedback and avoid unnecessary auth user creation
    if (phone && typeof phone === "string" && phone.trim()) {
      const rawDigits = phone.replace(/\D/g, "");
      let normPhone = rawDigits;
      if (normPhone.length === 12 && normPhone.startsWith("91")) {
        normPhone = normPhone.slice(2);
      } else if (normPhone.length > 10 && normPhone.startsWith("0")) {
        normPhone = normPhone.replace(/^0+/, "");
      }

      if (normPhone && normPhone.length === 10) {
        const { data: existingProfile } = await supabaseAdmin
          .from("profiles")
          .select("id, full_name, role")
          .eq("phone_normalized", normPhone)
          .maybeSingle();

        if (existingProfile) {
          const { data: existingAuth } = await supabaseAdmin.auth.admin.getUserById(existingProfile.id);
          const emailSuffix = existingAuth?.user?.email ? ` to account ${existingAuth.user.email}` : " to another account";
          return new Response(
            JSON.stringify({
              error: `Mobile number ${phone} is already registered${emailSuffix}.`,
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Pre-Validation: If entityId is provided, verify entity exists AND user_id is currently NULL
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

    // 4. Create user in auth.users via Admin API (service role).
    // The handle_new_user() trigger will create the profiles row with phone and phone_normalized.
    const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: finalTempPass,
      email_confirm: true,
      user_metadata: {
        full_name: fullName.trim(),
        phone: phone ? phone.trim() : "",
        role: targetRole,
      },
    });

    if (createError || !newUserData?.user) {
      console.error("[create-staff-user] Auth user creation failed:", createError);
      let errorMsg = createError?.message || "Failed to create user account. Please verify input or try again.";
      if (errorMsg.includes("PHONE_ALREADY_REGISTERED") || errorMsg.includes("already registered") || errorMsg.includes("already associated")) {
        errorMsg = `Mobile number ${phone} is already associated with another account.`;
      }
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    createdUserId = newUserData.user.id;

    // 5. Update profiles record with targetRole and must_change_password = true.
    // The phone and phone_normalized were already safely written by handle_new_user().
    // Using update() without re-submitting phone ensures we do not trigger redundant phone validation.
    const { error: updateProfileError } = await supabaseAdmin
      .from("profiles")
      .update({
        role: targetRole,
        full_name: fullName.trim(),
        must_change_password: true, // Mandatory password change on first login
        updated_at: new Date().toISOString(),
      })
      .eq("id", createdUserId);

    if (updateProfileError) {
      console.error("[create-staff-user] Profile update failed:", updateProfileError);
      // Clean rollback of the created auth user and profile
      await performRollback(createdUserId);
      createdUserId = null;
      return new Response(
        JSON.stringify({
          error: updateProfileError?.message
            ? `Failed to initialize staff profile: ${updateProfileError.message}`
            : "Failed to initialize staff profile. User creation rolled back.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Create or link matching employees / vendors record linked by user_id
    if (targetRole === "technician") {
      targetTableForRollback = "employees";
      if (entityId) {
        // Link to existing employee row
        const { data: linkResult, error: linkError } = await supabaseAdmin
          .from("employees")
          .update({
            user_id: createdUserId,
            email: email.trim().toLowerCase(),
          })
          .eq("id", entityId)
          .is("user_id", null)
          .select();

        if (linkError || !linkResult || linkResult.length === 0) {
          console.error(`[create-staff-user] Failed to link employees ${entityId}:`, linkError);
          await performRollback(createdUserId);
          createdUserId = null;
          return new Response(
            JSON.stringify({ error: linkError?.message ? `Failed to link technician entity: ${linkError.message}` : "Unable to link staff profile to existing entity. User creation rolled back." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        attachedEntityId = entityId;
      } else {
        // Automatically create new row in employees table
        const newEmpId = `emp-${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
        const finalEmpCode = employeeCode && employeeCode.trim()
          ? employeeCode.trim()
          : `EMP-${Math.floor(100 + Math.random() * 900)}`;

        const parsedSkills = Array.isArray(skills) && skills.length > 0
          ? skills
          : (typeof skills === "string" && skills.trim()
              ? skills.split(",").map((s: string) => s.trim()).filter(Boolean)
              : ["General Repairs", "Field Diagnostics"]);

        const parsedAreas = Array.isArray(serviceAreas) && serviceAreas.length > 0
          ? serviceAreas
          : ["Sector 94", "Sector 104", "Sector 110"];

        const { error: empInsertError } = await supabaseAdmin
          .from("employees")
          .insert({
            id: newEmpId,
            user_id: createdUserId,
            employee_code: finalEmpCode,
            name: fullName.trim(),
            email: email.trim().toLowerCase(),
            mobile: phone ? phone.trim() : "",
            role: employeeRole && employeeRole.trim() ? employeeRole.trim() : "Field Specialist",
            status: "ACTIVE",
            availability: "AVAILABLE",
            skills: parsedSkills,
            service_areas: parsedAreas,
            rating: 5.0,
            completed_jobs: 0,
          });

        if (empInsertError) {
          console.error("[create-staff-user] Failed to insert new employee row:", empInsertError);
          await performRollback(createdUserId, "employees", newEmpId);
          createdUserId = null;
          return new Response(
            JSON.stringify({ error: `Failed to create employee record: ${empInsertError.message}. User creation rolled back.` }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        attachedEntityId = newEmpId;
      }
    } else if (targetRole === "vendor") {
      targetTableForRollback = "vendors";
      if (entityId) {
        // Link to existing vendor row
        const { data: linkResult, error: linkError } = await supabaseAdmin
          .from("vendors")
          .update({
            user_id: createdUserId,
            email: email.trim().toLowerCase(),
          })
          .eq("id", entityId)
          .is("user_id", null)
          .select();

        if (linkError || !linkResult || linkResult.length === 0) {
          console.error(`[create-staff-user] Failed to link vendors ${entityId}:`, linkError);
          await performRollback(createdUserId);
          createdUserId = null;
          return new Response(
            JSON.stringify({ error: linkError?.message ? `Failed to link vendor entity: ${linkError.message}` : "Unable to link vendor profile to existing entity. User creation rolled back." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        attachedEntityId = entityId;
      } else {
        // Automatically create new row in vendors table
        const newVndId = `vnd-${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
        const bName = businessName && businessName.trim() ? businessName.trim() : `${fullName.trim()} Contracting Services`;
        const oName = ownerName && ownerName.trim() ? ownerName.trim() : fullName.trim();

        const parsedCategories = Array.isArray(categories) && categories.length > 0
          ? categories
          : ["General Trade Services"];

        const parsedAreas = Array.isArray(serviceAreas) && serviceAreas.length > 0
          ? serviceAreas
          : ["Sector 94", "Sector 104", "Sector 110"];

        const expYears = typeof experienceYears === "number" && experienceYears > 0 ? experienceYears : 5;

        const { error: vndInsertError } = await supabaseAdmin
          .from("vendors")
          .insert({
            id: newVndId,
            user_id: createdUserId,
            business_name: bName,
            owner_name: oName,
            mobile: phone ? phone.trim() : "",
            email: email.trim().toLowerCase(),
            status: "ACTIVE",
            categories: parsedCategories,
            service_areas: parsedAreas,
            experience_years: expYears,
            rating: 5.0,
            plan: {
              name: "Standard Trade Plan",
              price: 1499,
              totalOpportunities: 7,
              usedOpportunities: 0,
              remainingOpportunities: 7,
              validityDays: 30,
              expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
            },
          });

        if (vndInsertError) {
          console.error("[create-staff-user] Failed to insert new vendor row:", vndInsertError);
          await performRollback(createdUserId, "vendors", newVndId);
          createdUserId = null;
          return new Response(
            JSON.stringify({ error: `Failed to create vendor partner record: ${vndInsertError.message}. User creation rolled back.` }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        attachedEntityId = newVndId;
      }
    }

    // Return response with the one-time temporary password (never logged)
    return new Response(
      JSON.stringify({
        success: true,
        userId: createdUserId,
        email: email.trim().toLowerCase(),
        role: targetRole,
        entityId: attachedEntityId,
        temporaryPassword: finalTempPass,
        message: `Staff account (${targetRole}) successfully provisioned and linked to database entity. User must change password on first login.`,
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    if (createdUserId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
        if (attachedEntityId && targetTableForRollback) {
          await supabaseAdmin.from(targetTableForRollback).delete().eq("id", attachedEntityId);
        }
        await supabaseAdmin.from("employees").delete().eq("user_id", createdUserId);
        await supabaseAdmin.from("vendors").delete().eq("user_id", createdUserId);
        await supabaseAdmin.from("profiles").delete().eq("id", createdUserId);
        await supabaseAdmin.auth.admin.deleteUser(createdUserId);
      } catch (cleanupErr) {
        console.error("[create-staff-user] Catch rollback error:", cleanupErr);
      }
    }
    const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred. Please contact the administrator.";
    console.error("[create-staff-user] Uncaught error:", err);
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
