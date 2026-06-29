"""
FIVEWARD — Flask Backend Entry Point
Handles API routes for progress tracking.
Auth is handled entirely by Supabase on the frontend.

Run locally:
    pip install -r requirements.txt
    python app.py

Deploy to Render:
    Set environment variables in the Render dashboard.
    Start command: gunicorn app:app
"""

from flask import Flask
from flask_cors import CORS

from config import FLASK_SECRET_KEY, ALLOWED_ORIGINS
from routes.progress_routes import progress_bp
from routes.auth_routes import auth_bp

app = Flask(__name__)
app.secret_key = FLASK_SECRET_KEY

# Allow requests from the Vercel frontend (and localhost for development)
CORS(app, origins=ALLOWED_ORIGINS)

# Register route blueprints
app.register_blueprint(progress_bp, url_prefix='/api/progress')
app.register_blueprint(auth_bp,     url_prefix='/api/auth')


@app.route('/api/health')
def health_check():
    return {'status': 'ok', 'service': 'fiveward-api'}


if __name__ == '__main__':
    app.run(debug=True, port=5000)
