import { useQuery } from '@tanstack/react-query'
import { supabase, TABLES } from '../lib/supabase'
import { queryKeys } from '../lib/queryClient'
import type { Category, CategoryWithRecipes } from '../types'

async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from(TABLES.CATEGORIES)
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data
}

async function fetchCategoryBySlug(slug: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from(TABLES.CATEGORIES)
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

async function fetchCategoriesWithRecipes(): Promise<CategoryWithRecipes[]> {
  const { data: categories, error: catError } = await supabase
    .from(TABLES.CATEGORIES)
    .select('*')
    .order('name', { ascending: true })

  if (catError) throw catError

  const { data: recipes, error: recError } = await supabase
    .from(TABLES.RECIPES)
    .select('id, category_id')

  if (recError) throw recError

  const recipeCounts = recipes?.reduce((acc: Record<string, number>, recipe: { category_id: string | null }) => {
    if (recipe.category_id) {
      acc[recipe.category_id] = (acc[recipe.category_id] || 0) + 1
    }
    return acc
  }, {}) || {}

  return categories.map(category => ({
    ...category,
    recipes: [],
    recipe_count: recipeCounts[category.id] || 0,
  }))
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: fetchCategories,
  })
}

export function useCategory(slug: string) {
  return useQuery({
    queryKey: queryKeys.categories.detail(slug),
    queryFn: () => fetchCategoryBySlug(slug),
    enabled: !!slug,
  })
}

export function useCategoriesWithRecipes() {
  return useQuery({
    queryKey: [...queryKeys.categories.all, 'with-recipes'],
    queryFn: fetchCategoriesWithRecipes,
  })
}