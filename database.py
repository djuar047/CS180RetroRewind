from pymongo import MongoClient

from bson import ObjectId

class database_beary:
    def __init__(self, uri="mongodb://localhost:27017/", db_name="retro_rewind"):
        self.client = MongoClient(uri)
        self.db = self.client[db_name]

    def save(self, collection, data):
        result = self.db[collection].insert_one(data)
        return str(result.inserted_id)

    def find(self, collection, query):
        return list(self.db[collection].find(query))

    def update(self, collection, query, new_values):
        return self.db[collection].update_one(query, {"$set": new_values})

    def delete(self, collection, query):
        return self.db[collection].delete_one(query)