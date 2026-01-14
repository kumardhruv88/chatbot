import re
from typing import AsyncIterator, List
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from ..config import get_settings
from ..models.thread import Message
from .image_service import ImageGenerationService

settings = get_settings()


class LLMService:
    """LLM service using Groq with streaming support."""
    
    def __init__(self):
        # Primary model for text
        self.llm = ChatGroq(
            api_key=settings.groq_api_key,
            model_name="llama-3.3-70b-versatile",
            temperature=0.7,
            streaming=True
        )
        
        # Vision model for image analysis
        self.vision_llm = ChatGroq(
            api_key=settings.groq_api_key,
            model_name="llama-3.2-11b-vision-preview",
            temperature=0.5,
            streaming=True
        )
        
        self.image_gen = ImageGenerationService()
        
        self.system_prompt = """You are a helpful AI assistant with access to uploaded documents, web search, and image capabilities.
When answering:
1. Use context from documents/web when available.
2. If the user sends an image, analyze it using your vision capabilities.
3. If the user asks to generate an image, the system will handle it, but you should frame the conversation helpfuly.
4. Be concise but thorough."""
    
    async def stream_chat(
        self,
        message: str,
        context: str = "",
        image_data: str = None,
        history: List[Message] = None
    ) -> AsyncIterator[str]:
        """Stream chat completion response."""
        
        # 1. Image Generation Check
        # Robust regex for image generation triggers
        # Matches: "generate an image", "create a picture", "draw me a landscape", etc.
        image_trigger_pattern = r"(?i)(generate|create|draw|make|render).{0,50}(image|picture|photo|painting|artwork)"
        
        if re.search(image_trigger_pattern, message) and len(message) < 300:
            # Extract prompt - use whole message for now
            # In future: could use LLM to extract prompt
            image_url = self.image_gen.generate(message)
            response = f"Here is the image you requested:\n\n![Generated Image]({image_url})\n"
            yield response
            return # Stop processing
            
        # 2. Build Message Chain
        messages = [SystemMessage(content=self.system_prompt)]
        
        # Add conversation history
        # Note: We currently only load text history to save tokens/complexity
        if history:
            for msg in history:
                if msg.role == "user":
                    messages.append(HumanMessage(content=msg.content))
                elif msg.role == "assistant":
                    messages.append(AIMessage(content=msg.content))
        
        # 3. Build User Message
        user_content = message
        if context:
            user_content = f"Context information:\n{context}\n\nUser question: {message}"
            
        # If Image Data is present, construct Multi-modal message
        if image_data:
            # Clean base64 string if it has headers
            if "base64," in image_data:
                image_data = image_data.split("base64,")[1]
                
            msg_content = [
                {"type": "text", "text": user_content},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{image_data}",
                    },
                },
            ]
            final_message = HumanMessage(content=msg_content)
            selected_llm = self.vision_llm  # Use Vision Model
        else:
            final_message = HumanMessage(content=user_content)
            selected_llm = self.llm         # Use Text Model
            
        messages.append(final_message)
        
        # Stream response
        try:
            async for chunk in selected_llm.astream(messages):
                if hasattr(chunk, 'content'):
                    yield chunk.content
        except Exception as e:
            yield f"Error generating response: {str(e)}"

    async def generate_title(self, first_message: str) -> str:
        """Generate a concise title for a conversation based on the first message."""
        
        prompt = f"""Generate a very short, concise title (2-4 words max) for a conversation that starts with this message:

"{first_message}"

Only return the title, nothing else.
Title:"""
        
        messages = [HumanMessage(content=prompt)]
        
        # Get response without streaming
        response = await self.llm.ainvoke(messages)
        title = response.content.strip().strip('"').strip("'")
        
        if len(title) > 50:
            title = title[:47] + "..."
        
        return title
