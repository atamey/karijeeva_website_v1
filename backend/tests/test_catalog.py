"""
Phase 2 Catalog / Content / Contact / SEO Tests for Karijeeva
Tests: Products, Recipes, Blog, Testimonials, FAQs, Site Settings, Contact, Newsletter, Sitemap, Robots
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestProductsEndpoint:
    """GET /api/products tests"""
    
    def test_products_returns_3_products(self):
        """GET /api/products returns 3 products with variants and price_range"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("count") == 3, f"Expected 3 products, got {data.get('count')}"
        
        # Verify expected slugs
        slugs = [p["slug"] for p in data["products"]]
        assert "virgin-cold-pressed-coconut-oil" in slugs
        assert "wood-pressed-coconut-oil" in slugs
        assert "cooking-coconut-oil-family-pack" in slugs
        
        # Verify each product has 3 variants and price_range
        for p in data["products"]:
            assert len(p.get("variants", [])) == 3, f"Product {p['slug']} should have 3 variants"
            assert "price_range" in p, f"Product {p['slug']} missing price_range"
            assert "min" in p["price_range"] and "max" in p["price_range"]
    
    def test_products_filter_by_category_culinary(self):
        """GET /api/products?category=culinary filters correctly"""
        response = requests.get(f"{BASE_URL}/api/products?category=culinary")
        assert response.status_code == 200
        data = response.json()
        assert data.get("count") == 1, f"Expected 1 culinary product, got {data.get('count')}"
        assert data["products"][0]["slug"] == "cooking-coconut-oil-family-pack"
    
    def test_products_sort_by_rating(self):
        """GET /api/products?sort=rating returns products sorted by rating desc"""
        response = requests.get(f"{BASE_URL}/api/products?sort=rating")
        assert response.status_code == 200
        data = response.json()
        ratings = [p.get("avg_rating", 0) for p in data["products"]]
        assert ratings == sorted(ratings, reverse=True), "Products not sorted by rating desc"
    
    def test_products_sort_by_price_asc(self):
        """GET /api/products?sort=price-asc returns products sorted by min price asc"""
        response = requests.get(f"{BASE_URL}/api/products?sort=price-asc")
        assert response.status_code == 200
        data = response.json()
        prices = [p.get("price_range", {}).get("min", 0) for p in data["products"]]
        assert prices == sorted(prices), "Products not sorted by price asc"
    
    def test_products_sort_by_price_desc(self):
        """GET /api/products?sort=price-desc returns products sorted by max price desc"""
        response = requests.get(f"{BASE_URL}/api/products?sort=price-desc")
        assert response.status_code == 200
        data = response.json()
        prices = [p.get("price_range", {}).get("max", 0) for p in data["products"]]
        assert prices == sorted(prices, reverse=True), "Products not sorted by price desc"


class TestProductDetailEndpoint:
    """GET /api/products/{slug} tests"""
    
    def test_product_detail_returns_full_data(self):
        """GET /api/products/virgin-cold-pressed-coconut-oil returns full product data"""
        response = requests.get(f"{BASE_URL}/api/products/virgin-cold-pressed-coconut-oil")
        assert response.status_code == 200
        data = response.json()
        
        # Verify variants
        assert len(data.get("variants", [])) == 3, "Expected 3 variants"
        sizes = [v["size"] for v in data["variants"]]
        assert "250ml" in sizes and "500ml" in sizes and "1000ml" in sizes
        
        # Verify pairs_with_recipes
        assert len(data.get("pairs_with_recipes", [])) == 3, "Expected 3 pairs_with_recipes"
        
        # Verify related_faqs
        assert len(data.get("related_faqs", [])) > 0, "Expected related_faqs"
        
        # Verify gallery
        assert len(data.get("gallery", [])) == 4, "Expected 4 gallery images"
    
    def test_product_detail_not_found(self):
        """GET /api/products/nonexistent returns 404"""
        response = requests.get(f"{BASE_URL}/api/products/nonexistent-product")
        assert response.status_code == 404


class TestRecipesEndpoint:
    """GET /api/recipes tests"""
    
    def test_recipes_returns_6_recipes(self):
        """GET /api/recipes returns 6 recipes"""
        response = requests.get(f"{BASE_URL}/api/recipes")
        assert response.status_code == 200
        data = response.json()
        assert data.get("count") == 6, f"Expected 6 recipes, got {data.get('count')}"
    
    def test_recipe_detail_with_pairs_with_product(self):
        """GET /api/recipes/dosa-coconut-drizzle returns with pairs_with_product"""
        response = requests.get(f"{BASE_URL}/api/recipes/dosa-coconut-drizzle")
        assert response.status_code == 200
        data = response.json()
        
        assert "pairs_with_product" in data, "Missing pairs_with_product"
        assert data["pairs_with_product"]["slug"] == "virgin-cold-pressed-coconut-oil"
    
    def test_recipe_detail_not_found(self):
        """GET /api/recipes/nonexistent returns 404"""
        response = requests.get(f"{BASE_URL}/api/recipes/nonexistent-recipe")
        assert response.status_code == 404


class TestBlogEndpoint:
    """GET /api/blog tests"""
    
    def test_blog_returns_5_posts(self):
        """GET /api/blog returns 5 posts"""
        response = requests.get(f"{BASE_URL}/api/blog")
        assert response.status_code == 200
        data = response.json()
        assert data.get("count") == 5, f"Expected 5 posts, got {data.get('count')}"
        
        # Verify word_count is populated
        for post in data["posts"]:
            assert "word_count" in post, f"Post {post['slug']} missing word_count"
    
    def test_blog_detail_with_content_and_related(self):
        """GET /api/blog/7-ways-to-use-coconut-oil-in-indian-cooking returns full data"""
        response = requests.get(f"{BASE_URL}/api/blog/7-ways-to-use-coconut-oil-in-indian-cooking")
        assert response.status_code == 200
        data = response.json()
        
        assert "content_md" in data, "Missing content_md"
        assert len(data["content_md"]) > 100, "content_md too short"
        assert "word_count" in data, "Missing word_count"
        assert "related" in data, "Missing related posts"
    
    def test_blog_detail_not_found(self):
        """GET /api/blog/nonexistent returns 404"""
        response = requests.get(f"{BASE_URL}/api/blog/nonexistent-post")
        assert response.status_code == 404


class TestTestimonialsEndpoint:
    """GET /api/testimonials tests"""
    
    def test_testimonials_returns_6_items(self):
        """GET /api/testimonials returns 6 testimonials"""
        response = requests.get(f"{BASE_URL}/api/testimonials")
        assert response.status_code == 200
        data = response.json()
        assert data.get("count") == 6, f"Expected 6 testimonials, got {data.get('count')}"


class TestFaqsEndpoint:
    """GET /api/faqs tests"""
    
    def test_faqs_returns_10_items(self):
        """GET /api/faqs returns 10 FAQs"""
        response = requests.get(f"{BASE_URL}/api/faqs")
        assert response.status_code == 200
        data = response.json()
        assert data.get("count") == 10, f"Expected 10 FAQs, got {data.get('count')}"
    
    def test_faqs_filter_by_category(self):
        """GET /api/faqs?category=product filters correctly"""
        response = requests.get(f"{BASE_URL}/api/faqs?category=product")
        assert response.status_code == 200
        data = response.json()
        assert data.get("count") > 0, "Expected some product FAQs"
        for faq in data["faqs"]:
            assert faq.get("category") == "product"


class TestSiteSettingsEndpoint:
    """GET /api/site-settings tests"""
    
    def test_site_settings_returns_required_fields(self):
        """GET /api/site-settings returns hero, tagline, vision_statement"""
        response = requests.get(f"{BASE_URL}/api/site-settings")
        assert response.status_code == 200
        data = response.json()
        
        assert "hero_headline" in data, "Missing hero_headline"
        assert "tagline" in data, "Missing tagline"
        assert "vision_statement" in data, "Missing vision_statement"
        assert len(data["vision_statement"]) > 50, "vision_statement too short"


class TestNewsletterEndpoint:
    """POST /api/newsletter/subscribe tests"""
    
    def test_newsletter_new_email_returns_welcome_code(self):
        """POST /api/newsletter/subscribe with fresh email returns welcome_code WELCOME10"""
        unique_email = f"test_phase2_{uuid.uuid4().hex[:8]}@example.com"
        response = requests.post(
            f"{BASE_URL}/api/newsletter/subscribe",
            json={"email": unique_email}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        assert data.get("welcome_code") == "WELCOME10", f"Expected WELCOME10, got {data.get('welcome_code')}"
        assert "discount_desc" in data
    
    def test_newsletter_existing_email_returns_already_subscribed(self):
        """POST /api/newsletter/subscribe with existing email returns already_subscribed"""
        unique_email = f"test_existing_{uuid.uuid4().hex[:8]}@example.com"
        
        # First subscription
        requests.post(f"{BASE_URL}/api/newsletter/subscribe", json={"email": unique_email})
        
        # Second subscription
        response = requests.post(
            f"{BASE_URL}/api/newsletter/subscribe",
            json={"email": unique_email}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        assert data.get("already_subscribed") == True
    
    def test_newsletter_invalid_email_returns_422(self):
        """POST /api/newsletter/subscribe with invalid email returns 422"""
        response = requests.post(
            f"{BASE_URL}/api/newsletter/subscribe",
            json={"email": "invalid-email"}
        )
        assert response.status_code == 422


class TestContactEndpoint:
    """POST /api/contact tests"""
    
    def test_contact_valid_submission_returns_success(self):
        """POST /api/contact with valid body returns success and id"""
        response = requests.post(
            f"{BASE_URL}/api/contact",
            json={
                "name": "Test User",
                "email": "test@example.com",
                "message": "Test message from Phase 2 testing"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        assert "id" in data, "Missing id in response"
    
    def test_contact_missing_fields_returns_422(self):
        """POST /api/contact with missing required fields returns 422"""
        response = requests.post(
            f"{BASE_URL}/api/contact",
            json={"name": "Test User"}  # Missing email and message
        )
        assert response.status_code == 422


class TestSeoEndpoints:
    """GET /api/sitemap.xml and /api/robots.txt tests"""
    
    def test_sitemap_returns_xml_with_urls(self):
        """GET /api/sitemap.xml returns application/xml with product/blog/recipe URLs"""
        response = requests.get(f"{BASE_URL}/api/sitemap.xml")
        assert response.status_code == 200
        assert "application/xml" in response.headers.get("content-type", "")
        
        content = response.text
        assert "<?xml" in content
        assert "<urlset" in content
        
        # Check for product URLs
        assert "/products/virgin-cold-pressed-coconut-oil" in content
        
        # Check for blog URLs
        assert "/blog/7-ways-to-use-coconut-oil-in-indian-cooking" in content
        
        # Check for recipe URLs
        assert "/recipes/dosa-coconut-drizzle" in content
        
        # Check for static pages
        assert "/about" in content
        assert "/contact" in content
        assert "/cold-pressed-coconut-oil-benefits" in content
    
    def test_robots_returns_text_with_sitemap(self):
        """GET /api/robots.txt returns text/plain mentioning Sitemap"""
        response = requests.get(f"{BASE_URL}/api/robots.txt")
        assert response.status_code == 200
        assert "text/plain" in response.headers.get("content-type", "")
        
        content = response.text
        assert "User-agent:" in content
        assert "Sitemap:" in content
        assert "/api/sitemap.xml" in content


class TestPhase0Regression:
    """Phase 0 Razorpay regression tests"""
    
    def test_create_order_still_works(self):
        """POST /api/payments/create-order still works"""
        response = requests.post(
            f"{BASE_URL}/api/payments/create-order",
            json={"amount_inr": 1}
        )
        assert response.status_code == 200
        data = response.json()
        assert "order_id" in data
        assert data["order_id"].startswith("order_")
    
    def test_verify_tampered_signature_still_400(self):
        """POST /api/payments/verify with tampered signature still returns 400"""
        # Create order first
        create_response = requests.post(
            f"{BASE_URL}/api/payments/create-order",
            json={"amount_inr": 1}
        )
        order_id = create_response.json().get("order_id")
        
        # Verify with tampered signature
        verify_response = requests.post(
            f"{BASE_URL}/api/payments/verify",
            json={
                "razorpay_order_id": order_id,
                "razorpay_payment_id": "pay_fake_123",
                "razorpay_signature": "tampered_signature"
            }
        )
        assert verify_response.status_code == 400


class TestPhase1Regression:
    """Phase 1 regression tests"""
    
    def test_health_still_200(self):
        """GET /api/health still returns 200"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        assert response.json().get("status") == "ok"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
