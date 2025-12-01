# backend/app.py

from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from routes.thread_routes import thread_bp
from routes.comment_routes import comment_bp

# Firebase-related auth routes (/auth/login, /auth/register, etc.)
from authorization_paths import auth_blueprint

# local username/password auth routes (/login, /register)
from routes.auth_routes import auth_bp

from routes.rating_routes import rating_bp
from routes.profile_routes import profile_bp
from routes.search_routes import search_bp

load_dotenv()


def create_app():
    app = Flask(__name__)

    CORS(
        app,
        resources={
            r"/*": {
                "origins": [
                    "http://localhost:5173",
                    "http://127.0.0.1:5173",
                ]
            }
        },
    )

    # existing blueprints
    app.register_blueprint(thread_bp)
    app.register_blueprint(comment_bp)

    # Firebase auth under /auth/...
    app.register_blueprint(auth_blueprint, url_prefix="/auth")

    # local auth under /login, /register
    app.register_blueprint(auth_bp)

    # ratings, profile, search
    app.register_blueprint(rating_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(search_bp)

    @app.get("/")
    def health():
        return jsonify({"ok": True})

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="127.0.0.1", port=5000, debug=True)

