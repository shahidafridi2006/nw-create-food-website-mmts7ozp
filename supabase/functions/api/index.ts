import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  ingredients: string[];
  instructions: string[];
  image_url: string | null;
  cooking_time: number;
  servings: number;
  difficulty: string;
  category_id: string | null;
  author_name: string;
  rating: number;
  review_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

interface Review {
  id: string;
  recipe_id: string;
  author_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // Parse request body for POST/PUT requests
    let body: Record<string, unknown> | null = null;
    if (method === "POST" || method === "PUT") {
      try {
        body = await req.json();
      } catch {
        // Body might be empty
        body = null;
      }
    }

    // Route handling
    // Handle /api/recipes endpoint
    if (path.includes("/recipes")) {
      // GET /api/recipes - List all recipes with optional filters
      if (method === "GET") {
        const categoryId = url.searchParams.get("category");
        const difficulty = url.searchParams.get("difficulty");
        const featured = url.searchParams.get("featured");
        const search = url.searchParams.get("search");
        const limit = parseInt(url.searchParams.get("limit") || "20");
        const offset = parseInt(url.searchParams.get("offset") || "0");

        let query = supabase
          .from("recipes")
          .select(
            `
            *,
            categories (
              id,
              name,
              description
            )
          `
          )
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (categoryId) {
          query = query.eq("category_id", categoryId);
        }
        if (difficulty) {
          query = query.eq("difficulty", difficulty);
        }
        if (featured === "true") {
          query = query.eq("is_featured", true);
        }
        if (search) {
          query = query.ilike("title", `%${search}%`);
        }

        const { data, error, count } = await query;

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(
          JSON.stringify({
            data,
            total: count,
            limit,
            offset,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // POST /api/recipes - Create a new recipe
      if (method === "POST") {
        if (!body) {
          return new Response(JSON.stringify({ error: "Request body required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const {
          title,
          description,
          ingredients,
          instructions,
          image_url,
          cooking_time,
          servings,
          difficulty,
          category_id,
          author_name,
        } = body as Record<string, unknown>;

        // Validate required fields
        if (!title || !ingredients || !instructions) {
          return new Response(
            JSON.stringify({
              error: "Missing required fields: title, ingredients, instructions",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const { data, error } = await supabase
          .from("recipes")
          .insert([
            {
              title,
              description,
              ingredients,
              instructions,
              image_url,
              cooking_time: cooking_time || 0,
              servings: servings || 1,
              difficulty: difficulty || "easy",
              category_id,
              author_name: author_name || "Anonymous",
            },
          ])
          .select()
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ data }), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Handle /api/recipes/:id endpoint
    const recipeIdMatch = path.match(/\/api\/recipes\/([a-zA-Z0-9-]+)/);
    if (recipeIdMatch) {
      const recipeId = recipeIdMatch[1];

      // GET /api/recipes/:id - Get single recipe
      if (method === "GET") {
        const { data, error } = await supabase
          .from("recipes")
          .select(
            `
            *,
            categories (
              id,
              name,
              description
            ),
            reviews (
              id,
              author_name,
              rating,
              comment,
              created_at
            )
          `
          )
          .eq("id", recipeId)
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: "Recipe not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ data }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // PUT /api/recipes/:id - Update recipe
      if (method === "PUT") {
        if (!body) {
          return new Response(JSON.stringify({ error: "Request body required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data, error } = await supabase
          .from("recipes")
          .update(body)
          .eq("id", recipeId)
          .select()
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ data }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // DELETE /api/recipes/:id - Delete recipe
      if (method === "DELETE") {
        const { error } = await supabase.from("recipes").delete().eq("id", recipeId);

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Handle /api/categories endpoint
    if (path.includes("/categories")) {
      // GET /api/categories - List all categories
      if (method === "GET") {
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .order("name");

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ data }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // POST /api/categories - Create new category
      if (method === "POST") {
        if (!body) {
          return new Response(JSON.stringify({ error: "Request body required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { name, description, image_url } = body as Record<string, unknown>;

        if (!name) {
          return new Response(
            JSON.stringify({ error: "Category name is required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const { data, error } = await supabase
          .from("categories")
          .insert([{ name, description, image_url }])
          .select()
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ data }), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Handle /api/reviews endpoint
    if (path.includes("/reviews")) {
      // GET /api/reviews?recipe_id=xxx - Get reviews for a recipe
      if (method === "GET") {
        const recipeId = url.searchParams.get("recipe_id");

        if (!recipeId) {
          return new Response(
            JSON.stringify({ error: "recipe_id parameter required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const { data, error } = await supabase
          .from("reviews")
          .select("*")
          .eq("recipe_id", recipeId)
          .order("created_at", { ascending: false });

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ data }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // POST /api/reviews - Create a new review
      if (method === "POST") {
        if (!body) {
          return new Response(JSON.stringify({ error: "Request body required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { recipe_id, author_name, rating, comment } = body as Record<string, unknown>;

        if (!recipe_id || !author_name || !rating) {
          return new Response(
            JSON.stringify({
              error: "Missing required fields: recipe_id, author_name, rating",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const { data, error } = await supabase
          .from("reviews")
          .insert([{ recipe_id, author_name, rating, comment }])
          .select()
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ data }), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Handle /api/search endpoint
    if (path.includes("/search") && method === "GET") {
      const query = url.searchParams.get("q");
      const type = url.searchParams.get("type") || "all";

      if (!query) {
        return new Response(JSON.stringify({ error: "Search query (q) required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let recipesResult = { data: [], error: null };
      let categoriesResult = { data: [], error: null };

      if (type === "all" || type === "recipes") {
        recipesResult = await supabase
          .from("recipes")
          .select(
            `
            id,
            title,
            description,
            image_url,
            cooking_time,
            difficulty,
            rating
          `
          )
          .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(10);
      }

      if (type === "all" || type === "categories") {
        categoriesResult = await supabase
          .from("categories")
          .select("*")
          .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(10);
      }

      return new Response(
        JSON.stringify({
          recipes: recipesResult.data,
          categories: categoriesResult.data,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Handle /api/stats endpoint - Get platform statistics
    if (path.includes("/stats") && method === "GET") {
      const [recipesCount, categoriesCount, reviewsCount] = await Promise.all([
        supabase.from("recipes").select("id", { count: "exact", head: true }),
        supabase.from("categories").select("id", { count: "exact", head: true }),
        supabase.from("reviews").select("id", { count: "exact", head: true }),
      ]);

      const { data: featuredRecipes } = await supabase
        .from("recipes")
        .select("id, title, image_url, rating")
        .eq("is_featured", true)
        .limit(5);

      return new Response(
        JSON.stringify({
          total_recipes: recipesCount.count || 0,
          total_categories: categoriesCount.count || 0,
          total_reviews: reviewsCount.count || 0,
          featured_recipes: featuredRecipes || [],
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Default 404 response
    return new Response(
      JSON.stringify({
        error: "Endpoint not found",
        available_endpoints: [
          "GET /api/recipes",
          "POST /api/recipes",
          "GET /api/recipes/:id",
          "PUT /api/recipes/:id",
          "DELETE /api/recipes/:id",
          "GET /api/categories",
          "POST /api/categories",
          "GET /api/reviews",
          "POST /api/reviews",
          "GET /api/search",
          "GET /api/stats",
        ],
      }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});