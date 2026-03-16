import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://afcjkbufqhwezmmidqmj.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmY2prYnVmcWh3ZXptbWlkcW1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjQxNTcsImV4cCI6MjA4OTI0MDE1N30.UxuczDmt8QKuzcir-27_i-JjypgJXaA3bPbjkhdNbq8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to get public URL for storage files
export function getStorageUrl(bucket: string, path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
}

// Database table names
export const TABLES = {
  CATEGORIES: 'categories',
  RECIPES: 'recipes',
  USERS: 'users',
  REVIEWS: 'reviews',
  FAVORITES: 'favorites',
} as const