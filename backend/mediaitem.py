class MediaItem:
    def __init__(self, item_id, title, year, genre, type_, platform):
        self.item_id = item_id
        self.title = title
        self.year = year
        self.genre = genre
        self.type = type_  # "Movie" or "Game"
        self.platform = platform

    def get_details(self):
        return f"{self.title} ({self.year}) - {self.genre} [{self.type}]"
    
    def get_title(self):
        return self.title
