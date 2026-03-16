import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, TABLES } from '../lib/supabase'
import { queryKeys } from '../lib/queryClient'
import type { Review } from '../types'

async function fetchReviewsByRecipeId(recipeId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from(TABLES.REVIEWS)
    .select('*')
    .eq('recipe_id', recipeId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

async function createReview(review: Omit<Review, 'id' | 'created_at' | 'updated_at'>): Promise<Review> {
  const { data, error } = await supabase
    .from(TABLES.REVIEWS)
    .insert(review)
    .select()
    .single()

  if (error) throw error
  return data
}

async function updateReview(id: string, updates: Partial<Review>): Promise<Review> {
  const { data, error } = await supabase
    .from(TABLES.REVIEWS)
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

async function deleteReview(id: string): Promise<void> {
  const { error } = await supabase
    .from(TABLES.REVIEWS)
    .delete()
    .eq('id', id)

  if (error) throw error
}

export function useReviews(recipeId: string) {
  return useQuery({
    queryKey: queryKeys.reviews.byRecipe(recipeId),
    queryFn: () => fetchReviewsByRecipeId(recipeId),
    enabled: !!recipeId,
  })
}

export function useCreateReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createReview,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.reviews.byRecipe(variables.recipe_id) 
      })
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.recipes.detail(variables.recipe_id) 
      })
    },
  })
}

export function useUpdateReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...updates }: Partial<Review> & { id: string }) => 
      updateReview(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.byRecipe(variables.recipe_id || '') })
    },
  })
}

export function useDeleteReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all })
    },
  })
}