const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aelacgltejhyxidfzxgj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlbGFjZ2x0ZWpoeXhpZGZ6eGdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1Mzg5MjUsImV4cCI6MjA5NTExNDkyNX0.xpFB5YY_Vfd0O9J9Y5srtzOcV_JR_9BKjM_NaqHo9Ig';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data, error } = await supabase.from('transactions').insert({
    type: 'expense',
    description: 'Temp Test',
    amount: 1,
    date: '2026-05-23',
    category: 'Casa - Água',
    status: 'Pago'
  }).select();
  
  if (error) {
    console.error('Error inserting:', error.message);
  } else {
    console.log('Successfully inserted! All columns:', Object.keys(data[0]));
    // Clean up
    await supabase.from('transactions').delete().eq('id', data[0].id);
  }
}

test();
