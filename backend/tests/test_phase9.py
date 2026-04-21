"""
Phase 9 Backend Tests — Footer, Site Settings, FAQs, Sitemap, Robots, Admin Settings
Tests the 15 new site_settings fields, 20 FAQs, robots.txt, sitemap.xml, and admin PATCH roundtrip.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_EMAIL = "admin@karijeeva.in"
ADMIN_PASSWORD = "KarijeevaAdmin@2025"


class TestPhase9SiteSettings:
    """Test GET /api/site-settings returns all 15 new Phase 9 keys"""
    
    def test_site_settings_returns_all_phase9_keys(self):
        """Verify all 15 new site_settings keys are present"""
        response = requests.get(f"{BASE_URL}/api/site-settings")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Phase 9 new keys
        phase9_keys = [
            "company_name", "cin", "registered_address",
            "support_email", "legal_email", "privacy_email",
            "support_phone", "hours_ist", "fssai_license",
            "parent_site_url", "instagram_url", "facebook_url",
            "youtube_url", "whatsapp_url", "linkedin_url"
        ]
        
        # Pre-existing keys
        existing_keys = ["tagline", "hero_headline", "hero_sub", "hero_image", "contact"]
        
        for key in phase9_keys:
            assert key in data, f"Missing Phase 9 key: {key}"
            print(f"✓ {key}: {data[key][:50] if isinstance(data[key], str) and len(data[key]) > 50 else data[key]}")
        
        for key in existing_keys:
            assert key in data, f"Missing pre-existing key: {key}"
        
        # Verify specific values from seed
        assert data["company_name"] == "Kadle Global Pvt Ltd"
        assert data["cin"] == "U62099KA2025PTC207992"
        assert data["fssai_license"] == "10024001000000"
        assert "instagram.com/karijeeva" in data["instagram_url"]
        print("✓ All 15 Phase 9 site_settings keys present with correct values")


class TestPhase9FAQs:
    """Test GET /api/faqs returns 20 FAQs"""
    
    def test_faqs_returns_20_items(self):
        """Verify FAQs endpoint returns exactly 20 FAQs"""
        response = requests.get(f"{BASE_URL}/api/faqs")
        assert response.status_code == 200
        
        data = response.json()
        assert "faqs" in data
        assert "count" in data
        assert data["count"] == 20, f"Expected 20 FAQs, got {data['count']}"
        assert len(data["faqs"]) == 20
        
        # Verify FAQ structure
        for faq in data["faqs"]:
            assert "question" in faq
            assert "answer" in faq
            assert "category" in faq
            assert "id" in faq
        
        # Verify categories include Phase 9 additions
        categories = set(f["category"] for f in data["faqs"])
        expected_categories = {"product", "shipping", "orders", "returns", "subscriptions", "account"}
        for cat in expected_categories:
            assert cat in categories, f"Missing category: {cat}"
        
        print(f"✓ 20 FAQs returned with categories: {categories}")


class TestPhase9RobotsTxt:
    """Test GET /api/robots.txt includes Phase 9 disallows"""
    
    def test_robots_txt_disallows_gift_cards_and_subscribe_save(self):
        """Verify robots.txt includes Disallow for /gift-cards and /subscribe-save"""
        response = requests.get(f"{BASE_URL}/api/robots.txt")
        assert response.status_code == 200
        assert response.headers.get("content-type", "").startswith("text/plain")
        
        content = response.text
        assert "Disallow: /gift-cards" in content, "Missing Disallow: /gift-cards"
        assert "Disallow: /subscribe-save" in content, "Missing Disallow: /subscribe-save"
        assert "Disallow: /admin" in content
        assert "Sitemap:" in content
        
        print("✓ robots.txt includes /gift-cards and /subscribe-save disallows")


class TestPhase9Sitemap:
    """Test GET /api/sitemap.xml includes Phase 9 routes"""
    
    def test_sitemap_includes_phase9_routes(self):
        """Verify sitemap.xml includes all Phase 9 static pages"""
        response = requests.get(f"{BASE_URL}/api/sitemap.xml")
        assert response.status_code == 200
        assert "application/xml" in response.headers.get("content-type", "")
        
        content = response.text
        
        # Phase 9 routes that should be in sitemap
        phase9_routes = [
            "/the-farm",
            "/cold-press-process",
            "/sustainability",
            "/press",
            "/careers",
            "/faqs",
            "/shipping-policy",
            "/returns-policy",
            "/privacy-policy",
            "/terms",
            "/cookie-policy",
            "/track-order"
        ]
        
        for route in phase9_routes:
            assert route in content, f"Missing sitemap route: {route}"
            print(f"✓ Sitemap includes {route}")
        
        print("✓ All 12 Phase 9 routes present in sitemap.xml")


class TestPhase9AdminSettingsPatch:
    """Test admin PATCH /api/admin/settings accepts all 15 new fields"""
    
    @pytest.fixture
    def admin_session(self):
        """Login as admin and return session with auth"""
        session = requests.Session()
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if login_resp.status_code != 200:
            pytest.skip(f"Admin login failed: {login_resp.status_code}")
        
        token = login_resp.json().get("access_token")
        session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    def test_admin_settings_get(self, admin_session):
        """Verify admin can GET settings"""
        response = admin_session.get(f"{BASE_URL}/api/admin/settings")
        assert response.status_code == 200
        data = response.json()
        assert "company_name" in data
        print("✓ Admin GET /api/admin/settings works")
    
    def test_admin_settings_patch_roundtrip(self, admin_session):
        """Verify admin can PATCH all 15 new fields and they persist"""
        # Get current settings
        get_resp = admin_session.get(f"{BASE_URL}/api/admin/settings")
        assert get_resp.status_code == 200
        original = get_resp.json()
        
        # Patch with test values
        test_patch = {
            "company_name": "TEST_Kadle Global Pvt Ltd",
            "cin": "TEST_U62099KA2025PTC207992",
            "registered_address": "TEST_Bengaluru, Karnataka, India",
            "support_email": "test_support@karijeeva.in",
            "legal_email": "test_legal@karijeeva.in",
            "privacy_email": "test_privacy@karijeeva.in",
            "support_phone": "+91 80 TEST 4860",
            "hours_ist": "TEST Mon–Sat · 9:30 AM – 6:30 PM IST",
            "fssai_license": "TEST_10024001000000",
            "parent_site_url": "https://test.kadleglobal.com",
            "instagram_url": "https://instagram.com/test_karijeeva",
            "facebook_url": "https://facebook.com/test_karijeeva",
            "youtube_url": "https://youtube.com/@test_karijeeva",
            "whatsapp_url": "https://wa.me/test_918048604860",
            "linkedin_url": "https://linkedin.com/company/test-kadle-global",
        }
        
        patch_resp = admin_session.patch(f"{BASE_URL}/api/admin/settings", json=test_patch)
        assert patch_resp.status_code == 200, f"PATCH failed: {patch_resp.text}"
        assert patch_resp.json().get("success") == True
        
        # Verify persistence via public endpoint
        verify_resp = requests.get(f"{BASE_URL}/api/site-settings")
        assert verify_resp.status_code == 200
        updated = verify_resp.json()
        
        for key, value in test_patch.items():
            assert updated.get(key) == value, f"Key {key} not persisted: expected {value}, got {updated.get(key)}"
        
        print("✓ All 15 Phase 9 fields patched and persisted")
        
        # Restore original values
        restore_patch = {k: original.get(k, "") for k in test_patch.keys()}
        restore_resp = admin_session.patch(f"{BASE_URL}/api/admin/settings", json=restore_patch)
        assert restore_resp.status_code == 200
        print("✓ Original settings restored")


class TestPhase9NewsletterWaitlist:
    """Test newsletter subscribe with Phase 9 waitlist sources"""
    
    def test_gift_cards_waitlist_subscribe(self):
        """Verify newsletter subscribe accepts source='gift_cards_waitlist'"""
        test_email = f"test_gift_{os.urandom(4).hex()}@example.com"
        response = requests.post(f"{BASE_URL}/api/newsletter/subscribe", json={
            "email": test_email,
            "source": "gift_cards_waitlist"
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"✓ Gift cards waitlist subscribe works for {test_email}")
    
    def test_subscribe_save_waitlist_subscribe(self):
        """Verify newsletter subscribe accepts source='subscribe_save_waitlist'"""
        test_email = f"test_subsave_{os.urandom(4).hex()}@example.com"
        response = requests.post(f"{BASE_URL}/api/newsletter/subscribe", json={
            "email": test_email,
            "source": "subscribe_save_waitlist"
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"✓ Subscribe & Save waitlist subscribe works for {test_email}")


class TestPhase9RegressionChecks:
    """Regression tests for existing Phase 0-8 functionality"""
    
    def test_health_endpoint(self):
        """Basic health check"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        assert response.json().get("status") == "ok"
    
    def test_products_list(self):
        """Verify products endpoint still works"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert data["count"] >= 3
    
    def test_recipes_list(self):
        """Verify recipes endpoint still works"""
        response = requests.get(f"{BASE_URL}/api/recipes")
        assert response.status_code == 200
        data = response.json()
        assert "recipes" in data
        assert data["count"] >= 6
    
    def test_blog_list(self):
        """Verify blog endpoint still works"""
        response = requests.get(f"{BASE_URL}/api/blog")
        assert response.status_code == 200
        data = response.json()
        assert "posts" in data
        assert data["count"] >= 5
    
    def test_testimonials_list(self):
        """Verify testimonials endpoint still works"""
        response = requests.get(f"{BASE_URL}/api/testimonials")
        assert response.status_code == 200
        data = response.json()
        assert "testimonials" in data
        assert data["count"] >= 6


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
