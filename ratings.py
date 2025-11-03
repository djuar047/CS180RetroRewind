from datetime import datetime
from bson import ObjectId

class Rating:
    def __init__(self, db):
        self.db = db

    def submit_rating(self, user_id, media_id, stars, review_text):
        rating_data = {
            "user_id": ObjectId(user_id),
            "media_id": ObjectId(media_id),
            "stars": stars,
            "reviewText": review_text,
            "dateCreated": datetime.utcnow()
        }
        return self.db.save("ratings", rating_data)

    def edit_rating(self, rating_id, new_stars=None, new_review=None):
        update_fields = {}
        if new_stars is not None:
            update_fields["stars"] = new_stars
        if new_review is not None:
            update_fields["reviewText"] = new_review
        self.db.update("ratings", {"_id": ObjectId(rating_id)}, update_fields)

    def get_average_rating(self, media_id):
        ratings = self.db.find("ratings", {"media_id": ObjectId(media_id)})
        if not ratings:
            return None
        return round(sum(r["stars"] for r in ratings) / len(ratings), 2)
