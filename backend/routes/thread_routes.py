from flask import Blueprint
from controllers.thread_controller import (
    create_thread,
    get_all_threads,
    get_thread_by_id,
    update_thread,
    delete_thread,
)

thread_bp = Blueprint("thread_bp", __name__)

thread_bp.route("/threads", methods=["POST"])(create_thread)
thread_bp.route("/threads", methods=["GET"])(get_all_threads)
thread_bp.route("/threads/<thread_id>", methods=["GET"])(get_thread_by_id)
thread_bp.route("/threads/<thread_id>", methods=["PUT"])(update_thread)
thread_bp.route("/threads/<thread_id>", methods=["DELETE"])(delete_thread)
