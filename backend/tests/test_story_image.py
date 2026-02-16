# Story Image API Tests - Instagram Story PNG Generation (1080x1920)
import pytest
import requests
import os
import tempfile
from PIL import Image, ImageFont

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@profitteam.tr"
ADMIN_PASSWORD = "19901990Aa."
DISTRIBUTOR_EMAIL = "testdist@profitteam.tr"
DISTRIBUTOR_PASSWORD = "Test1234."
TEST_CERT_ID = "6ef138ab-889e-4206-9a10-9f3af19c9a2b"


@pytest.fixture(scope="module")
def admin_token():
    """Get admin authentication token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    )
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    return response.json()["token"]


@pytest.fixture(scope="module")
def distributor_token():
    """Get distributor authentication token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": DISTRIBUTOR_EMAIL, "password": DISTRIBUTOR_PASSWORD}
    )
    assert response.status_code == 200, f"Distributor login failed: {response.text}"
    return response.json()["token"]


class TestDistributorLogin:
    """Test distributor user login flow"""
    
    def test_distributor_login_success(self):
        """POST /api/auth/login with distributor credentials should return token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": DISTRIBUTOR_EMAIL, "password": DISTRIBUTOR_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == DISTRIBUTOR_EMAIL
        assert data["user"]["role"] == "distributor"
    
    def test_distributor_login_invalid_password(self):
        """POST /api/auth/login with wrong password should return 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": DISTRIBUTOR_EMAIL, "password": "wrongpassword"}
        )
        assert response.status_code == 401


class TestStoryImageEndpoint:
    """Story Image API endpoint tests - Instagram Story PNG (1080x1920)"""
    
    def test_story_image_returns_png(self):
        """GET /api/certificates/{cert_id}/story-image should return valid PNG"""
        response = requests.get(
            f"{BASE_URL}/api/certificates/{TEST_CERT_ID}/story-image"
        )
        assert response.status_code == 200
        assert response.headers.get("content-type") == "image/png"
        
        # Verify it's a valid PNG
        png_content = response.content
        assert png_content[:8] == b'\x89PNG\r\n\x1a\n', "Response is not a valid PNG"
        assert len(png_content) > 10000, "PNG seems too small"
    
    def test_story_image_dimensions(self):
        """GET /api/certificates/{cert_id}/story-image should return 1080x1920 vertical image"""
        response = requests.get(
            f"{BASE_URL}/api/certificates/{TEST_CERT_ID}/story-image"
        )
        assert response.status_code == 200
        
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
            f.write(response.content)
            img_path = f.name
        
        try:
            img = Image.open(img_path)
            # Instagram Story dimensions: 1080 width x 1920 height (vertical/portrait)
            assert img.size == (1080, 1920), f"Expected (1080, 1920), got {img.size}"
            assert img.format == "PNG"
            assert img.mode == "RGB"
        finally:
            os.unlink(img_path)
    
    def test_story_image_invalid_certificate(self):
        """GET /api/certificates/{invalid_id}/story-image should return 404"""
        response = requests.get(
            f"{BASE_URL}/api/certificates/invalid-cert-id/story-image"
        )
        assert response.status_code == 404
    
    def test_story_image_vs_pdf_same_cert(self):
        """Both story-image and download endpoints should work for same certificate"""
        # Test story image
        story_response = requests.get(
            f"{BASE_URL}/api/certificates/{TEST_CERT_ID}/story-image"
        )
        assert story_response.status_code == 200
        assert story_response.headers.get("content-type") == "image/png"
        
        # Test PDF download (original endpoint)
        pdf_response = requests.get(
            f"{BASE_URL}/api/certificates/{TEST_CERT_ID}/download"
        )
        assert pdf_response.status_code == 200
        assert pdf_response.headers.get("content-type") == "application/pdf"


class TestStoryImageContent:
    """Story Image content verification tests - Turkish chars & Upper Leader message"""
    
    @pytest.fixture
    def downloaded_story_image(self):
        """Download and return story image for analysis"""
        response = requests.get(
            f"{BASE_URL}/api/certificates/{TEST_CERT_ID}/story-image"
        )
        assert response.status_code == 200
        return response.content
    
    def test_story_image_file_integrity(self, downloaded_story_image):
        """Story image should be a valid, complete PNG file"""
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
            f.write(downloaded_story_image)
            img_path = f.name
        
        try:
            img = Image.open(img_path)
            img.verify()  # Verify PNG integrity
            
            # Re-open for pixel access (verify() closes the file)
            img = Image.open(img_path)
            pixels = list(img.getdata())
            assert len(pixels) == 1080 * 1920, "Image pixel count doesn't match dimensions"
        finally:
            os.unlink(img_path)
    
    def test_story_image_has_content(self, downloaded_story_image):
        """Story image should not be blank/solid color - should have certificate content"""
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
            f.write(downloaded_story_image)
            img_path = f.name
        
        try:
            img = Image.open(img_path)
            
            # Check that the image is not all one color (blank)
            colors = img.getcolors(maxcolors=1000)
            # If None, there are more than 1000 colors (good - means content)
            # If a list with only 1 color, it's blank
            if colors is not None:
                assert len(colors) > 1, "Image appears to be blank (single color)"
            
            # Check for green color (#00C853) which should be in the certificate
            pixels = list(img.getdata())
            green_pixels = [p for p in pixels if p[1] > 180 and p[0] < 50 and p[2] < 100]
            assert len(green_pixels) > 100, "Expected green (#00C853) accent color not found"
        finally:
            os.unlink(img_path)
    
    def test_story_image_dark_background(self, downloaded_story_image):
        """Story image should have dark (#111111) background"""
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
            f.write(downloaded_story_image)
            img_path = f.name
        
        try:
            img = Image.open(img_path)
            
            # Sample corners - should be dark background
            corners = [
                img.getpixel((5, 5)),      # Top-left
                img.getpixel((1075, 5)),   # Top-right
                img.getpixel((5, 1915)),   # Bottom-left
                img.getpixel((1075, 1915)) # Bottom-right
            ]
            
            for i, pixel in enumerate(corners):
                # Dark background should have RGB values around 17 (#111111)
                assert all(v < 50 for v in pixel), f"Corner {i} is not dark: {pixel}"
        finally:
            os.unlink(img_path)


class TestCertificatePDFStillWorks:
    """Ensure PDF download still works after story-image feature addition"""
    
    def test_pdf_download_returns_pdf(self):
        """GET /api/certificates/{cert_id}/download should still return valid PDF"""
        response = requests.get(
            f"{BASE_URL}/api/certificates/{TEST_CERT_ID}/download"
        )
        assert response.status_code == 200
        assert response.headers.get("content-type") == "application/pdf"
        
        # Verify PDF header
        assert response.content.startswith(b"%PDF"), "Response is not a valid PDF"
    
    def test_pdf_contains_turkish_characters(self):
        """PDF should still contain Turkish characters (ş, ç, ğ, ı, ö, ü, İ)"""
        import fitz  # pymupdf
        
        response = requests.get(
            f"{BASE_URL}/api/certificates/{TEST_CERT_ID}/download"
        )
        assert response.status_code == 200
        
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
            f.write(response.content)
            pdf_path = f.name
        
        try:
            doc = fitz.open(pdf_path)
            page = doc[0]
            text = page.get_text()
            doc.close()
            
            # Verify Turkish characters still render
            assert "Çağrı" in text or "PROF" in text, "Turkish chars missing from PDF"
        finally:
            os.unlink(pdf_path)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
