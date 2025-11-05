from flask import Blueprint
from controllers.comment_controller import post_comment, get_comments_by_thread

comment_bp = Blueprint("comment_bp", __name__)

# Routes
comment_bp.route("/comments", methods=["POST"])(post_comment)
comment_bp.route("/comments/<thread_id>", methods=["GET"])(get_comments_by_thread)

