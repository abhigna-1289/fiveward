"""
FIVEWARD — Auth Routes
Handles server-side auth helpers that require the service role key.
The service key is never sent to the browser.
"""

from flask import Blueprint, request, jsonify
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY

auth_bp = Blueprint('auth', __name__)

# Lazily initialised admin client (uses service role key)
_admin = None

def _get_admin():
    global _admin
    if _admin is None:
        _admin = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _admin


@auth_bp.route('/confirm-email', methods=['POST'])
def confirm_email():
    """
    Immediately confirms a user's email so they can sign in without
    clicking a confirmation link.  Called right after signUp from auth.js.
    Body: { "user_id": "<uuid>" }
    """
    body = request.get_json(silent=True) or {}
    user_id = (body.get('user_id') or '').strip()

    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400

    try:
        _get_admin().auth.admin.update_user_by_id(user_id, {'email_confirm': True})
        return jsonify({'success': True})
    except Exception as exc:
        return jsonify({'error': str(exc)}), 500


@auth_bp.route('/verify', methods=['POST'])
def verify_token():
    """Verify a Supabase JWT — TODO: implement when backend routes need auth."""
    return jsonify({'error': 'Not implemented yet'}), 501
