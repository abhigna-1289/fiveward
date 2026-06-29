"""
FIVEWARD — Progress Routes
Read and write user study progress via Supabase.
All endpoints require a valid Supabase JWT in the Authorization header.

Planned Supabase tables (create these in your Supabase dashboard):
  user_progress  — columns: user_id, subject_id, unit_id, topic_id, completed (bool), score (int)
  study_sessions — columns: user_id, subject_id, duration_seconds, started_at, ended_at
"""

from flask import Blueprint, request, jsonify

progress_bp = Blueprint('progress', __name__)


@progress_bp.route('/<subject_id>', methods=['GET'])
def get_progress(subject_id):
    """
    Returns the logged-in user's progress for a subject.
    TODO: Implement — verify JWT, query Supabase, return progress data.
    """
    return jsonify({'error': 'Not implemented yet'}), 501


@progress_bp.route('/<subject_id>', methods=['POST'])
def update_progress(subject_id):
    """
    Records that the user completed a topic or answered a question.
    Body: { unit_id, topic_id, score }
    TODO: Implement — verify JWT, upsert row in user_progress.
    """
    return jsonify({'error': 'Not implemented yet'}), 501


@progress_bp.route('/session/start', methods=['POST'])
def start_session():
    """
    Records the start of a study session.
    Body: { subject_id }
    TODO: Implement.
    """
    return jsonify({'error': 'Not implemented yet'}), 501


@progress_bp.route('/session/end', methods=['POST'])
def end_session():
    """
    Records the end of a study session with total duration.
    Body: { session_id, duration_seconds }
    TODO: Implement.
    """
    return jsonify({'error': 'Not implemented yet'}), 501
