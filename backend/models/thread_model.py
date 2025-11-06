from datetime import datetime

class Thread:
    def __init__(self, title, content, user_id=None):
        self.title = title
        self.content = content
        self.date_created = datetime.utcnow()
        self.user_id = user_id
        self.comments = []

    def to_dict(self):
        """Convert Thread object into a dictionary for MongoDB."""
        return {
            "title": self.title,
            "content": self.content,
            "date_created": self.date_created,
            "user_id": self.user_id,
            "comments": self.comments
        }

