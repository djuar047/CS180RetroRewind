from flask import Blueprint
from controllers.thread_controller import create_thread, get_all_threads

thread_bp = Blueprint("thread_bp", __name__)

# Routes
thread_bp.route("/threads", methods=["POST"])(create_thread)
thread_bp.route("/threads", methods=["GET"])(get_all_threads)

