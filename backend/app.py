from flask import Flask
from routes.thread_routes import thread_bp
from routes.comment_routes import comment_bp

app = Flask(__name__)

# Register thread routes
app.register_blueprint(thread_bp)
app.register_blueprint(comment_bp)

if __name__ == "__main__":
    app.run(debug=True, port=5001)

