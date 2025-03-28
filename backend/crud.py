# crud.py
from sqlalchemy.orm import Session
from sqlalchemy import desc
import models
import schemas
from auth import get_password_hash, verify_password

# User operations
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    # Hash the password
    hashed_password = get_password_hash(user.password)
    
    # Create new user
    db_user = models.User(
        username=user.username,
        password=hashed_password
    )
    
    # Add to database
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

def authenticate_user(db: Session, username: str, password: str):
    # Get user by username
    user = get_user_by_username(db, username)
    
    # Return False if user not found or password doesn't match
    if not user or not verify_password(password, user.password):
        return False
        
    return user

# Conversation operations
def get_conversation(db: Session, conversation_id: int):
    return db.query(models.Conversation).filter(models.Conversation.id == conversation_id).first()

def get_user_conversations(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Conversation) \
             .filter(models.Conversation.user_id == user_id) \
             .offset(skip) \
             .limit(limit) \
             .all()

def create_conversation(db: Session, conversation: schemas.ConversationCreate):
    db_conversation = models.Conversation(
        user_id=conversation.user_id,
        title=conversation.title
    )
    db.add(db_conversation)
    db.commit()
    db.refresh(db_conversation)
    return db_conversation

def delete_conversation(db: Session, conversation_id: int):
    db_conversation = get_conversation(db, conversation_id)
    if db_conversation:
        db.delete(db_conversation)
        db.commit()
        return True
    return False

# Message operations
def get_message(db: Session, message_id: int):
    return db.query(models.Message).filter(models.Message.id == message_id).first()

def get_conversation_messages(db: Session, conversation_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Message) \
             .filter(models.Message.conversation_id == conversation_id) \
             .offset(skip) \
             .limit(limit) \
             .all()

def create_message(db: Session, message: schemas.MessageCreate):
    db_message = models.Message(
        conversation_id=message.conversation_id,
        is_user=message.is_user,
        content=message.content
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message