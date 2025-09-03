import pytesseract
from PIL import Image
from pdf2image import convert_from_path
import os
import tempfile
from typing import Optional

class OCRService:
    @staticmethod
    def extract_text_from_file(file_path: str) -> Optional[str]:
        """Extract text from image or PDF file"""
        try:
            file_ext = os.path.splitext(file_path)[1].lower()
            
            if file_ext in ['.jpg', '.jpeg', '.png']:
                return OCRService._extract_from_image(file_path)
            elif file_ext == '.pdf':
                return OCRService._extract_from_pdf(file_path)
            else:
                return None
                
        except Exception as e:
            print(f"OCR extraction failed: {str(e)}")
            return None
    
    @staticmethod
    def _extract_from_image(image_path: str) -> str:
        """Extract text from image file"""
        image = Image.open(image_path)
        text = pytesseract.image_to_string(image)
        return text.strip()
    
    @staticmethod
    def _extract_from_pdf(pdf_path: str) -> str:
        """Extract text from PDF file"""
        pages = convert_from_path(pdf_path, first_page=1, last_page=3)  # Limit to first 3 pages
        extracted_text = []
        
        for page in pages:
            text = pytesseract.image_to_string(page)
            if text.strip():
                extracted_text.append(text.strip())
        
        return '\n\n'.join(extracted_text)