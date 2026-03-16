// Types matching the Supabase database schema exactly

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Recipe {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  ingredients: string[];
  instructions: string[];
  image_url: string | null;
  category_id: string | null;
  prep_time: number;
  cook_time: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  recipe_id: string;
  user_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  recipe_id: string;
  created_at: string;
}

// Extended types with related data
export interface RecipeWithCategory extends Recipe {
  category: Category | null;
  reviews: Review[];
  average_rating: number;
  review_count: number;
}

export interface CategoryWithRecipes extends Category {
  recipes: Recipe[];
  recipe_count: number;
}

// API response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// Search and filter types
export interface RecipeFilters {
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  max_time?: number;
  search?: string;
}

// Form types
export interface RecipeFormData {
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  image_url: string;
  category_id: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface ReviewFormData {
  rating: number;
  comment: string;
}