const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dxznndkbicavwnhqhnzw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4em5uZGtiaWNhdnduaHFobnp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNDM3OTksImV4cCI6MjA5NTYxOTc5OX0.wGAslFVu01fFUXRMH_Mo6fbdmcOryUZ6KyIHlF8yJRo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Testing Supabase connection...');
  try {
    // Try to fetch public categories since user_id is null for system ones (RLS policy allows anyone to read if user_id is null)
    const { data, error } = await supabase.from('categories').select('*').limit(5);
    if (error) {
      console.error('Error fetching categories:', error);
    } else {
      console.log('Successfully fetched categories:', data);
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

run();
