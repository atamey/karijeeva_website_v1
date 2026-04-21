"""
Phase 6 — Launch Readiness Tests
Tests: Seed integrity, Refund API, Webhook, Security headers, Error envelope, Client errors, 404 page
"""
import pytest
import requests
import os
import hmac
import hashlib
import json
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://karijeeva-oils.preview.emergentagent.com').rstrip('/')
WEBHOOK_SECRET = "karijeeva_webhook_placeholder_2025"

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
    token = resp.json().get("access_token")
    admin_s = requests.Session()
    admin_s.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    })
    return admin_s


class TestSeedIntegrity:
    """Seed integrity: 40 reviews per product, idempotent, avg_rating matches actual"""

    def test_virgin_oil_has_40_reviews(self, session):
        """GET /api/products/virgin-cold-pressed-coconut-oil must return review_count == 40"""
        resp = session.get(f"{BASE_URL}/api/products/virgin-cold-pressed-coconut-oil")
        assert resp.status_code == 200
        data = resp.json()
        assert data["review_count"] == 40, f"Expected 40 reviews, got {data['review_count']}"
        assert len(data.get("reviews", [])) >= 40, f"Expected at least 40 reviews in response"

    def test_virgin_oil_avg_rating_in_range(self, session):
        """avg_rating should be between 4.3 and 4.9"""
        resp = session.get(f"{BASE_URL}/api/products/virgin-cold-pressed-coconut-oil")
        assert resp.status_code == 200
        data = resp.json()
        avg = data.get("avg_rating", 0)
        assert 4.3 <= avg <= 4.9, f"avg_rating {avg} not in expected range 4.3-4.9"

    def test_reviews_have_varied_names(self, session):
        """Reviews should have varied reviewer names (not just 'Meera P.' etc)"""
        resp = session.get(f"{BASE_URL}/api/products/virgin-cold-pressed-coconut-oil")
        assert resp.status_code == 200
        data = resp.json()
        reviews = data.get("reviews", [])
        names = set(r.get("user_name") for r in reviews)
        # Should have at least 20 unique names out of 40 reviews
        assert len(names) >= 20, f"Expected at least 20 unique names, got {len(names)}"

    def test_reviews_are_verified_buyers(self, session):
        """All seeded reviews should be verified buyers and approved"""
        resp = session.get(f"{BASE_URL}/api/products/virgin-cold-pressed-coconut-oil")
        assert resp.status_code == 200
        data = resp.json()
        reviews = data.get("reviews", [])
        for r in reviews:
            assert r.get("is_verified_buyer") == True, f"Review {r.get('id')} not verified buyer"
            assert r.get("is_approved") == True, f"Review {r.get('id')} not approved"

    def test_all_products_have_40_reviews(self, session):
        """All 3 products should have 40 reviews each = 120 total"""
        slugs = [
            "virgin-cold-pressed-coconut-oil",
            "wood-pressed-coconut-oil",
            "cooking-coconut-oil-family-pack"
        ]
        total = 0
        for slug in slugs:
            resp = session.get(f"{BASE_URL}/api/products/{slug}")
            assert resp.status_code == 200
            data = resp.json()
            assert data["review_count"] == 40, f"{slug} has {data['review_count']} reviews, expected 40"
            total += data["review_count"]
        assert total == 120, f"Total reviews {total}, expected 120"


class TestSecurityHeaders:
    """Security headers middleware verification"""

    def test_health_has_security_headers(self, session):
        """curl -I /api/health must include all security headers"""
        resp = session.get(f"{BASE_URL}/api/health")
        headers = resp.headers
        
        # Check Strict-Transport-Security
        assert "strict-transport-security" in headers, "Missing HSTS header"
        assert "max-age=" in headers["strict-transport-security"]
        
        # Check X-Content-Type-Options
        assert headers.get("x-content-type-options") == "nosniff", "Missing or wrong X-Content-Type-Options"
        
        # Check X-Frame-Options
        assert headers.get("x-frame-options") == "DENY", "Missing or wrong X-Frame-Options"
        
        # Check Referrer-Policy
        assert "referrer-policy" in headers, "Missing Referrer-Policy"
        
        # Check Permissions-Policy
        assert "permissions-policy" in headers, "Missing Permissions-Policy"
        
        # Check Content-Security-Policy
        assert "content-security-policy" in headers, "Missing CSP"

    def test_csp_allows_razorpay(self, session):
        """CSP must allow https://checkout.razorpay.com in script-src"""
        resp = session.get(f"{BASE_URL}/api/health")
        csp = resp.headers.get("content-security-policy", "")
        assert "checkout.razorpay.com" in csp, "CSP missing checkout.razorpay.com"
        assert "api.razorpay.com" in csp, "CSP missing api.razorpay.com"

    def test_csp_allows_google_fonts(self, session):
        """CSP must allow https://fonts.googleapis.com in style-src"""
        resp = session.get(f"{BASE_URL}/api/health")
        csp = resp.headers.get("content-security-policy", "")
        assert "fonts.googleapis.com" in csp, "CSP missing fonts.googleapis.com"
        assert "fonts.gstatic.com" in csp, "CSP missing fonts.gstatic.com"


class TestErrorEnvelope:
    """Error responses must have both legacy 'detail' and new 'error' envelope"""

    def test_404_has_both_detail_and_error(self, session):
        """404 response must have both detail and error keys"""
        resp = session.get(f"{BASE_URL}/api/products/nonexistent-product-slug-12345")
        assert resp.status_code == 404
        data = resp.json()
        assert "detail" in data, "Missing legacy 'detail' key"
        assert "error" in data, "Missing new 'error' envelope"
        assert "code" in data["error"], "error.code missing"
        assert "message" in data["error"], "error.message missing"

    def test_401_has_both_detail_and_error(self, session):
        """401 response must have both detail and error keys"""
        resp = session.get(f"{BASE_URL}/api/auth/me")
        assert resp.status_code == 401
        data = resp.json()
        assert "detail" in data, "Missing legacy 'detail' key"
        assert "error" in data, "Missing new 'error' envelope"

    def test_400_has_both_detail_and_error(self, session):
        """400 response must have both detail and error keys"""
        resp = session.post(f"{BASE_URL}/api/payments/webhook", 
                           json={"event": "test"},
                           headers={"x-razorpay-signature": "invalid"})
        assert resp.status_code == 400
        data = resp.json()
        assert "detail" in data, "Missing legacy 'detail' key"
        assert "error" in data, "Missing new 'error' envelope"


class TestClientErrors:
    """POST /api/errors/client endpoint"""

    def test_client_error_log_returns_ok(self, session):
        """POST /api/errors/client with valid payload returns {ok:true}"""
        resp = session.post(f"{BASE_URL}/api/errors/client", json={
            "message": "Test error from pytest",
            "stack": "Error: test\n  at test.js:1",
            "url": "https://test.com/page"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("ok") == True


class TestWebhook:
    """Razorpay webhook endpoint tests"""

    def test_webhook_invalid_signature_returns_400(self, session):
        """POST /api/payments/webhook without valid HMAC returns 400"""
        resp = session.post(f"{BASE_URL}/api/payments/webhook",
                           json={"event": "payment.captured"},
                           headers={"x-razorpay-signature": "invalid_signature"})
        assert resp.status_code == 400
        data = resp.json()
        assert "Invalid webhook signature" in data.get("detail", "")

    def test_webhook_valid_signature_returns_200(self, session):
        """POST /api/payments/webhook with valid HMAC returns 200"""
        payload = json.dumps({"event": "test.event", "payload": {}})
        sig = hmac.new(WEBHOOK_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
        
        resp = session.post(f"{BASE_URL}/api/payments/webhook",
                           data=payload,
                           headers={
                               "Content-Type": "application/json",
                               "x-razorpay-signature": sig
                           })
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("ok") == True
        assert data.get("event") == "test.event"


class TestRefundAPI:
    """Admin refund API tests"""

    def test_refund_without_auth_returns_401(self, session):
        """POST /api/admin/orders/{id}/refund without auth returns 401"""
        resp = session.post(f"{BASE_URL}/api/admin/orders/test-order-id/refund",
                           json={"amount_paise": 10000})
        assert resp.status_code == 401

    def test_refund_with_customer_returns_403(self, session):
        """POST /api/admin/orders/{id}/refund with customer auth returns 403"""
        # Register a customer
        email = f"test_customer_{uuid.uuid4().hex[:8]}@test.com"
        reg_resp = session.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Test Customer",
            "email": email,
            "password": "TestPass123!"
        })
        if reg_resp.status_code == 200:
            token = reg_resp.json().get("access_token")
            resp = session.post(f"{BASE_URL}/api/admin/orders/test-order-id/refund",
                               json={"amount_paise": 10000},
                               headers={"Authorization": f"Bearer {token}"})
            assert resp.status_code == 403

    def test_refund_nonexistent_order_returns_404(self, admin_session):
        """POST /api/admin/orders/{nonexistent}/refund returns 404"""
        resp = admin_session.post(f"{BASE_URL}/api/admin/orders/nonexistent-order-id/refund",
                                  json={"amount_paise": 10000})
        assert resp.status_code == 404

    def test_refund_order_without_payment_id_returns_400(self, admin_session):
        """Refund on order without razorpay_payment_id returns 400"""
        # First create an order that's in pending_payment state (no payment_id)
        # We'll use the orders list to find one, or this test will be skipped
        orders_resp = admin_session.get(f"{BASE_URL}/api/admin/orders?status=pending_payment&page_size=1")
        if orders_resp.status_code == 200:
            orders = orders_resp.json().get("orders", [])
            if orders:
                order_id = orders[0]["id"]
                resp = admin_session.post(f"{BASE_URL}/api/admin/orders/{order_id}/refund",
                                          json={"amount_paise": 10000})
                # Should be 400 because pending_payment orders can't be refunded
                assert resp.status_code == 400


class TestRegression:
    """Regression tests for Phase 0-5 flows"""

    def test_health_endpoint(self, session):
        """GET /api/health returns ok"""
        resp = session.get(f"{BASE_URL}/api/health")
        assert resp.status_code == 200
        assert resp.json().get("status") == "ok"

    def test_products_list(self, session):
        """GET /api/products returns products"""
        resp = session.get(f"{BASE_URL}/api/products")
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("count") >= 3

    def test_auth_register_login(self, session):
        """Register and login flow works"""
        email = f"test_reg_{uuid.uuid4().hex[:8]}@test.com"
        # Register
        reg_resp = session.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Test User",
            "email": email,
            "password": "TestPass123!"
        })
        assert reg_resp.status_code == 200
        token = reg_resp.json().get("access_token")
        assert token is not None
        
        # Login
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": "TestPass123!"
        })
        assert login_resp.status_code == 200

    def test_api_docs_renders(self, session):
        """GET /api/docs renders OpenAPI docs"""
        resp = session.get(f"{BASE_URL}/api/docs")
        assert resp.status_code == 200

    def test_openapi_has_admin_tag(self, session):
        """OpenAPI spec includes admin endpoints"""
        resp = session.get(f"{BASE_URL}/api/openapi.json")
        assert resp.status_code == 200
        spec = resp.json()
        paths = spec.get("paths", {})
        admin_paths = [p for p in paths.keys() if "/admin/" in p]
        assert len(admin_paths) > 0, "No admin paths in OpenAPI spec"

    def test_wishlist_add_remove(self, session):
        """Wishlist add/remove flow works"""
        # Get a variant ID
        products_resp = session.get(f"{BASE_URL}/api/products")
        products = products_resp.json().get("products", [])
        if products and products[0].get("variants"):
            variant_id = products[0]["variants"][0]["id"]
            
            # Register user
            email = f"test_wish_{uuid.uuid4().hex[:8]}@test.com"
            reg_resp = session.post(f"{BASE_URL}/api/auth/register", json={
                "name": "Wishlist User",
                "email": email,
                "password": "TestPass123!"
            })
            if reg_resp.status_code == 200:
                token = reg_resp.json().get("access_token")
                headers = {"Authorization": f"Bearer {token}"}
                
                # Add to wishlist
                add_resp = session.post(f"{BASE_URL}/api/wishlist",
                                       json={"variant_id": variant_id},
                                       headers=headers)
                assert add_resp.status_code == 200
                
                # Remove from wishlist
                del_resp = session.delete(f"{BASE_URL}/api/wishlist/{variant_id}",
                                         headers=headers)
                assert del_resp.status_code == 200

    def test_admin_dashboard_stats(self, admin_session):
        """Admin dashboard stats endpoint works"""
        resp = admin_session.get(f"{BASE_URL}/api/admin/dashboard/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert "revenue_all_time" in data
        assert "total_orders" in data

    def test_admin_orders_csv_export(self, admin_session):
        """Admin orders CSV export works"""
        resp = admin_session.get(f"{BASE_URL}/api/admin/orders/export.csv")
        assert resp.status_code == 200
        assert "text/csv" in resp.headers.get("content-type", "")

    def test_admin_products_crud(self, admin_session):
        """Admin products list works"""
        resp = admin_session.get(f"{BASE_URL}/api/admin/products")
        assert resp.status_code == 200
        data = resp.json()
        assert "products" in data

    def test_admin_settings_patch(self, admin_session):
        """Admin settings patch works"""
        # Get current settings
        get_resp = admin_session.get(f"{BASE_URL}/api/admin/settings")
        assert get_resp.status_code == 200
        
        # Patch tagline
        patch_resp = admin_session.patch(f"{BASE_URL}/api/admin/settings",
                                         json={"tagline": "Test tagline from pytest"})
        assert patch_resp.status_code == 200
        
        # Verify on public endpoint
        public_resp = admin_session.get(f"{BASE_URL}/api/site-settings")
        assert public_resp.status_code == 200
        assert public_resp.json().get("tagline") == "Test tagline from pytest"


class TestRefundsCollection:
    """Test refunds collection and admin refunds list"""

    def test_admin_refunds_list(self, admin_session):
        """GET /api/admin/refunds returns refunds list"""
        resp = admin_session.get(f"{BASE_URL}/api/admin/refunds")
        assert resp.status_code == 200
        data = resp.json()
        assert "refunds" in data
        assert "count" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
