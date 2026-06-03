import requests
import json

def fetch_from_open_food_facts(query):
    """
    Fetch product data from Open Food Facts API
    Returns structured product data
    """
    try:
        url = "https://world.openfoodfacts.org/cgi/search.pl"
        params = {
            'search_terms': query,
            'search_simple': 1,
            'action': 'process',
            'json': 1,
            'page_size': 50,
            'fields': 'product_name,brands,image_url,ingredients_text,nutriments,nutriscore_grade,categories,quantity'
        }
        
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            return data.get('products', [])
    except Exception as e:
        print(f"Error fetching from Open Food Facts: {e}")
    
    return []

def get_products():
    """
    Get 500+ products across all categories
    Returns list of product dictionaries
    """
    
    search_queries = [
        # Soft Drinks & Beverages (60 products)
        "Coca-Cola", "Pepsi", "Thums Up", "Sprite", "Fanta", "Limca",
        "Mountain Dew", "7UP", "Mirinda", "Appy Fizz", "Paper Boat",
        "Real Fruit Juice", "Tropicana", "B Natural", "Slice", "Maaza",
        "Coconut Water", "Red Bull", "Sting", "Monster", "Energy Drink",
        "Juice", "Soda", "Drink", "Beverage",
        
        # Instant Noodles (45 products)
        "Maggi Noodles", "Sunfeast Yippee", "Top Ramen", "Ching's Noodles",
        "Wai Wai", "Samyang", "Nongshim", "Korean Noodles", "Ramen",
        "Instant Noodles", "Pasta Noodles",
        
        # Sauces & Condiments (30 products)
        "Tomato Ketchup", "Soy Sauce", "Chili Sauce", "Kissan", "Maggi",
        "Heinz", "Del Monte", "Vinegar", "Green Chili", "Red Chili",
        "Sauce", "Condiment",
        
        # Atta/Flour (20 products)
        "Aashirvaad Atta", "Fortune Atta", "Pillsbury Atta", "Annapurna",
        "Nature Fresh", "Weikfield", "Flour", "Wheat", "Atta",
        
        # Cooking Oils (20 products)
        "Fortune Oil", "Dhara Oil", "Saffola", "Gemini Oil", "Sundrop",
        "Patanjali Oil", "Emami Oil", "Oil", "Mustard Oil", "Sunflower Oil",
        
        # Dairy Products (30 products)
        "Amul Lassi", "Amul Milk", "Mother Dairy", "Nandini", "Verka",
        "Paneer", "Cheese", "Butter", "Buttermilk", "Yogurt",
        "Milk", "Dairy", "Cheese",
        
        # Chocolates (40 products)
        "Cadbury Dairy Milk", "5 Star", "Perk", "KitKat", "Munch",
        "Milkybar", "Lindt", "Hershey's", "Bournville", "Dark Chocolate",
        "Amul Chocolate", "Oreo", "Chocolate", "Cocoa",
        
        # Pasta & Macaroni (15 products)
        "Sunfeast Pasta", "Weikfield Pasta", "Del Monte Pasta", "Borges",
        "Penne", "Spaghetti", "Macaroni", "Pasta",
        
        # Biscuits (35 products)
        "Parle-G", "Monaco", "Krackjack", "Hide & Seek", "Good Day",
        "Bourbon", "Oreo", "Unibic", "Biscuit", "Cookie", "Cookies",
        
        # Chips & Snacks (50 products)
        "Lay's", "Kurkure", "Bingo", "Doritos", "Haldiram's",
        "Balaji", "Wafers", "Chips", "Snacks", "Crisp", "Potato Chips",
        
        # Breakfast Foods (35 products)
        "Corn Flakes", "Kellogg's", "Bagrry's", "Muesli", "Oats",
        "Chocos", "Granola", "Yogabar", "Breakfast Cereal", "Cereal",
    ]
    
    all_products = []
    product_set = set()  # To avoid duplicates
    
    print("\n🔄 Fetching 500+ products from Open Food Facts...")
    
    for i, query in enumerate(search_queries):
        print(f"  Fetching: {query} ({i+1}/{len(search_queries)})")
        
        products = fetch_from_open_food_facts(query)
        
        for p in products:
            # Create unique key to avoid duplicates
            key = f"{p.get('product_name', '')}-{p.get('brands', '')}"
            
            if key not in product_set and len(all_products) < 500:
                product_set.add(key)
                
                # Extract nutrients
                nutriments = p.get('nutriments', {})
                
                # Determine category
                category = determine_category(p.get('product_name', ''), p.get('categories', ''))
                
                product = {
                    'name': p.get('product_name', 'Unknown'),
                    'brand': p.get('brands', 'Unknown'),
                    'category': category,
                    'image_url': p.get('image_url', ''),
                    'ingredients': p.get('ingredients_text', ''),
                    'nutriments': {
                        'energy_kcal_100g': nutriments.get('energy-kcal_100g', nutriments.get('energy_100g', 0) / 4.184 if nutriments.get('energy_100g') else 0),
                        'proteins_100g': nutriments.get('proteins_100g', 0),
                        'carbohydrates_100g': nutriments.get('carbohydrates_100g', 0),
                        'sugars_100g': nutriments.get('sugars_100g', 0),
                        'fat_100g': nutriments.get('fat_100g', 0),
                        'saturated-fat_100g': nutriments.get('saturated-fat_100g', 0),
                        'fiber_100g': nutriments.get('fiber_100g', 0),
                        'sodium_100g': nutriments.get('sodium_100g', 0),
                        'salt_100g': nutriments.get('salt_100g', 0),
                    },
                    'health_score': calculate_score(nutriments),
                }
                
                all_products.append(product)
        
        if len(all_products) >= 500:
            print(f"\n✅ Reached 500 products target!")
            break
    
    print(f"✅ Successfully loaded {len(all_products)} products")
    return all_products

def determine_category(product_name, categories):
    """Determine product category based on name or category string"""
    name_lower = product_name.lower()
    cat_lower = categories.lower() if categories else ""
    combined = f"{name_lower} {cat_lower}"
    
    # Check for category keywords
    if any(x in combined for x in ['soft drink', 'soda', 'cola', 'pepsi', 'sprite', 'fanta', 'coke', 'beverage', 'juice', 'drink', 'lemonade']):
        return 'Soft Drinks'
    elif any(x in combined for x in ['noodle', 'ramen', 'maggi', 'instant', 'yippee', 'samyang']):
        return 'Instant Noodles'
    elif any(x in combined for x in ['ketchup', 'sauce', 'chutney', 'condiment', 'soy sauce']):
        return 'Sauces & Condiments'
    elif any(x in combined for x in ['atta', 'flour', 'wheat', 'maida', 'semolina']):
        return 'Atta/Flour'
    elif any(x in combined for x in ['oil', 'ghee', 'cooking oil', 'vegetable oil']):
        return 'Cooking Oils'
    elif any(x in combined for x in ['milk', 'cheese', 'lassi', 'yogurt', 'paneer', 'dairy', 'amul', 'butter', 'cream']):
        return 'Dairy'
    elif any(x in combined for x in ['chocolate', 'cadbury', 'kitkat', 'munch', 'cocoa', 'candy']):
        return 'Chocolates'
    elif any(x in combined for x in ['pasta', 'macaroni', 'spaghetti', 'penne', 'farfalle']):
        return 'Pasta'
    elif any(x in combined for x in ['biscuit', 'cookie', 'kracker', 'cracker']):
        return 'Biscuits'
    elif any(x in combined for x in ['chip', 'crisp', 'snack', 'lays', 'kurkure', 'doritos', 'wafer']):
        return 'Chips & Snacks'
    elif any(x in combined for x in ['cereal', 'corn flakes', 'muesli', 'oat', 'breakfast', 'granola']):
        return 'Breakfast Foods'
    else:
        return 'Other'

def calculate_score(nutriments):
    """Calculate health score (0-100) based on nutrients"""
    score = 100
    
    # Sugar penalty
    sugars = nutriments.get('sugars_100g', 0)
    if sugars > 20:
        score -= 25
    elif sugars > 10:
        score -= 15
    elif sugars > 5:
        score -= 5
    elif sugars <= 2:
        score += 5
    
    # Sodium penalty
    sodium = nutriments.get('sodium_100g', 0) * 1000 if nutriments.get('sodium_100g') else (nutriments.get('salt_100g', 0) * 400 if nutriments.get('salt_100g') else 0)
    if sodium > 800:
        score -= 20
    elif sodium > 400:
        score -= 10
    
    # Saturated fat penalty
    sat_fat = nutriments.get('saturated-fat_100g', 0)
    if sat_fat > 10:
        score -= 20
    elif sat_fat > 5:
        score -= 10
    
    # Fiber bonus
    fiber = nutriments.get('fiber_100g', 0)
    if fiber > 6:
        score += 15
    elif fiber > 3:
        score += 8
    
    # Protein bonus
    protein = nutriments.get('proteins_100g', 0)
    if protein > 15:
        score += 10
    elif protein > 8:
        score += 5
    
    # Calorie density penalty
    energy = nutriments.get('energy_kcal_100g', 0)
    if energy > 500:
        score -= 10
    
    return max(5, min(100, score))
