# Certificate API Tests - PDF Generation with Turkish chars, no QR code, Upper Leader message
import pytest
import requests
import os
import tempfile

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@profitteam.tr"
ADMIN_PASSWORD = "19901990Aa."
TEST_USER_ID = "7573491f-6bc3-42c5-bcc9-78d4d9b7dbfd"
TEST_CERT_ID = "6ef138ab-889e-4206-9a10-9f3af19c9a2b"
TEST_COURSE_ID = "ced326e7-44e8-49b3-90c1-9745693e0821"


@pytest.fixture(scope="module")
def auth_token():
    """Get admin authentication token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json()["token"]


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


class TestAuthentication:
    """Test login endpoint"""
    
    def test_login_success(self):
        """POST /api/auth/login with valid credentials should return token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "super_admin"
    
    def test_login_invalid_password(self):
        """POST /api/auth/login with invalid password should return 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": "wrongpassword"}
        )
        assert response.status_code == 401


class TestCertificateEndpoints:
    """Certificate API endpoint tests"""
    
    def test_get_user_certificates(self, auth_headers):
        """GET /api/certificates/user/{user_id} should return user's certificates"""
        response = requests.get(
            f"{BASE_URL}/api/certificates/user/{TEST_USER_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200
        certs = response.json()
        assert isinstance(certs, list)
        assert len(certs) >= 1
        
        # Find the test certificate
        test_cert = next((c for c in certs if c["id"] == TEST_CERT_ID), None)
        assert test_cert is not None, "Test certificate not found"
        assert test_cert["user_id"] == TEST_USER_ID
        assert test_cert["course_id"] == TEST_COURSE_ID
        # Turkish characters in user name
        assert "Çağrı" in test_cert.get("user_name", "")
        assert "Şükrü" in test_cert.get("user_name", "")
        assert "Öztürk" in test_cert.get("user_name", "")
    
    def test_verify_certificate(self):
        """GET /api/certificates/{cert_id}/verify should return certificate info"""
        response = requests.get(
            f"{BASE_URL}/api/certificates/{TEST_CERT_ID}/verify"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
        # Check Turkish characters in response
        assert "Çağrı Şükrü Öztürk" in data["user_name"]
        assert "completed_at" in data
        # Course title with Turkish chars
        assert "EĞİTİMİ" in data["course_title"]
    
    def test_verify_invalid_certificate(self):
        """GET /api/certificates/{invalid_id}/verify should return 404"""
        response = requests.get(
            f"{BASE_URL}/api/certificates/invalid-cert-id/verify"
        )
        assert response.status_code == 404
    
    def test_download_certificate_pdf(self):
        """GET /api/certificates/{cert_id}/download should return valid PDF"""
        response = requests.get(
            f"{BASE_URL}/api/certificates/{TEST_CERT_ID}/download"
        )
        assert response.status_code == 200
        assert response.headers.get("content-type") == "application/pdf"
        
        # Save and verify PDF content
        pdf_content = response.content
        assert pdf_content.startswith(b"%PDF"), "Response is not a valid PDF"
        assert len(pdf_content) > 1000, "PDF seems too small"


class TestCertificatePDFContent:
    """PDF content verification tests"""
    
    @pytest.fixture
    def downloaded_pdf(self):
        """Download and return PDF content for analysis"""
        response = requests.get(
            f"{BASE_URL}/api/certificates/{TEST_CERT_ID}/download"
        )
        assert response.status_code == 200
        return response.content
    
    def test_pdf_turkish_characters(self, downloaded_pdf):
        """PDF should contain Turkish characters (ş, ç, ğ, ı, ö, ü, İ)"""
        import fitz  # pymupdf
        
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
            f.write(downloaded_pdf)
            pdf_path = f.name
        
        try:
            doc = fitz.open(pdf_path)
            page = doc[0]
            text = page.get_text()
            doc.close()
            
            # Verify Turkish characters render correctly
            assert "Çağrı" in text, "Turkish char Ç not found"
            assert "Şükrü" in text, "Turkish char Ş not found"
            assert "Öztürk" in text, "Turkish char Ö not found"
            assert "PROFİT" in text, "Turkish char İ not found"
            assert "BAŞARI" in text, "Turkish char Ş not found"
            assert "SERTİFİKASI" in text, "Turkish char İ not found"
            assert "EĞİTİMİ" in text or "EĞİTİM" in text, "Turkish char Ğ/İ not found"
            
            # Verify multiple Turkish special characters
            turkish_chars = ['ş', 'ğ', 'ı', 'İ', 'Ş', 'Ç', 'Ö']
            found_chars = [c for c in turkish_chars if c in text]
            assert len(found_chars) >= 5, f"Expected at least 5 Turkish chars, found: {found_chars}"
        finally:
            os.unlink(pdf_path)
    
    def test_pdf_no_qr_code_images(self, downloaded_pdf):
        """PDF should NOT contain any QR code or images"""
        import fitz
        
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
            f.write(downloaded_pdf)
            pdf_path = f.name
        
        try:
            doc = fitz.open(pdf_path)
            page = doc[0]
            images = page.get_images(full=True)
            doc.close()
            
            assert len(images) == 0, f"Found {len(images)} images in PDF - QR code should be removed"
        finally:
            os.unlink(pdf_path)
    
    def test_pdf_upper_leader_message(self, downloaded_pdf):
        """PDF should contain Upper Leader's congratulation message"""
        import fitz
        
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
            f.write(downloaded_pdf)
            pdf_path = f.name
        
        try:
            doc = fitz.open(pdf_path)
            page = doc[0]
            text = page.get_text()
            doc.close()
            
            # Check for congratulation message
            assert "Tebrik ederim" in text, "Congratulation message not found"
            assert "Başarıların" in text, "Başarıların text not found"
            assert "Eğitiminin Devamını Dilerim" in text, "Full congratulation message not found"
            
            # Check for upper leader name (should be Super Admin's name)
            assert "Muhammed Atak" in text, "Upper Leader name not found in PDF"
        finally:
            os.unlink(pdf_path)
    
    def test_pdf_certificate_structure(self, downloaded_pdf):
        """PDF should have proper certificate structure"""
        import fitz
        
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
            f.write(downloaded_pdf)
            pdf_path = f.name
        
        try:
            doc = fitz.open(pdf_path)
            page = doc[0]
            text = page.get_text()
            doc.close()
            
            # Check main certificate elements
            assert "PROFİT TEAM" in text, "Company name not found"
            assert "BAŞARI SERTİFİKASI" in text, "Certificate title not found"
            assert "Bu sertifika ile onaylanır ki" in text, "Certificate intro not found"
            assert "eğitimini başarıyla tamamlamıştır" in text, "Completion text not found"
            assert "Tamamlanma Tarihi:" in text, "Completion date label not found"
            assert "Doğrulama:" in text, "Verification label not found"
            assert TEST_CERT_ID in text, "Certificate ID not found"
        finally:
            os.unlink(pdf_path)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
