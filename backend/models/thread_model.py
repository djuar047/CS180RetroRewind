from datetime import datetime

class Thread:
    def __init__(self, title, content, user_id=None, category="General"):
        self.title = title
        self.content = content
        self.date_created = datetime.utcnow()
        self.user_id = user_id
        self.category = category or "General"
        self.comments = []

    def to_dict(self):
        return {
            "title": self.title,
            "content": self.content,
            "date_created": self.date_created,
            "user_id": self.user_id,
            "category": self.category,
            "comments": self.comments,
        }
