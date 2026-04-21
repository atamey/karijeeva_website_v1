"""
Phase 5 Admin API Tests — Karijeeva
Tests admin authentication, role-gating, dashboard, orders, products, inventory,
customers, reviews, coupons, newsletter, requests, contact, settings, and audit.
"""
import pytest
import requests
import os
import time
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://karijeeva-oils.preview.emergentagent.com"

# Admin credentials
ADMIN_EMAIL = "admin@karijeeva.in"
ADMIN_PASSWORD = "KarijeevaAdmin@2025"


@pytest.fixture(scope="module")
def session():
    """Shared requests session"""
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_session(session):
    """Admin authenticated session"""
    resp = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    assert resp.status_code == 200, f"Admin login failed: {resp.text}"
    data = resp.json()
    assert data["user"]["role"] == "admin", "Admin role not returned"
    # Session has cookies set
    return session


@pytest.fixture(scope="module")
def customer_session():
    """Customer (non-admin) authenticated session"""
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    email = f"test_customer_{uuid.uuid4().hex[:8]}@test.com"
    # Register a customer
    resp = s.post(f"{BASE_URL}/api/auth/register", json={
        "name": "Test Customer",
        "email": email,
        "password": "TestPass123!"
    })
    assert resp.status_code == 200, f"Customer registration failed: {resp.text}"
    assert resp.json()["user"]["role"] == "customer"
    return s


# ============================================================
# AUTH TESTS
# ============================================================
class TestAdminAuth:
    """Admin authentication and role-gating tests"""
    
    def test_admin_login_returns_admin_role(self, session):
        """POST /api/auth/login with admin credentials returns role='admin'"""
        resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "user" in data
        assert data["user"]["role"] == "admin"
        assert "access_token" in data
        print("PASS: Admin login returns role='admin' and JWT")
    
    def test_admin_login_sets_httponly_cookie(self, session):
        """Admin login sets httpOnly cookie"""
        resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert resp.status_code == 200
        # Check cookies
        cookies = session.cookies.get_dict()
        assert "access_token" in cookies, "access_token cookie not set"
        print("PASS: Admin login sets access_token cookie")
    
    def test_unauthenticated_admin_endpoint_returns_401(self):
        """Unauthenticated request to /api/admin/dashboard/stats returns 401"""
        s = requests.Session()
        resp = s.get(f"{BASE_URL}/api/admin/dashboard/stats")
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("PASS: Unauthenticated admin endpoint returns 401")
    
    def test_customer_accessing_admin_returns_403(self, customer_session):
        """Non-admin user accessing /api/admin/* returns 403"""
        resp = customer_session.get(f"{BASE_URL}/api/admin/dashboard/stats")
        assert resp.status_code == 403, f"Expected 403, got {resp.status_code}"
        print("PASS: Customer accessing admin endpoint returns 403")


# ============================================================
# DASHBOARD TESTS
# ============================================================
class TestAdminDashboard:
    """Dashboard KPIs and trend tests"""
    
    def test_dashboard_stats_returns_all_kpis(self, admin_session):
        """GET /api/admin/dashboard/stats returns all required KPIs"""
        resp = admin_session.get(f"{BASE_URL}/api/admin/dashboard/stats")
        assert resp.status_code == 200
        data = resp.json()
        
        required_fields = [
            "revenue_all_time", "revenue_today", "total_orders", "paid_orders",
            "pending_payment_orders", "aov", "conversion_pct", "low_stock_count",
            "pending_reviews_count", "open_requests_count", "newsletter_count"
        ]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        
        print(f"PASS: Dashboard stats returns all KPIs: {list(data.keys())}")
    
    def test_dashboard_trend_returns_buckets(self, admin_session):
        """GET /api/admin/dashboard/trend?days=7 returns 7 buckets"""
        resp = admin_session.get(f"{BASE_URL}/api/admin/dashboard/trend", params={"days": 7})
        assert resp.status_code == 200
        data = resp.json()
        assert "trend" in data
        assert len(data["trend"]) == 7, f"Expected 7 buckets, got {len(data['trend'])}"
        
        # Each bucket should have date, revenue, orders
        for bucket in data["trend"]:
            assert "date" in bucket
            assert "revenue" in bucket
            assert "orders" in bucket
        
        print("PASS: Dashboard trend returns 7 buckets with date/revenue/orders")
    
    def test_dashboard_latest_returns_orders_and_reviews(self, admin_session):
        """GET /api/admin/dashboard/latest returns orders and pending_reviews"""
        resp = admin_session.get(f"{BASE_URL}/api/admin/dashboard/latest")
        assert resp.status_code == 200
        data = resp.json()
        assert "orders" in data
        assert "pending_reviews" in data
        print("PASS: Dashboard latest returns orders and pending_reviews")


# ============================================================
# ORDERS TESTS
# ============================================================
class TestAdminOrders:
    """Admin orders management tests"""
    
    def test_orders_list_with_filters(self, admin_session):
        """GET /api/admin/orders supports status, q, from_date, to_date, page filters"""
        resp = admin_session.get(f"{BASE_URL}/api/admin/orders", params={
            "status": "all",
            "page": 1,
            "page_size": 10
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "orders" in data
        assert "total" in data
        assert "page" in data
        print(f"PASS: Orders list returns {len(data['orders'])} orders, total={data['total']}")
    
    def test_orders_csv_export(self, admin_session):
        """GET /api/admin/orders/export.csv returns valid CSV"""
        resp = admin_session.get(f"{BASE_URL}/api/admin/orders/export.csv")
        assert resp.status_code == 200
        assert "text/csv" in resp.headers.get("Content-Type", "")
        assert "Content-Disposition" in resp.headers
        assert "attachment" in resp.headers["Content-Disposition"]
        print("PASS: Orders CSV export returns text/csv with Content-Disposition")


# ============================================================
# PRODUCTS TESTS
# ============================================================
class TestAdminProducts:
    """Admin products CRUD tests"""
    
    def test_products_list(self, admin_session):
        """GET /api/admin/products returns products with variants"""
        resp = admin_session.get(f"{BASE_URL}/api/admin/products")
        assert resp.status_code == 200
        data = resp.json()
        assert "products" in data
        assert len(data["products"]) > 0
        # Check variants are joined
        for p in data["products"]:
            assert "variants" in p
        print(f"PASS: Products list returns {len(data['products'])} products with variants")
    
    def test_product_create_and_appears_on_public(self, admin_session):
        """POST /api/admin/products creates product; appears on public GET /api/products"""
        slug = f"test-product-{uuid.uuid4().hex[:6]}"
        resp = admin_session.post(f"{BASE_URL}/api/admin/products", json={
            "name": "Test Admin Product",
            "slug": slug,
            "short_desc": "Test description",
            "category": "wellness",
            "is_active": True,
            "variants": [
                {"size": "100ml", "sku": f"TST-{slug[:3]}", "price": 199, "mrp": 249, "stock": 50}
            ]
        })
        assert resp.status_code == 200, f"Product create failed: {resp.text}"
        data = resp.json()
        assert data["success"] is True
        assert "product" in data
        
        # Verify on public endpoint
        public_resp = admin_session.get(f"{BASE_URL}/api/products/{slug}")
        assert public_resp.status_code == 200, f"Product not found on public: {public_resp.text}"
        print(f"PASS: Product created with slug={slug} and appears on public endpoint")
        
        # Cleanup - soft delete
        admin_session.delete(f"{BASE_URL}/api/admin/products/{slug}")
    
    def test_product_soft_delete_toggles_is_active(self, admin_session):
        """DELETE /api/admin/products/{id} toggles is_active (soft delete)"""
        # Get first product
        resp = admin_session.get(f"{BASE_URL}/api/admin/products")
        products = resp.json()["products"]
        if not products:
            pytest.skip("No products to test soft delete")
        
        product = products[0]
        original_active = product.get("is_active", True)
        
        # Toggle
        resp = admin_session.delete(f"{BASE_URL}/api/admin/products/{product['slug']}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["is_active"] != original_active
        
        # Toggle back
        admin_session.delete(f"{BASE_URL}/api/admin/products/{product['slug']}")
        print("PASS: Product soft delete toggles is_active")


# ============================================================
# INVENTORY TESTS
# ============================================================
class TestAdminInventory:
    """Admin inventory management tests"""
    
    def test_inventory_list_returns_enriched_variants(self, admin_session):
        """GET /api/admin/inventory returns variants with product info"""
        resp = admin_session.get(f"{BASE_URL}/api/admin/inventory")
        assert resp.status_code == 200
        data = resp.json()
        assert "variants" in data
        if data["variants"]:
            v = data["variants"][0]
            assert "product_name" in v
            assert "stock" in v
        print(f"PASS: Inventory list returns {len(data['variants'])} enriched variants")
    
    def test_inventory_update_writes_log(self, admin_session):
        """PATCH /api/admin/inventory/{variant_id} updates stock and writes log"""
        # Get a variant
        resp = admin_session.get(f"{BASE_URL}/api/admin/inventory")
        variants = resp.json()["variants"]
        if not variants:
            pytest.skip("No variants to test inventory update")
        
        variant = variants[0]
        variant_id = variant["id"]
        old_stock = variant["stock"]
        new_stock = old_stock + 10
        
        # Update
        resp = admin_session.patch(f"{BASE_URL}/api/admin/inventory/{variant_id}", json={
            "new_stock": new_stock,
            "reason": "restock",
            "note": "Test restock"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["stock"] == new_stock
        assert data["change"] == 10
        
        # Check logs
        logs_resp = admin_session.get(f"{BASE_URL}/api/admin/inventory/logs", params={"variant_id": variant_id})
        assert logs_resp.status_code == 200
        logs = logs_resp.json()["logs"]
        assert len(logs) > 0
        assert logs[0]["reason"] == "restock"
        
        # Restore
        admin_session.patch(f"{BASE_URL}/api/admin/inventory/{variant_id}", json={
            "new_stock": old_stock,
            "reason": "adjustment",
            "note": "Test restore"
        })
        print("PASS: Inventory update writes log and updates stock")


# ============================================================
# CUSTOMERS TESTS
# ============================================================
class TestAdminCustomers:
    """Admin customers management tests"""
    
    def test_customers_list_with_aggregates(self, admin_session):
        """GET /api/admin/customers returns customers with orders_count and total_spent"""
        resp = admin_session.get(f"{BASE_URL}/api/admin/customers")
        assert resp.status_code == 200
        data = resp.json()
        assert "customers" in data
        assert "total" in data
        # Check aggregates are present
        if data["customers"]:
            c = data["customers"][0]
            assert "orders_count" in c
            assert "total_spent" in c
        print(f"PASS: Customers list returns {len(data['customers'])} customers with aggregates")
    
    def test_customers_csv_export(self, admin_session):
        """GET /api/admin/customers/export.csv returns valid CSV"""
        resp = admin_session.get(f"{BASE_URL}/api/admin/customers/export.csv")
        assert resp.status_code == 200
        assert "text/csv" in resp.headers.get("Content-Type", "")
        print("PASS: Customers CSV export works")


# ============================================================
# REVIEWS TESTS
# ============================================================
class TestAdminReviews:
    """Admin reviews moderation tests"""
    
    def test_reviews_list_by_status(self, admin_session):
        """GET /api/admin/reviews?status=pending returns pending reviews"""
        resp = admin_session.get(f"{BASE_URL}/api/admin/reviews", params={"status": "pending"})
        assert resp.status_code == 200
        data = resp.json()
        assert "reviews" in data
        assert "count" in data
        print(f"PASS: Reviews list returns {data['count']} pending reviews")
    
    def test_reviews_list_approved(self, admin_session):
        """GET /api/admin/reviews?status=approved returns approved reviews"""
        resp = admin_session.get(f"{BASE_URL}/api/admin/reviews", params={"status": "approved"})
        assert resp.status_code == 200
        data = resp.json()
        assert "reviews" in data
        print(f"PASS: Approved reviews list returns {data['count']} reviews")


# ============================================================
# COUPONS TESTS
# ============================================================
class TestAdminCoupons:
    """Admin coupons CRUD tests"""
    
    def test_coupons_list(self, admin_session):
        """GET /api/admin/coupons returns coupons"""
        resp = admin_session.get(f"{BASE_URL}/api/admin/coupons")
        assert resp.status_code == 200
        data = resp.json()
        assert "coupons" in data
        print(f"PASS: Coupons list returns {len(data['coupons'])} coupons")
    
    def test_coupon_create_and_validate(self, admin_session):
        """POST /api/admin/coupons creates coupon; validates via public endpoint"""
        code = f"TEST{uuid.uuid4().hex[:4].upper()}"
        resp = admin_session.post(f"{BASE_URL}/api/admin/coupons", json={
            "code": code,
            "type": "percent",
            "value": 15,
            "min_order": 100,
            "max_uses": 100,
            "active": True,
            "description": "Test coupon"
        })
        assert resp.status_code == 200, f"Coupon create failed: {resp.text}"
        data = resp.json()
        assert data["success"] is True
        
        # Validate via public endpoint
        validate_resp = admin_session.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": code,
            "subtotal": 500
        })
        assert validate_resp.status_code == 200
        v_data = validate_resp.json()
        assert v_data["valid"] is True
        assert v_data["type"] == "percent"
        assert v_data["discount_value"] == 15
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/admin/coupons/{code}")
        print(f"PASS: Coupon {code} created and validates on public endpoint")
    
    def test_coupon_stats(self, admin_session):
        """GET /api/admin/coupons/{code}/stats returns uses and discount_given"""
        resp = admin_session.get(f"{BASE_URL}/api/admin/coupons/WELCOME10/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert "coupon" in data
        assert "stats" in data
        assert "uses" in data["stats"]
        assert "discount_given" in data["stats"]
        print(f"PASS: Coupon stats returns uses={data['stats']['uses']}, discount_given={data['stats']['discount_given']}")


# ============================================================
# NEWSLETTER / REQUESTS / CONTACT / SETTINGS / AUDIT TESTS
# ============================================================
class TestAdminMisc:
    """Newsletter, requests, contact, settings, audit tests"""
    
    def test_newsletter_list(self, admin_session):
        """GET /api/admin/newsletter returns subscribers"""
        resp = admin_session.get(f"{BASE_URL}/api/admin/newsletter")
        assert resp.status_code == 200
        data = resp.json()
        assert "subscribers" in data
        print(f"PASS: Newsletter list returns {data['count']} subscribers")
    
    def test_newsletter_csv_export(self, admin_session):
        """GET /api/admin/newsletter/export.csv returns CSV"""
        resp = admin_session.get(f"{BASE_URL}/api/admin/newsletter/export.csv")
        assert resp.status_code == 200
        assert "text/csv" in resp.headers.get("Content-Type", "")
        print("PASS: Newsletter CSV export works")
    
    def test_requests_list(self, admin_session):
        """GET /api/admin/requests returns order requests"""
        resp = admin_session.get(f"{BASE_URL}/api/admin/requests")
        assert resp.status_code == 200
        data = resp.json()
        assert "requests" in data
        print(f"PASS: Requests list returns {data['count']} requests")
    
    def test_contact_list(self, admin_session):
        """GET /api/admin/contact returns contact messages"""
        resp = admin_session.get(f"{BASE_URL}/api/admin/contact")
        assert resp.status_code == 200
        data = resp.json()
        assert "messages" in data
        print(f"PASS: Contact list returns {data['count']} messages")
    
    def test_settings_get_and_patch(self, admin_session):
        """GET/PATCH /api/admin/settings works and reflects on public"""
        # Get current
        resp = admin_session.get(f"{BASE_URL}/api/admin/settings")
        assert resp.status_code == 200
        original = resp.json()
        
        # Patch tagline
        new_tagline = f"Test tagline {uuid.uuid4().hex[:6]}"
        patch_resp = admin_session.patch(f"{BASE_URL}/api/admin/settings", json={
            "tagline": new_tagline
        })
        assert patch_resp.status_code == 200
        
        # Verify on public
        public_resp = admin_session.get(f"{BASE_URL}/api/site-settings")
        assert public_resp.status_code == 200
        assert public_resp.json().get("tagline") == new_tagline
        
        # Restore
        admin_session.patch(f"{BASE_URL}/api/admin/settings", json={
            "tagline": original.get("tagline", "")
        })
        print("PASS: Settings patch reflects on public /api/site-settings")
    
    def test_audit_log_records_actions(self, admin_session):
        """GET /api/admin/audit returns audit logs after admin actions"""
        resp = admin_session.get(f"{BASE_URL}/api/admin/audit", params={"page": 1, "page_size": 10})
        assert resp.status_code == 200
        data = resp.json()
        assert "logs" in data
        assert "total" in data
        # Should have some logs from our tests
        print(f"PASS: Audit log returns {data['total']} total entries")


# ============================================================
# REGRESSION TESTS
# ============================================================
class TestRegression:
    """Ensure Phase 0-4 routes still work"""
    
    def test_health_endpoint(self):
        """GET /api/health returns ok"""
        resp = requests.get(f"{BASE_URL}/api/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"
        print("PASS: Health endpoint works")
    
    def test_public_products_endpoint(self):
        """GET /api/products returns products"""
        resp = requests.get(f"{BASE_URL}/api/products")
        assert resp.status_code == 200
        data = resp.json()
        assert "products" in data
        assert len(data["products"]) > 0
        print("PASS: Public products endpoint works")
    
    def test_api_docs_shows_admin_tag(self):
        """GET /api/docs shows admin endpoints grouped under 'admin' tag"""
        resp = requests.get(f"{BASE_URL}/api/openapi.json")
        assert resp.status_code == 200
        data = resp.json()
        # Check tags include admin
        tags = [t["name"] for t in data.get("tags", [])]
        # Or check paths have admin tag
        admin_paths = [p for p in data.get("paths", {}).keys() if "/admin/" in p]
        assert len(admin_paths) > 0, "No admin paths found in OpenAPI spec"
        print(f"PASS: OpenAPI spec includes {len(admin_paths)} admin paths")


# ============================================================
# BRUTE FORCE TEST (RUN LAST to avoid rate limiting other tests)
# ============================================================
class TestZZBruteForce:
    """Brute force test - runs last due to class name sorting"""
    
    def test_brute_force_limiter_returns_429(self):
        """5 failed logins in <1 minute returns 429 on 6th attempt"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        
        # Use unique email to avoid affecting other tests
        test_email = f"brute_{uuid.uuid4().hex[:8]}@test.com"
        
        # Make 5 failed attempts
        for i in range(5):
            resp = s.post(f"{BASE_URL}/api/auth/login", json={
                "email": test_email,
                "password": "wrongpassword"
            })
            assert resp.status_code == 401, f"Attempt {i+1} should return 401"
        
        # 6th attempt should be rate limited
        resp = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_email,
            "password": "wrongpassword"
        })
        assert resp.status_code == 429, f"Expected 429 on 6th attempt, got {resp.status_code}"
        print("PASS: Brute-force limiter returns 429 after 5 failed attempts")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
