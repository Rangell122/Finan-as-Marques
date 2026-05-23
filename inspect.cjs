const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aelacgltejhyxidfzxgj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlbGFjZ2x0ZWpoeXhpZGZ6eGdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1Mzg5MjUsImV4cCI6MjA5NTExNDkyNX0.xpFB5YY_Vfd0O9J9Y5srtzOcV_JR_9BKjM_NaqHo9Ig';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
  const { data, error } = await supabase.from('transactions').select('*').limit(1);
  if (error) {
    console.error('Error fetching:', error);
  } else {
    console.log('Columns in transactions:', Object.keys(data[0] || {}));
  }
}

inspect();
