import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '__SUPABASE_URL__'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '__SUPABASE_ANON_KEY__'

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