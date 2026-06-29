// =============================================================
// FIVEWARD — Supabase Client Initialization
// This file creates and exports the Supabase client instance.
// It must be loaded before any other JS file that uses Supabase.
//
// Setup steps:
//   1. Go to https://supabase.com and create a project
//   2. Copy your Project URL and Anon Key from:
//      Project Settings → API
//   3. Replace the placeholder values below
// =============================================================

// TODO: Replace these with your actual Supabase project values
const SUPABASE_URL  = 'https://tayecabtwxnobuhazbdc.supabase.co';
const SUPABASE_ANON = 'sb_publishable_I4vX6LFk2qEZ0FMS78Rjjg_JUZGEEIR';

// Initialize the client using the CDN-loaded supabase-js library.
// The <script> tag for supabase-js must appear in the HTML BEFORE
// this file is loaded:
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
try {
  const { createClient } = supabase;
  window.sb = createClient(SUPABASE_URL, SUPABASE_ANON);
} catch (e) {
  console.warn('Supabase not configured yet — add your URL and anon key to supabase-client.js');
  window.sb = null;
}
