import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://rwvgnhkcxqzuyvklxasm.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3dmduaGtjeHF6dXl2a2x4YXNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzODU0MTAsImV4cCI6MjA1Nzk2MTQxMH0.yM3H6MadPyPBp4e6YWv9upl91EbTBFOB6Es8FLEMGu0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);