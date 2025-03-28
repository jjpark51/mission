# schemas.py
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

# User schemas (existing)
class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class User(UserBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)

# Token schemas (existing)
class Token(BaseModel):
    token: str
    token_type: str
    userId: int

class TokenData(BaseModel):
    username: Optional[str] = None

# Conversation schemas
class ConversationBase(BaseModel):
    title: str

class ConversationCreate(ConversationBase):
    user_id: int

class Conversation(ConversationBase):
    id: int
    user_id: int
    
    model_config = ConfigDict(from_attributes=True)

# Message schemas
class MessageBase(BaseModel):
    content: str
    is_user: bool = True  # Default to user message

class MessageCreate(MessageBase):
    conversation_id: int

class Message(MessageBase):
    id: int
    conversation_id: int
    
    model_config = ConfigDict(from_attributes=True)

# AI Message Request
class AIMessageRequest(BaseModel):
    conversation_id: int
    message: str