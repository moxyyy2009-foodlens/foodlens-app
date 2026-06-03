import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv
import json

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/foodlens')

def get_db_connection():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        raise

def init_db():
    """Initialize database schema"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Create products table
        cur.execute('''
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                brand VARCHAR(255) NOT NULL,
                category VARCHAR(100) NOT NULL,
                image_url TEXT,
                ingredients TEXT,
                nutriments JSONB,
                health_score INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(name, brand)
            )
        ''')
        
        # Create index for faster searches
        cur.execute('''
            CREATE INDEX IF NOT EXISTS idx_product_name ON products (name);
            CREATE INDEX IF NOT EXISTS idx_product_brand ON products (brand);
            CREATE INDEX IF NOT EXISTS idx_product_category ON products (category);
        ''')
        
        conn.commit()
        cur.close()
        conn.close()
        print("✅ Database initialized successfully")
    except Exception as e:
        print(f"❌ Database initialization error: {e}")

def seed_products():
    """Load 500+ products into database"""
    from products_seed import get_products
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        products = get_products()
        inserted = 0
        
        for product in products:
            try:
                cur.execute('''
                    INSERT INTO products (name, brand, category, image_url, ingredients, nutriments, health_score)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (name, brand) DO NOTHING
                ''', (
                    product.get('name'),
                    product.get('brand'),
                    product.get('category'),
                    product.get('image_url'),
                    product.get('ingredients'),
                    json.dumps(product.get('nutriments', {})),
                    product.get('health_score', 50)
                ))
                inserted += 1
            except Exception as e:
                print(f"Error inserting product {product.get('name')}: {e}")
                continue
        
        conn.commit()
        cur.close()
        conn.close()
        
        print(f"✅ Seeded {inserted} products into database")
    except Exception as e:
        print(f"❌ Error seeding products: {e}")

def check_products_exist():
    """Check if products already exist in database"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('SELECT COUNT(*) FROM products')
        count = cur.fetchone()[0]
        cur.close()
        conn.close()
        return count > 0
    except:
        return False
