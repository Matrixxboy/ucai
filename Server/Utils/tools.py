from duckduckgo_search import DDGS

def search_web(query: str, max_results: int = 3) -> str:
    """Searches the web and returns a formatted string of results."""
    try:
        results = DDGS().text(query, max_results=max_results)
        if not results:
            return "No results found."
        
        formatted = ""
        for i, res in enumerate(results):
            formatted += f"[{i+1}] {res['title']}\n{res['body']}\nSource: {res['href']}\n\n"
        return formatted
    except Exception as e:
        print(f"Search failed: {e}")
        return f"Error searching web: {str(e)}"
