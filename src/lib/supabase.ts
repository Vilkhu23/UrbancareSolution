import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Checks whether Supabase is properly configured with valid non-placeholder keys.
 */
export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl.includes('your-project-id') &&
    !supabaseAnonKey.includes('your-anon-key') &&
    supabaseUrl.startsWith('http')
  );
};

// Create the Supabase client instance. If unconfigured, a dummy fallback client is created
// so that the app starts smoothly without throwing initialization errors.
export const supabase = createClient(
  isSupabaseConfigured() ? supabaseUrl : 'https://placeholder-project.supabase.co',
  isSupabaseConfigured() ? supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

/**
 * Health check helper to test active connection to PostgreSQL via Supabase.
 */
export const checkSupabaseHealth = async (): Promise<{
  connected: boolean;
  message: string;
  latencyMs?: number;
}> => {
  if (!isSupabaseConfigured()) {
    return {
      connected: false,
      message: import.meta.env.DEV
        ? 'Supabase credentials not configured in .env file (Running in offline/local mock mode)'
        : 'Service not configured: missing Supabase credentials.'
    };
  }

  const startTime = performance.now();
  try {
    const { data, error } = await supabase
      .from('service_categories')
      .select('id')
      .limit(1);

    const latencyMs = Math.round(performance.now() - startTime);

    if (error) {
      // If table doesn't exist yet, but client connected to Supabase
      if (error.code === '42P01') {
        return {
          connected: true,
          latencyMs,
          message: 'Connected to Supabase PostgreSQL, but tables not created yet. Please execute supabase/schema.sql.'
        };
      }
      return {
        connected: false,
        latencyMs,
        message: `Supabase error (${error.code || 'UNKNOWN'}): ${error.message}`
      };
    }

    return {
      connected: true,
      latencyMs,
      message: `Connected successfully to PostgreSQL database via Supabase (${latencyMs}ms)`
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      message: `Failed to connect to Supabase: ${errorMsg}`
    };
  }
};
