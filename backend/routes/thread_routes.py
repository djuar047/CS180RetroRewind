from flask import Blueprint
from controllers.thread_controller import create_thread, get_all_threads, update_thread, delete_thread

thread_bp = Blueprint("thread_bp", __name__)

# Routes
thread_bp.route("/threads", methods=["POST"])(create_thread)
thread_bp.route("/threads", methods=["GET"])(get_all_threads)
thread_bp.route("/threads/<title>", methods=["PUT"])(update_thread)
thread_bp.route("/threads/<title>", methods=["DELETE"])(delete_thread)
