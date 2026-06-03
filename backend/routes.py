import psycopg2
from psycopg2.extras import RealDictCursor
from database import get_db_connection
import json

def search_products(query):
    """Search products by name or brand"""
    try:
        conn = get_db_connection()
        cur = conn.cursor(RealDictCursor)
        
        search_term = f"%{query}%"
        
        cur.execute('''
            SELECT id, name, brand, category, image_url, ingredients, nutriments, health_score
            FROM products
            WHERE name ILIKE %s OR brand ILIKE %s OR category ILIKE %s
            ORDER BY health_score DESC
            LIMIT 20
        ''', (search_term, search_term, search_term))
        
        results = cur.fetchall()
        cur.close()
        conn.close()
        
        products = []
        for row in results:
            products.append({
                'id': row['id'],
                'product_name': row['name'],
                'name': row['name'],
                'brand': row['brand'],
                'brands': row['brand'],
                'category': row['category'],
                'image_url': row['image_url'],
                'ingredients': row['ingredients'],
                'ingredients_text': row['ingredients'],
                'nutriments': row['nutriments'] if isinstance(row['nutriments'], dict) else json.loads(row['nutriments'] or '{}'),
                'health_score': row['health_score'],
            })
        
        return products
    except Exception as e:
        print(f"Search error: {e}")
        return []

def get_alternatives(category):
    """Get healthier alternative products in same category"""
    try:
        conn = get_db_connection()
        cur = conn.cursor(RealDictCursor)
        
        cur.execute('''
            SELECT id, name, brand, image_url, health_score
            FROM products
            WHERE category = %s
            ORDER BY health_score DESC
            LIMIT 10
        ''', (category,))
        
        results = cur.fetchall()
        cur.close()
        conn.close()
        
        return [{
            'id': row['id'],
            'name': row['name'],
            'brand': row['brand'],
            'image_url': row['image_url'],
            'score': row['health_score']
        } for row in results]
    except Exception as e:
        print(f"Alternatives error: {e}")
        return []
