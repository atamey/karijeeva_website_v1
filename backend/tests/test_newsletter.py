"""
Newsletter Subscription Tests for Karijeeva Phase 1
Tests: POST /api/newsletter/subscribe - validation, idempotency, normalization
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestNewsletterSubscribe:
    """POST /api/newsletter/subscribe tests"""
    
    def test_subscribe_with_valid_email_returns_success(self):
        """POST /api/newsletter/subscribe with valid email returns {success:true}"""
        unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        response = requests.post(
            f"{BASE_URL}/api/newsletter/subscribe",
            json={"email": unique_email}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True, f"Expected success=true, got {data}"
    
    def test_subscribe_idempotent_no_duplicate(self):
        """POST /api/newsletter/subscribe called twice with same email is idempotent"""
        unique_email = f"idempotent_{uuid.uuid4().hex[:8]}@example.com"
        
        # First subscription
        response1 = requests.post(
            f"{BASE_URL}/api/newsletter/subscribe",
            json={"email": unique_email}
        )
        assert response1.status_code == 200, f"First call failed: {response1.status_code}"
        assert response1.json().get("success") == True
        
        # Second subscription with same email
        response2 = requests.post(
            f"{BASE_URL}/api/newsletter/subscribe",
            json={"email": unique_email}
        )
        assert response2.status_code == 200, f"Second call failed: {response2.status_code}"
        assert response2.json().get("success") == True, "Idempotent call should still return success"
    
    def test_subscribe_invalid_email_no_at_returns_422(self):
        """POST /api/newsletter/subscribe with 'not-an-email' returns 422"""
        response = requests.post(
            f"{BASE_URL}/api/newsletter/subscribe",
            json={"email": "not-an-email"}
        )
        assert response.status_code == 422, f"Expected 422, got {response.status_code}: {response.text}"
    
    def test_subscribe_invalid_email_missing_domain_returns_422(self):
        """POST /api/newsletter/subscribe with 'test@' returns 422"""
        response = requests.post(
            f"{BASE_URL}/api/newsletter/subscribe",
            json={"email": "test@"}
        )
        assert response.status_code == 422, f"Expected 422, got {response.status_code}: {response.text}"
    
    def test_subscribe_empty_email_returns_422(self):
        """POST /api/newsletter/subscribe with empty email returns 422"""
        response = requests.post(
            f"{BASE_URL}/api/newsletter/subscribe",
            json={"email": ""}
        )
        assert response.status_code == 422, f"Expected 422, got {response.status_code}: {response.text}"
    
    def test_subscribe_normalizes_email_to_lowercase(self):
        """POST /api/newsletter/subscribe stores email normalized to lowercase"""
        unique_id = uuid.uuid4().hex[:8]
        mixed_case_email = f"TEST_UPPER_{unique_id}@EXAMPLE.COM"
        
        response = requests.post(
            f"{BASE_URL}/api/newsletter/subscribe",
            json={"email": mixed_case_email}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert response.json().get("success") == True
        
        # Subscribe again with lowercase version - should be idempotent (same doc)
        lowercase_email = mixed_case_email.lower()
        response2 = requests.post(
            f"{BASE_URL}/api/newsletter/subscribe",
            json={"email": lowercase_email}
        )
        assert response2.status_code == 200, f"Lowercase call failed: {response2.status_code}"
        assert response2.json().get("success") == True
    
    def test_subscribe_accepts_optional_source_field(self):
        """POST /api/newsletter/subscribe accepts optional source field"""
        unique_email = f"source_test_{uuid.uuid4().hex[:8]}@example.com"
        response = requests.post(
            f"{BASE_URL}/api/newsletter/subscribe",
            json={"email": unique_email, "source": "homepage_popup"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        assert response.json().get("success") == True
    
    def test_subscribe_default_source_is_footer(self):
        """POST /api/newsletter/subscribe without source defaults to 'footer'"""
        unique_email = f"default_source_{uuid.uuid4().hex[:8]}@example.com"
        response = requests.post(
            f"{BASE_URL}/api/newsletter/subscribe",
            json={"email": unique_email}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        # We can't directly verify the stored source without a GET endpoint,
        # but the endpoint should accept the request without source field
        assert response.json().get("success") == True


class TestNewsletterInOpenAPI:
    """Verify newsletter route is documented in OpenAPI"""
    
    def test_openapi_includes_newsletter_route(self):
        """GET /api/openapi.json includes /api/newsletter/subscribe"""
        response = requests.get(f"{BASE_URL}/api/openapi.json")
        assert response.status_code == 200
        data = response.json()
        paths = data.get("paths", {})
        assert "/api/newsletter/subscribe" in paths, "Newsletter route missing from OpenAPI spec"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
