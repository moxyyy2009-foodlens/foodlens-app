from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from database import init_db, get_db_connection, check_products_exist
from routes import search_products, get_alternatives
from products_seed import get_products

load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize database
init_db()

# Seed products if needed
if not check_products_exist():
    print("\n🌱 Seeding products database...")
    from database import seed_products
    seed_products()
else:
    print("\n✅ Products already in database")

@app.route('/api/search', methods=['GET'])
def search():
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify({'error': 'Query required', 'products': []}), 400
    
    try:
        products = search_products(query)
        return jsonify({'products': products}), 200
    except Exception as e:
        return jsonify({'error': str(e), 'products': []}), 500

@app.route('/api/product/<int:product_id>', methods=['GET'])
def get_product(product_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('SELECT * FROM products WHERE id = %s', (product_id,))
        product = cur.fetchone()
        cur.close()
        conn.close()
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        return jsonify({
            'id': product[0],
            'name': product[1],
            'brand': product[2],
            'category': product[3],
            'image_url': product[4],
            'ingredients': product[5],
            'nutriments': product[6] if product[6] else {},
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/alternatives/<category>', methods=['GET'])
def alternatives(category):
    try:
        alternatives_list = get_alternatives(category)
        return jsonify({'alternatives': alternatives_list}), 200
    except Exception as e:
        return jsonify({'error': str(e), 'alternatives': []}), 500

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'message': 'FoodLens API is running'}), 200

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
