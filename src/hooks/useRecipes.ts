import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, TABLES } from '../lib/supabase'
import { queryKeys } from '../lib/queryClient'
import type { Recipe, RecipeWithCategory, RecipeFilters } from '../types'

interface RawRecipeWithCategory extends Recipe {
  categories: RecipeWithCategory['category'] | null
  reviews: Array<{ rating: number }>
}

async function fetchRecipes(filters?: RecipeFilters): Promise<RecipeWithCategory[]> {
  let query = supabase
    .from(TABLES.RECIPES)
    .select(`
      *,
      categories (*),
      reviews (rating)
    `)
    .order('created_at', { ascending: false })

  if (filters?.category) {
    const { data: category } = await supabase
      .from(TABLES.CATEGORIES)
      .select('id')
      .eq('slug', filters.category)
      .single()
    
    if (category) {
      query = query.eq('category_id', category.id)
    }
  }

  if (filters?.difficulty) {
    query = query.eq('difficulty', filters.difficulty)
  }

  if (filters?.max_time) {
    query = query.lte('prep_time', filters.max_time)
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) throw error

  return (data as RawRecipeWithCategory[]).map(recipe => ({
    ...recipe,
    category: recipe.categories,
    reviews: recipe.reviews || [],
    average_rating: recipe.reviews?.length > 0 
      ? recipe.reviews.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0) / recipe.reviews.length 
      : 0,
    review_count: recipe.reviews?.length || 0,
  }))
}

async function fetchRecipeBySlug(slug: string): Promise<RecipeWithCategory | null> {
  const { data, error } = await supabase
    .from(TABLES.RECIPES)
    .select(`
      *,
      categories (*),
      reviews (*)
    `)
    .eq('slug', slug)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  const rawData = data as RawRecipeWithCategory & { reviews: Array<{ rating: number; comment: string | null; id: string; recipe_id: string; user_id: string | null; created_at: string; updated_at: string }> }

  return {
    ...rawData,
    category: rawData.categories,
    reviews: rawData.reviews || [],
    average_rating: rawData.reviews?.length > 0 
      ? rawData.reviews.reduce((acc: number, r) => acc + r.rating, 0) / rawData.reviews.length 
      : 0,
    review_count: rawData.reviews?.length || 0,
  }
}

async function fetchFeaturedRecipes(): Promise<RecipeWithCategory[]> {
  const { data, error } = await supabase
    .from(TABLES.RECIPES)
    .select(`
      *,
      categories (*),
      reviews (rating)
    `)
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(6)

  if (error) throw error

  return (data as RawRecipeWithCategory[]).map(recipe => ({
    ...recipe,
    category: recipe.categories,
    reviews: recipe.reviews || [],
    average_rating: recipe.reviews?.length > 0 
      ? recipe.reviews.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0) / recipe.reviews.length 
      : 0,
    review_count: recipe.reviews?.length || 0,
  }))
}

export function useRecipes(filters?: RecipeFilters) {
  return useQuery({
    queryKey: queryKeys.recipes.list(filters),
    queryFn: () => fetchRecipes(filters),
  })
}

export function useRecipe(slug: string) {
  return useQuery({
    queryKey: queryKeys.recipes.detail(slug),
    queryFn: () => fetchRecipeBySlug(slug),
    enabled: !!slug,
  })
}

export function useFeaturedRecipes() {
  return useQuery({
    queryKey: queryKeys.recipes.featured(),
    queryFn: fetchFeaturedRecipes,
  })
}

export function useRecipesByCategory(categorySlug: string) {
  return useQuery({
    queryKey: queryKeys.recipes.byCategory(categorySlug),
    queryFn: () => fetchRecipes({ category: categorySlug }),
    enabled: !!categorySlug,
  })
}

export function useSearchRecipes(searchTerm: string) {
  return useQuery({
    queryKey: queryKeys.recipes.list({ search: searchTerm }),
    queryFn: () => fetchRecipes({ search: searchTerm }),
    enabled: searchTerm.length >= 2,
  })
}

export function useCreateRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (recipe: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from(TABLES.RECIPES)
        .insert(recipe)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all })
    },
  })
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Recipe> & { id: string }) => {
      const { data, error } = await supabase
        .from(TABLES.RECIPES)
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all })
    },
  })
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(TABLES.RECIPES)
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all })
    },
  })
}