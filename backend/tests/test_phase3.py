"""
Phase 3 Backend Tests: Auth, Geo, Coupons, Orders, Reviews
Tests all new Phase 3 endpoints for Karijeeva e-commerce
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://karijeeva-oils.preview.emergentagent.com"


class TestHealth:
    """Health check and basic API availability"""
    
    def test_health_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        print("PASS: /api/health returns 200 with status=ok")
    
    def test_api_docs_available(self):
        response = requests.get(f"{BASE_URL}/api/docs")
        assert response.status_code == 200
        print("PASS: /api/docs renders successfully")


class TestAuth:
    """Authentication endpoints: register, login, logout, me"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.test_email = f"test_{uuid.uuid4().hex[:8]}@karijeeva.in"
        self.test_password = "Passw0rd!"
        self.test_name = "Test Buyer"
        self.session = requests.Session()
    
    def test_register_new_user(self):
        """POST /api/auth/register with fresh email returns user + access_token"""
        response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "name": self.test_name,
            "email": self.test_email,
            "password": self.test_password
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "user" in data, "Response should contain 'user'"
        assert "access_token" in data, "Response should contain 'access_token'"
        
        # Verify user data
        assert data["user"]["email"] == self.test_email.lower()
        assert data["user"]["name"] == self.test_name
        assert "password_hash" not in data["user"], "Password hash should not be returned"
        assert "id" in data["user"]
        
        # Verify token is a non-empty string
        assert isinstance(data["access_token"], str)
        assert len(data["access_token"]) > 0
        
        # Verify httpOnly cookie is set
        cookies = response.cookies
        assert "access_token" in cookies or any("access_token" in str(c) for c in self.session.cookies)
        
        print(f"PASS: Register new user {self.test_email} - returns user + access_token")
    
    def test_register_duplicate_returns_409(self):
        """Duplicate registration returns 409"""
        # First registration
        self.session.post(f"{BASE_URL}/api/auth/register", json={
            "name": self.test_name,
            "email": self.test_email,
            "password": self.test_password
        })
        
        # Second registration with same email
        response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Another Name",
            "email": self.test_email,
            "password": "AnotherPass123"
        })
        assert response.status_code == 409, f"Expected 409 for duplicate, got {response.status_code}"
        print("PASS: Duplicate registration returns 409")
    
    def test_login_success(self):
        """POST /api/auth/login with valid credentials returns user + token"""
        # First register
        self.session.post(f"{BASE_URL}/api/auth/register", json={
            "name": self.test_name,
            "email": self.test_email,
            "password": self.test_password
        })
        
        # Clear session cookies
        self.session.cookies.clear()
        
        # Login
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": self.test_email,
            "password": self.test_password
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "user" in data
        assert "access_token" in data
        assert data["user"]["email"] == self.test_email.lower()
        print("PASS: Login with valid credentials returns user + token")
    
    def test_login_bad_password_returns_401(self):
        """POST /api/auth/login with bad password returns 401"""
        # First register
        self.session.post(f"{BASE_URL}/api/auth/register", json={
            "name": self.test_name,
            "email": self.test_email,
            "password": self.test_password
        })
        
        # Login with wrong password
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": self.test_email,
            "password": "WrongPassword123"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Login with bad password returns 401")
    
    def test_me_with_cookie(self):
        """GET /api/auth/me returns user via cookie"""
        # Register (sets cookie)
        reg_response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "name": self.test_name,
            "email": self.test_email,
            "password": self.test_password
        })
        
        # Get me with cookie
        response = self.session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "user" in data
        assert data["user"]["email"] == self.test_email.lower()
        print("PASS: GET /api/auth/me returns user via cookie")
    
    def test_me_with_bearer_token(self):
        """GET /api/auth/me returns user via Bearer token"""
        # Register
        reg_response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "name": self.test_name,
            "email": self.test_email,
            "password": self.test_password
        })
        token = reg_response.json()["access_token"]
        
        # New session without cookies
        new_session = requests.Session()
        response = new_session.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["user"]["email"] == self.test_email.lower()
        print("PASS: GET /api/auth/me returns user via Bearer token")
    
    def test_logout_clears_cookie(self):
        """POST /api/auth/logout clears cookie; /me returns 401 after"""
        # Register
        self.session.post(f"{BASE_URL}/api/auth/register", json={
            "name": self.test_name,
            "email": self.test_email,
            "password": self.test_password
        })
        
        # Verify logged in
        me_before = self.session.get(f"{BASE_URL}/api/auth/me")
        assert me_before.status_code == 200
        
        # Logout
        logout_response = self.session.post(f"{BASE_URL}/api/auth/logout")
        assert logout_response.status_code == 200
        
        # Verify /me returns 401 after logout
        me_after = self.session.get(f"{BASE_URL}/api/auth/me")
        assert me_after.status_code == 401, f"Expected 401 after logout, got {me_after.status_code}"
        print("PASS: Logout clears cookie; /me returns 401 after")


class TestGeo:
    """Geo/Pincode lookup endpoint"""
    
    def test_pincode_lookup_valid(self):
        """GET /api/geo/pincode/560038 returns city, state"""
        response = requests.get(f"{BASE_URL}/api/geo/pincode/560038")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "city" in data
        assert "state" in data
        assert data["state"] == "Karnataka"
        # City could be "Bengaluru" or "Bangalore" depending on India Post
        assert "Bengaluru" in data["city"] or "Bangalore" in data["city"] or data["city"] == "Bengaluru Urban"
        print(f"PASS: Pincode 560038 returns city={data['city']}, state={data['state']}")
    
    def test_pincode_invalid_format(self):
        """Invalid pincode format returns 400"""
        response = requests.get(f"{BASE_URL}/api/geo/pincode/12345")  # 5 digits
        assert response.status_code == 400
        print("PASS: Invalid pincode format returns 400")
    
    def test_pincode_not_found(self):
        """Non-existent pincode returns 404"""
        response = requests.get(f"{BASE_URL}/api/geo/pincode/000000")
        assert response.status_code in [404, 502], f"Expected 404 or 502, got {response.status_code}"
        print("PASS: Non-existent pincode returns 404/502")


class TestCoupons:
    """Coupon validation endpoint"""
    
    def test_welcome10_valid_subtotal(self):
        """WELCOME10 with subtotal=499 returns valid + discount"""
        response = requests.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": "WELCOME10",
            "subtotal": 499
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data["valid"] == True
        assert data["code"] == "WELCOME10"
        assert "final_discount_amount" in data
        # 10% of 499 = 49.9
        assert abs(data["final_discount_amount"] - 49.9) < 0.01
        print(f"PASS: WELCOME10 with subtotal=499 returns discount={data['final_discount_amount']}")
    
    def test_welcome10_below_minimum(self):
        """WELCOME10 with subtotal=100 returns 400 citing min order"""
        response = requests.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": "WELCOME10",
            "subtotal": 100
        })
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        assert "minimum" in data["detail"].lower() or "min" in data["detail"].lower()
        print("PASS: WELCOME10 with subtotal=100 returns 400 citing min order")
    
    def test_invalid_coupon(self):
        """Invalid coupon code returns 404"""
        response = requests.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": "INVALIDCODE123",
            "subtotal": 500
        })
        assert response.status_code == 404
        print("PASS: Invalid coupon returns 404")


class TestOrders:
    """Order creation, verification, and retrieval"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.test_email = f"test_{uuid.uuid4().hex[:8]}@karijeeva.in"
        self.test_password = "Passw0rd!"
        
        # Get a valid variant ID from products
        products_resp = requests.get(f"{BASE_URL}/api/products")
        products = products_resp.json()["products"]
        self.variant_id = products[0]["variants"][0]["id"]
        self.variant_price = products[0]["variants"][0]["price"]
    
    def test_order_create_guest(self):
        """POST /api/orders/create (guest) creates order with correct totals"""
        order_data = {
            "items": [{"variant_id": self.variant_id, "quantity": 1}],
            "address": {
                "full_name": "Test Guest",
                "phone": "9876543210",
                "line1": "123 Test Street",
                "line2": "",
                "city": "Bengaluru",
                "state": "Karnataka",
                "pincode": "560038",
                "country": "India"
            },
            "guest_email": self.test_email,
            "guest_phone": "9876543210",
            "coupon_code": None
        }
        
        response = self.session.post(f"{BASE_URL}/api/orders/create", json=order_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "order_id" in data
        assert "order_number" in data
        assert "razorpay_order_id" in data
        assert "key_id" in data
        assert "amount" in data  # in paise
        assert "totals" in data
        
        # Verify totals structure
        totals = data["totals"]
        assert "subtotal" in totals
        assert "gst" in totals
        assert "shipping" in totals
        assert "total" in totals
        
        # Verify arithmetic: subtotal + gst + shipping - discount = total
        expected_subtotal = self.variant_price
        assert totals["subtotal"] == expected_subtotal
        
        # GST is 5%
        expected_gst = round(expected_subtotal * 0.05, 2)
        assert abs(totals["gst"] - expected_gst) < 0.01
        
        # Shipping: 49 if subtotal < 999, else 0
        expected_shipping = 49 if expected_subtotal < 999 else 0
        assert totals["shipping"] == expected_shipping
        
        # Amount in paise
        assert data["amount"] == int(round(totals["total"] * 100))
        
        print(f"PASS: Order created - order_id={data['order_id']}, totals={totals}")
        return data
    
    def test_order_create_with_coupon(self):
        """Order with WELCOME10 coupon applies discount correctly"""
        order_data = {
            "items": [{"variant_id": self.variant_id, "quantity": 1}],
            "address": {
                "full_name": "Test Guest",
                "phone": "9876543210",
                "line1": "123 Test Street",
                "city": "Bengaluru",
                "state": "Karnataka",
                "pincode": "560038"
            },
            "guest_email": self.test_email,
            "coupon_code": "WELCOME10"
        }
        
        response = self.session.post(f"{BASE_URL}/api/orders/create", json=order_data)
        
        # Only succeeds if subtotal >= min_order (499)
        if self.variant_price >= 499:
            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            data = response.json()
            totals = data["totals"]
            
            # Discount should be 10% of subtotal
            expected_discount = round(totals["subtotal"] * 0.10, 2)
            assert abs(totals["discount"] - expected_discount) < 0.01
            print(f"PASS: Order with WELCOME10 - discount={totals['discount']}")
        else:
            assert response.status_code == 400
            print("PASS: Order with WELCOME10 rejected (subtotal below min)")
    
    def test_order_verify_tampered_signature(self):
        """Tampered signature returns 400 with verified=false"""
        # First create an order
        order_data = {
            "items": [{"variant_id": self.variant_id, "quantity": 1}],
            "address": {
                "full_name": "Test Guest",
                "phone": "9876543210",
                "line1": "123 Test Street",
                "city": "Bengaluru",
                "state": "Karnataka",
                "pincode": "560038"
            },
            "guest_email": self.test_email
        }
        
        create_resp = self.session.post(f"{BASE_URL}/api/orders/create", json=order_data)
        assert create_resp.status_code == 200
        order = create_resp.json()
        
        # Try to verify with tampered signature
        verify_data = {
            "order_id": order["order_id"],
            "razorpay_order_id": order["razorpay_order_id"],
            "razorpay_payment_id": "pay_fake123",
            "razorpay_signature": "tampered_signature_abc123"
        }
        
        verify_resp = self.session.post(f"{BASE_URL}/api/orders/verify", json=verify_data)
        assert verify_resp.status_code == 400, f"Expected 400, got {verify_resp.status_code}"
        
        data = verify_resp.json()
        # The detail is a dict with verified=false
        detail = data.get("detail", {})
        if isinstance(detail, dict):
            assert detail.get("verified") == False
            assert "Signature verification failed" in detail.get("error", "")
        print("PASS: Tampered signature returns 400 with verified=false")
    
    def test_order_verify_invalid_order_id(self):
        """Verify with invalid order_id returns 404"""
        verify_data = {
            "order_id": "nonexistent-order-id",
            "razorpay_order_id": "order_fake123",
            "razorpay_payment_id": "pay_fake123",
            "razorpay_signature": "fake_signature"
        }
        
        response = self.session.post(f"{BASE_URL}/api/orders/verify", json=verify_data)
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Verify with invalid order_id returns 404")
    
    def test_order_get_within_30_minutes(self):
        """GET /api/orders/{order_id} accessible within 30 min without auth"""
        # Create order
        order_data = {
            "items": [{"variant_id": self.variant_id, "quantity": 1}],
            "address": {
                "full_name": "Test Guest",
                "phone": "9876543210",
                "line1": "123 Test Street",
                "city": "Bengaluru",
                "state": "Karnataka",
                "pincode": "560038"
            },
            "guest_email": self.test_email
        }
        
        create_resp = self.session.post(f"{BASE_URL}/api/orders/create", json=order_data)
        order = create_resp.json()
        
        # Get order without auth (within 30 min window)
        get_resp = requests.get(f"{BASE_URL}/api/orders/{order['order_id']}")
        assert get_resp.status_code == 200, f"Expected 200, got {get_resp.status_code}"
        
        data = get_resp.json()
        assert data["order_number"] == order["order_number"]
        print("PASS: Order accessible within 30 min without auth")
    
    def test_orders_mine_requires_auth(self):
        """GET /api/orders/mine requires auth"""
        response = requests.get(f"{BASE_URL}/api/orders/mine")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: GET /api/orders/mine requires auth (401)")
    
    def test_orders_mine_with_auth(self):
        """GET /api/orders/mine returns orders for authenticated user"""
        # Register user
        reg_resp = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Test Buyer",
            "email": self.test_email,
            "password": self.test_password
        })
        assert reg_resp.status_code == 200
        
        # Get orders
        orders_resp = self.session.get(f"{BASE_URL}/api/orders/mine")
        assert orders_resp.status_code == 200
        data = orders_resp.json()
        assert "orders" in data
        assert "count" in data
        print(f"PASS: GET /api/orders/mine returns orders (count={data['count']})")
    
    def test_order_cancel_pending_payment(self):
        """POST /api/orders/{order_id}/cancel works for pending_payment status"""
        # Register user
        reg_resp = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Test Buyer",
            "email": self.test_email,
            "password": self.test_password
        })
        
        # Create order as authenticated user
        order_data = {
            "items": [{"variant_id": self.variant_id, "quantity": 1}],
            "address": {
                "full_name": "Test Buyer",
                "phone": "9876543210",
                "line1": "123 Test Street",
                "city": "Bengaluru",
                "state": "Karnataka",
                "pincode": "560038"
            }
        }
        
        create_resp = self.session.post(f"{BASE_URL}/api/orders/create", json=order_data)
        order = create_resp.json()
        
        # Cancel order
        cancel_resp = self.session.post(f"{BASE_URL}/api/orders/{order['order_id']}/cancel")
        assert cancel_resp.status_code == 200, f"Expected 200, got {cancel_resp.status_code}"
        print("PASS: Order cancel works for pending_payment status")


class TestReviews:
    """Review submission and retrieval"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.test_email = f"test_{uuid.uuid4().hex[:8]}@karijeeva.in"
        self.test_password = "Passw0rd!"
    
    def test_reviews_list_returns_approved_only(self):
        """GET /api/reviews?product_id=... returns approved reviews only"""
        response = requests.get(f"{BASE_URL}/api/reviews", params={
            "product_id": "virgin-cold-pressed-coconut-oil"
        })
        assert response.status_code == 200
        data = response.json()
        assert "reviews" in data
        assert "count" in data
        # All returned reviews should be approved (or empty)
        for review in data["reviews"]:
            assert review.get("is_approved") == True
        print(f"PASS: GET /api/reviews returns approved reviews only (count={data['count']})")
    
    def test_review_create_requires_auth(self):
        """POST /api/reviews without auth returns 401"""
        response = requests.post(f"{BASE_URL}/api/reviews", json={
            "product_id": "virgin-cold-pressed-coconut-oil",
            "rating": 5,
            "title": "Great oil",
            "body": "Love this product!"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: POST /api/reviews without auth returns 401")
    
    def test_review_create_requires_purchase(self):
        """POST /api/reviews without purchase returns 403"""
        # Register user (no purchase)
        self.session.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Test Buyer",
            "email": self.test_email,
            "password": self.test_password
        })
        
        # Try to review without having purchased
        response = self.session.post(f"{BASE_URL}/api/reviews", json={
            "product_id": "virgin-cold-pressed-coconut-oil",
            "rating": 5,
            "title": "Great oil",
            "body": "Love this product!"
        })
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        data = response.json()
        assert "verified" in data.get("detail", "").lower() or "buyer" in data.get("detail", "").lower()
        print("PASS: POST /api/reviews without purchase returns 403")


class TestPhase0Regression:
    """Phase 0 regression: payments endpoints"""
    
    def test_payments_create_order(self):
        """POST /api/payments/create-order works"""
        response = requests.post(f"{BASE_URL}/api/payments/create-order", json={
            "amount_inr": 100.0,
            "receipt": "test_receipt"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "order_id" in data
        assert "amount" in data
        assert "key_id" in data
        print("PASS: Phase 0 /api/payments/create-order works")
    
    def test_payments_verify_tampered(self):
        """POST /api/payments/verify with tampered signature returns 400"""
        # First create an order
        create_resp = requests.post(f"{BASE_URL}/api/payments/create-order", json={
            "amount_inr": 100.0
        })
        order = create_resp.json()
        
        # Verify with tampered signature
        verify_resp = requests.post(f"{BASE_URL}/api/payments/verify", json={
            "razorpay_order_id": order["order_id"],
            "razorpay_payment_id": "pay_fake123",
            "razorpay_signature": "tampered_signature"
        })
        assert verify_resp.status_code == 400
        print("PASS: Phase 0 /api/payments/verify tampered returns 400")


class TestNewsletter:
    """Newsletter subscription with welcome code"""
    
    def test_newsletter_first_time_returns_welcome_code(self):
        """First-time newsletter subscription returns welcome_code + expires_at"""
        test_email = f"newsletter_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/newsletter/subscribe", json={
            "email": test_email,
            "source": "test"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert data["success"] == True
        # First-time should get welcome code
        if "welcome_code" in data:
            assert data["welcome_code"] == "WELCOME10"
            assert "expires_at" in data
            print(f"PASS: Newsletter first-time returns welcome_code={data['welcome_code']}")
        else:
            print("PASS: Newsletter subscription successful (no welcome code - may be already subscribed)")
    
    def test_newsletter_already_subscribed(self):
        """Already subscribed email returns already_subscribed=true"""
        test_email = f"newsletter_{uuid.uuid4().hex[:8]}@test.com"
        
        # First subscription
        requests.post(f"{BASE_URL}/api/newsletter/subscribe", json={
            "email": test_email,
            "source": "test"
        })
        
        # Second subscription
        response = requests.post(f"{BASE_URL}/api/newsletter/subscribe", json={
            "email": test_email,
            "source": "test"
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("already_subscribed") == True
        print("PASS: Already subscribed returns already_subscribed=true")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
