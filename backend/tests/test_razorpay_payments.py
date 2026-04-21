"""
Razorpay Payment Integration Tests for Karijeeva POC
Tests: Health, Create Order, Verify Payment, Get Order endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthEndpoint:
    """Health check endpoint tests"""
    
    def test_health_returns_200_with_status_ok(self):
        """GET /api/health returns 200 with {status:'ok'}"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("status") == "ok", f"Expected status='ok', got {data}"


class TestSwaggerDocs:
    """Swagger/OpenAPI documentation tests"""
    
    def test_swagger_ui_renders(self):
        """GET /api/docs renders FastAPI Swagger UI"""
        response = requests.get(f"{BASE_URL}/api/docs")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "swagger-ui" in response.text.lower(), "Swagger UI not found in response"
    
    def test_openapi_json_exposes_routes(self):
        """GET /api/openapi.json exposes all payment routes + health"""
        response = requests.get(f"{BASE_URL}/api/openapi.json")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        paths = data.get("paths", {})
        # Check required endpoints exist
        assert "/api/health" in paths, "Missing /api/health in OpenAPI spec"
        assert "/api/payments/create-order" in paths, "Missing /api/payments/create-order"
        assert "/api/payments/verify" in paths, "Missing /api/payments/verify"
        assert "/api/payments/order/{razorpay_order_id}" in paths, "Missing /api/payments/order/{razorpay_order_id}"


class TestCreateOrderEndpoint:
    """POST /api/payments/create-order tests"""
    
    def test_create_order_with_minimum_amount(self):
        """POST /api/payments/create-order with {amount_inr:1} returns valid order"""
        response = requests.post(
            f"{BASE_URL}/api/payments/create-order",
            json={"amount_inr": 1}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "order_id" in data, "Missing order_id in response"
        assert data["order_id"].startswith("order_"), f"Invalid order_id format: {data['order_id']}"
        assert data.get("amount") == 100, f"Expected amount=100 (paise), got {data.get('amount')}"
        assert data.get("currency") == "INR", f"Expected currency=INR, got {data.get('currency')}"
        assert data.get("key_id") == "rzp_test_SffqJVx1aXnkTg", f"Unexpected key_id: {data.get('key_id')}"
    
    def test_create_order_with_receipt_and_notes(self):
        """POST /api/payments/create-order with receipt and notes - verify persistence"""
        payload = {
            "amount_inr": 499,
            "receipt": "rcpt_test",
            "notes": {"product": "coconut_oil"}
        }
        response = requests.post(
            f"{BASE_URL}/api/payments/create-order",
            json=payload
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        order_id = data.get("order_id")
        assert order_id, "Missing order_id"
        
        # Verify persistence by fetching the order
        get_response = requests.get(f"{BASE_URL}/api/payments/order/{order_id}")
        assert get_response.status_code == 200, f"Failed to fetch order: {get_response.status_code}"
        
        order_data = get_response.json()
        assert order_data.get("receipt") == "rcpt_test", f"Receipt not persisted: {order_data.get('receipt')}"
        assert order_data.get("notes", {}).get("product") == "coconut_oil", f"Notes not persisted: {order_data.get('notes')}"
        assert order_data.get("status") == "created", f"Expected status='created', got {order_data.get('status')}"
        assert order_data.get("amount_inr") == 499, f"Expected amount_inr=499, got {order_data.get('amount_inr')}"
    
    def test_create_order_invalid_amount_zero(self):
        """POST /api/payments/create-order with amount_inr:0 returns 4xx error"""
        response = requests.post(
            f"{BASE_URL}/api/payments/create-order",
            json={"amount_inr": 0}
        )
        assert response.status_code in [400, 422], f"Expected 4xx, got {response.status_code}"
    
    def test_create_order_invalid_amount_negative(self):
        """POST /api/payments/create-order with negative amount returns 4xx error"""
        response = requests.post(
            f"{BASE_URL}/api/payments/create-order",
            json={"amount_inr": -10}
        )
        assert response.status_code in [400, 422], f"Expected 4xx, got {response.status_code}"
    
    def test_create_order_invalid_amount_less_than_one(self):
        """POST /api/payments/create-order with amount < 1 INR returns 4xx error"""
        response = requests.post(
            f"{BASE_URL}/api/payments/create-order",
            json={"amount_inr": 0.5}
        )
        # Razorpay minimum is 1 INR = 100 paise
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"


class TestVerifyPaymentEndpoint:
    """POST /api/payments/verify tests"""
    
    def test_verify_with_tampered_signature_returns_400(self):
        """POST /api/payments/verify with tampered signature returns 400 with {verified:false}"""
        # First create an order
        create_response = requests.post(
            f"{BASE_URL}/api/payments/create-order",
            json={"amount_inr": 1}
        )
        assert create_response.status_code == 200
        order_id = create_response.json().get("order_id")
        
        # Try to verify with tampered signature
        verify_response = requests.post(
            f"{BASE_URL}/api/payments/verify",
            json={
                "razorpay_order_id": order_id,
                "razorpay_payment_id": "pay_fake_123",
                "razorpay_signature": "tampered_signature_abc123"
            }
        )
        assert verify_response.status_code == 400, f"Expected 400, got {verify_response.status_code}"
        
        data = verify_response.json()
        detail = data.get("detail", {})
        assert detail.get("verified") == False, f"Expected verified=false, got {detail}"
        assert "error" in detail or "Signature" in str(detail), f"Expected error message, got {detail}"
    
    def test_verify_updates_order_status_to_failed(self):
        """Verify that tampered signature updates order status to 'failed'"""
        # Create order
        create_response = requests.post(
            f"{BASE_URL}/api/payments/create-order",
            json={"amount_inr": 1}
        )
        order_id = create_response.json().get("order_id")
        
        # Verify with tampered signature
        requests.post(
            f"{BASE_URL}/api/payments/verify",
            json={
                "razorpay_order_id": order_id,
                "razorpay_payment_id": "pay_fake_456",
                "razorpay_signature": "invalid_sig"
            }
        )
        
        # Check order status is now 'failed'
        get_response = requests.get(f"{BASE_URL}/api/payments/order/{order_id}")
        assert get_response.status_code == 200
        order_data = get_response.json()
        assert order_data.get("status") == "failed", f"Expected status='failed', got {order_data.get('status')}"


class TestGetOrderEndpoint:
    """GET /api/payments/order/{razorpay_order_id} tests"""
    
    def test_get_order_returns_persisted_data(self):
        """GET /api/payments/order/{id} returns persisted order without _id leakage"""
        # Create order first
        create_response = requests.post(
            f"{BASE_URL}/api/payments/create-order",
            json={"amount_inr": 100, "receipt": "test_receipt_get"}
        )
        order_id = create_response.json().get("order_id")
        
        # Fetch order
        get_response = requests.get(f"{BASE_URL}/api/payments/order/{order_id}")
        assert get_response.status_code == 200, f"Expected 200, got {get_response.status_code}"
        
        data = get_response.json()
        # Verify no MongoDB _id leakage
        assert "_id" not in data, "MongoDB _id leaked in response"
        
        # Verify required fields
        assert data.get("razorpay_order_id") == order_id
        assert data.get("status") in ["created", "paid", "failed"]
        assert data.get("amount_inr") == 100
        assert data.get("receipt") == "test_receipt_get"
        assert "created_at" in data
    
    def test_get_order_unknown_id_returns_404(self):
        """GET /api/payments/order/{unknown_id} returns 404"""
        response = requests.get(f"{BASE_URL}/api/payments/order/order_nonexistent_xyz123")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


class TestRootEndpoint:
    """Root API endpoint test"""
    
    def test_api_root_returns_message(self):
        """GET /api/ returns Karijeeva API message"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
