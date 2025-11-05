from datetime import datetime

class Comment:
    def __init__(self, content, thread_id, user_id=None):
        self.content = content
        self.date_created = datetime.utcnow()
        self.thread_id = thread_id
        self.user_id = user_id

    def to_dict(self):
        """Convert Comment object into a dictionary for MongoDB."""
        return {
            "content": self.content,
            "date_created": self.date_created,
            "thread_id": self.thread_id,
            "user_id": self.user_id
        }

