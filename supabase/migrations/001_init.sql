-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recipes table
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
  instructions JSONB NOT NULL DEFAULT '[]'::jsonb,
  image_url TEXT,
  cooking_time INTEGER DEFAULT 0,
  servings INTEGER DEFAULT 1,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'easy',
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  author_name TEXT DEFAULT 'Anonymous',
  rating DECIMAL(3,2) DEFAULT 0.00,
  review_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category_id);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes(difficulty);
CREATE INDEX IF NOT EXISTS idx_reviews_recipe ON reviews(recipe_id);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for categories (read-only for public)
CREATE POLICY "Categories are viewable by everyone" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Categories can be inserted by authenticated users" ON categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policies for recipes
CREATE POLICY "Recipes are viewable by everyone" ON recipes
  FOR SELECT USING (true);

CREATE POLICY "Recipes can be inserted by authenticated users" ON recipes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Recipes can be updated by authenticated users" ON recipes
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Recipes can be deleted by authenticated users" ON recipes
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for reviews
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Reviews can be inserted by authenticated users" ON reviews
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Reviews can be deleted by authenticated users" ON reviews
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for recipes table
CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to update recipe rating
CREATE OR REPLACE FUNCTION update_recipe_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE recipes
  SET 
    rating = (SELECT AVG(rating)::DECIMAL(3,2) FROM reviews WHERE recipe_id = NEW.recipe_id),
    review_count = (SELECT COUNT(*) FROM reviews WHERE recipe_id = NEW.recipe_id)
  WHERE id = NEW.recipe_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for reviews
CREATE TRIGGER update_recipe_rating_after_review
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_recipe_rating();

-- Insert default categories
INSERT INTO categories (name, description, image_url) VALUES
  ('Breakfast', 'Start your day with delicious morning meals', 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400'),
  ('Lunch', 'Midday meals to keep you energized', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'),
  ('Dinner', 'Hearty evening meals for the whole family', 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400'),
  ('Desserts', 'Sweet treats and indulgent delights', 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400'),
  ('Appetizers', 'Perfect starters for any occasion', 'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=400'),
  ('Soups', 'Warm and comforting bowl recipes', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400'),
  ('Salads', 'Fresh and healthy salad recipes', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400'),
  ('Beverages', 'Refreshing drinks and cocktails', 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400');

-- Insert sample recipes
INSERT INTO recipes (title, description, ingredients, instructions, image_url, cooking_time, servings, difficulty, category_id, author_name, is_featured) VALUES
  (
    'Classic Pancakes',
    'Fluffy homemade pancakes perfect for a weekend breakfast',
    '["2 cups all-purpose flour", "2 tablespoons sugar", "2 teaspoons baking powder", "1 teaspoon salt", "2 eggs", "1¾ cups milk", "¼ cup melted butter", "1 teaspoon vanilla extract"]'::jsonb,
    '["Mix flour, sugar, baking powder, and salt in a large bowl", "Whisk eggs, milk, melted butter, and vanilla in another bowl", "Pour wet ingredients into dry ingredients and mix until just combined", "Heat a griddle over medium heat and grease lightly", "Pour ¼ cup batter for each pancake", "Cook until bubbles form on surface, then flip and cook until golden"]'::jsonb,
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800',
    20,
    8,
    'easy',
    (SELECT id FROM categories WHERE name = 'Breakfast'),
    'Chef Maria',
    true
  ),
  (
    'Grilled Caesar Salad',
    'A modern twist on the classic Caesar with smoky grilled romaine',
    '["2 heads romaine lettuce", "½ cup Caesar dressing", "½ cup parmesan cheese", "1 cup croutons", "2 tablespoons olive oil", "Salt and pepper to taste", "Lemon wedges for serving"]'::jsonb,
    '["Heat grill to medium-high heat", "Cut romaine heads in half lengthwise", "Brush cut sides with olive oil", "Grill cut-side down for 2-3 minutes until charred", "Transfer to plates, drizzle with Caesar dressing", "Top with parmesan and croutons", "Serve with lemon wedges"]'::jsonb,
    'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=800',
    15,
    4,
    'easy',
    (SELECT id FROM categories WHERE name = 'Salads'),
    'Chef Alex',
    false
  ),
  (
    'Beef Bourguignon',
    'Classic French stew with tender beef in rich red wine sauce',
    '["3 lbs beef chuck, cubed", "6 slices bacon, diced", "1 bottle red wine", "2 cups beef broth", "1 lb pearl onions", "1 lb mushrooms", "4 carrots, sliced", "4 cloves garlic", "2 tablespoons tomato paste", "Fresh thyme and bay leaves"]'::jsonb,
    '["Brown bacon in Dutch oven, remove and set aside", "Brown beef in bacon fat in batches", "Add onions and carrots, cook 5 minutes", "Add garlic and tomato paste", "Pour in wine and broth, add herbs", "Cover and simmer 2-3 hours until beef is tender", "Add mushrooms in last 30 minutes", "Adjust seasoning and serve hot"]'::jsonb,
    'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=800',
    180,
    6,
    'hard',
    (SELECT id FROM categories WHERE name = 'Dinner'),
    'Chef Pierre',
    true
  ),
  (
    'Chocolate Lava Cake',
    'Decadent chocolate cake with a molten center',
    '["4 oz dark chocolate", "½ cup butter", "1 cup powdered sugar", "2 eggs", "2 egg yolks", "6 tablespoons flour", "Butter and cocoa for ramekins"]'::jsonb,
    '["Preheat oven to 425°F", "Butter and dust 4 ramekins with cocoa", "Melt chocolate and butter together", "Stir in powdered sugar", "Whisk in eggs and yolks", "Fold in flour until just combined", "Divide among ramekins", "Bake 12-14 minutes until edges are firm", "Let sit 1 minute, then invert onto plates"]'::jsonb,
    'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=800',
    25,
    4,
    'medium',
    (SELECT id FROM categories WHERE name = 'Desserts'),
    'Pastry Chef Sophie',
    true
  ),
  (
    'Tomato Basil Soup',
    'Creamy roasted tomato soup with fresh basil',
    '["2 lbs tomatoes, halved", "1 onion, quartered", "4 cloves garlic", "¼ cup olive oil", "4 cups vegetable broth", "½ cup fresh basil", "½ cup heavy cream", "Salt and pepper to taste"]'::jsonb,
    '["Preheat oven to 400°F", "Toss tomatoes, onion, and garlic with olive oil", "Roast for 30 minutes until charred", "Transfer to pot with broth", "Simmer 10 minutes", "Blend until smooth", "Stir in cream and basil", "Season and serve hot"]'::jsonb,
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800',
    45,
    6,
    'easy',
    (SELECT id FROM categories WHERE name = 'Soups'),
    'Chef Maria',
    false
  );

-- Insert sample reviews
INSERT INTO reviews (recipe_id, author_name, rating, comment) VALUES
  ((SELECT id FROM recipes WHERE title = 'Classic Pancakes'), 'John D.', 5, 'Best pancakes I have ever made! So fluffy and delicious.'),
  ((SELECT id FROM recipes WHERE title = 'Classic Pancakes'), 'Sarah M.', 4, 'Great recipe! Added blueberries for extra flavor.'),
  ((SELECT id FROM recipes WHERE title = 'Beef Bourguignon'), 'Mike R.', 5, 'Authentic French taste. Worth the time investment.'),
  ((SELECT id FROM recipes WHERE title = 'Chocolate Lava Cake'), 'Emily L.', 5, 'Perfect molten center! Restaurant quality at home.'),
  ((SELECT id FROM recipes WHERE title = 'Tomato Basil Soup'), 'David K.', 4, 'Very comforting soup. Great with grilled cheese.');