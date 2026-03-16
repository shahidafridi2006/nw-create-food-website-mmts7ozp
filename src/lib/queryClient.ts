import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})

// Query keys for consistent cache management
export const queryKeys = {
  recipes: {
    all: ['recipes'] as const,
    list: (filters?: Record<string, unknown>) => ['recipes', 'list', filters] as const,
    detail: (slug: string) => ['recipes', 'detail', slug] as const,
    featured: () => ['recipes', 'featured'] as const,
    byCategory: (categorySlug: string) => ['recipes', 'category', categorySlug] as const,
  },
  categories: {
    all: ['categories'] as const,
    list: () => ['categories', 'list'] as const,
    detail: (slug: string) => ['categories', 'detail', slug] as const,
  },
  reviews: {
    byRecipe: (recipeId: string) => ['reviews', 'recipe', recipeId] as const,
  },
  favorites: {
    all: ['favorites'] as const,
    list: () => ['favorites', 'list'] as const,
  },
}