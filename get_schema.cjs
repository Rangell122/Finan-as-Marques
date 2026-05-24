const anonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlbGFjZ2x0ZWpoeXhpZGZ6eGdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1Mzg5MjUsImV4cCI6MjA5NTExNDkyNX0.xpFB5YY_Vfd0O9J9Y5srtzOcV_JR_9BKjM_NaqHo9Ig";

async function main() {
  const res = await fetch("https://aelacgltejhyxidfzxgj.supabase.co/rest/v1/", {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
  });
  const data = await res.json();
  console.log("Response:", data);
}

main();
