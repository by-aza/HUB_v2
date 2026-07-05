// Configurare și inițializare Supabase (CORE Conexiune HUB v2)
const SUPABASE_URL = "https://xyovkxmtbvgcwavuyxxu.supabase.co"; // Pune URL-ul proiectului tău
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5b3ZreG10YnZnY3dhdnV5eHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNDI1ODMsImV4cCI6MjA5NTkxODU4M30.r-_Q0vTd4IdZrfJTwpsy8ptVp5krofFGKi4BqtHQl74"; // Pune cheia ta anonimă

// Inițializăm clientul global Supabase pentru toate paginile
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);