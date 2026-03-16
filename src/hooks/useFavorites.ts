import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, TABLES } from '../lib/supabase'
import { queryKeys } from '../lib/queryClient'
import type { Favorite, RecipeWithCategory } from '../types'

interface FavoriteWithRecipe extends Favorite {
  recipes: RecipeWithCategory
}

// Local storage fallback for favorites when not logged in
const FAVORITES_STORAGE_KEY = 'foodie_favorites'

function getLocalFavorites(): string[] {
  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function setLocalFavorites(ids: string[]): void {
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids))
}

async function fetchFavorites(): Promise<RecipeWithCategory[]> {
  const localFavorites = getLocalFavorites()
  
  if (localFavorites.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from(TABLES.RECIPES)
    .select(`
      *,
      categories (*),
      reviews (rating)
    `)
    .in('id', localFavorites)

  if (error) throw error

  return data.map((recipe: any) => ({
    ...recipe,
    category: recipe.categories,
    reviews: recipe.reviews || [],
    average_rating: recipe.reviews?.length > 0 
      ? recipe.reviews.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0) / recipe.reviews.length 
      : 0,
    review_count: recipe.reviews?.length || 0,
  }))
}

async function toggleFavorite(recipeId: string): Promise<boolean> {
  const favorites = getLocalFavorites()
  const index = favorites.indexOf(recipeId)
  
  if (index === -1) {
    favorites.push(recipeId)
    setLocalFavorites(favorites)
    return true
  } else {
    favorites.splice(index, 1)
    setLocalFavorites(favorites)
    return false
  }
}

function isFavorite(recipeId: string): boolean {
  const favorites = getLocalFavorites()
  return favorites.includes(recipeId)
}

export function useFavorites() {
  return useQuery({
    queryKey: queryKeys.favorites.list(),
    queryFn: fetchFavorites,
  })
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (recipeId: string) => toggleFavorite(recipeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.list() })
    },
  })
}

export function useIsFavorite(recipeId: string) {
  return useQuery({
    queryKey: [...queryKeys.favorites.all, 'check', recipeId],
    queryFn: () => isFavorite(recipeId),
    enabled: !!recipeId,
  })
}

export { isFavorite, getLocalFavorites }