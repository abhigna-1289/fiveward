"""
FIVEWARD — Backend Configuration
Reads environment variables from the .env file.
"""

import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL     = os.getenv('SUPABASE_URL', '')
SUPABASE_KEY     = os.getenv('SUPABASE_SERVICE_KEY', '')  # service role key for backend
FLASK_SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'dev-secret-change-me')
ALLOWED_ORIGINS  = os.getenv('ALLOWED_ORIGINS', 'http://localhost:5500').split(',')
