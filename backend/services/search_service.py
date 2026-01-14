from typing import Dict
from tavily import TavilyClient

from ..config import get_settings

settings = get_settings()


class SearchService:
    """Web search integration using Tavily."""
    
    def __init__(self):
        self.client = TavilyClient(api_key=settings.tavily_api_key)
    
    async def search(
        self, 
        query: str, 
        max_results: int = 3
    ) -> Dict[str, any]:
        """Perform web search and return formatted results."""
        
        try:
            # Perform search
            response = self.client.search(
                query=query,
                max_results=max_results,
                include_answer=True,
                include_raw_content=False
            )
            
            # Format results
            context_parts = []
            sources = []
            
            # Add Tavily's AI-generated answer if available
            if response.get("answer"):
                context_parts.append(f"Summary: {response['answer']}")
            
            # Add individual search results
            for result in response.get("results", []):
                title = result.get("title", "")
                content = result.get("content", "")
                url = result.get("url", "")
                
                if content:
                    context_parts.append(f"[{title}]\n{content}")
                    sources.append(url)
            
            context = "\n\n".join(context_parts)
            
            return {
                "context": context,
                "sources": sources
            }
            
        except Exception as e:
            print(f"Search error: {str(e)}")
            return {"context": "", "sources": []}
