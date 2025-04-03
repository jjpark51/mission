import os
from openai import OpenAI
from typing import List, Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def generate_ai_response(message: str, conversation_history: List[Dict[str, Any]] = None) -> str:

    try:
        # format the conversation history for OpenAI
        messages = [{"role": "system", "content": "You are a helpful assistant."}]
        
        # add conversation history if provided
        if conversation_history:
            for msg in conversation_history:
                role = "user" if msg.get("is_user", True) else "assistant"
                messages.append({"role": role, "content": msg.get("content", "")})
        
        # add the current message
        messages.append({"role": "user", "content": message})
        
        # call OpenAI API with the new client format
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            max_tokens=500,
            temperature=0.7,
        )
        
        # extract and return the response text
        return response.choices[0].message.content
    
    except Exception as e:
        print(f"Error generating AI response: {str(e)}")
        return "I'm sorry, I'm having trouble processing your request right now."
