# main.py
import uvicorn
from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
import crud
import auth
import ai
from database import engine, get_db

# create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Chat App API")

# configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------
# autentication routes
@app.post("/api/auth/signup")
async def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_username(db, username=user.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # create new user
    db_user = crud.create_user(db=db, user=user)
    
    # generate JWT token
    access_token = auth.create_access_token(data={"sub": db_user.username})
    
    return {
        "token": access_token,
        "token_type": "bearer",
        "userId": db_user.id
    }

@app.post("/api/auth/login")
async def login(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    # authenticate user
    user = crud.authenticate_user(
        db, 
        username=user_credentials.username, 
        password=user_credentials.password
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # generate JWT token
    access_token = auth.create_access_token(data={"sub": user.username})
    
    # match the response format expected by the frontend
    return {
        "token": access_token,
        "token_type": "bearer",
        "userId": user.id
    }
#
# -----------------------------------------------
# user endpoints

@app.get("/api/users/{user_id}", response_model=schemas.User)
def get_user_by_id(
    user_id: int, 
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this user's data"
        )
    
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

# conversation endpoints
@app.get("/api/users/{user_id}/conversations", response_model=List[schemas.Conversation])
def get_user_conversations(
    user_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this user's conversations"
        )
    
    return crud.get_user_conversations(db, user_id=user_id)

@app.post("/api/conversations", response_model=schemas.Conversation)
def create_conversation(
    conversation: schemas.ConversationCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.id != conversation.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create conversations for other users"
        )
    
    return crud.create_conversation(db=db, conversation=conversation)

@app.get("/api/conversations/{conversation_id}/messages", response_model=List[schemas.Message])
def get_conversation_messages(
    conversation_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # check if conversation exists
    conversation = crud.get_conversation(db, conversation_id=conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if conversation.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this conversation"
        )
    
    return crud.get_conversation_messages(db, conversation_id=conversation_id)

@app.delete("/api/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # check if conversation exists
    conversation = crud.get_conversation(db, conversation_id=conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if conversation.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this conversation"
        )
    
    # delete the conversation
    deleted = crud.delete_conversation(db, conversation_id=conversation_id)
    
    if not deleted:
        raise HTTPException(status_code=500, detail="Failed to delete conversation")
    
    return {"detail": "Conversation deleted successfully"}
# message endpoints
@app.post("/api/messages", response_model=schemas.Message)
def create_message(
    message: schemas.MessageCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # check if conversation exists
    conversation = crud.get_conversation(db, conversation_id=message.conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if conversation.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to add messages to this conversation"
        )
    
    return crud.create_message(db=db, message=message)

# AI endpoints
@app.post("/api/ai/generate", response_model=schemas.Message)
async def generate_ai_response(
    request: schemas.AIMessageRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # check if conversation exists
    conversation = crud.get_conversation(db, conversation_id=request.conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if conversation.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this conversation"
        )
    
    # get conversation history for context
    conversation_messages = crud.get_conversation_messages(
        db, conversation_id=request.conversation_id, limit=10
    )
    
    # convert to format for AI module
    conversation_history = [
        {"is_user": msg.is_user, "content": msg.content}
        for msg in conversation_messages[-10:]  # last 10 messages
    ]
    
    # generate AI response
    ai_response_text = await ai.generate_ai_response(
        message=request.message,
        conversation_history=conversation_history
    )
    
    # create AI message in database
    ai_message = schemas.MessageCreate(
        conversation_id=request.conversation_id,
        is_user=False,  
        content=ai_response_text
    )
    
    return crud.create_message(db=db, message=ai_message)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)