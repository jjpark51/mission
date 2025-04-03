# ChatApp Backend

## Project Overview and Key Strategies

ChatApp Backend is built on the FastAPI framework and provides user authentication, conversation creation/delete, and integration with the OpenAI API.

### Key Strategies:

1. **Layered Architecture**: code is separated into components like models, schemas, crud, and auth to improve readability
2. **Token-based Authentication**: Implemented secure user authentication and authorization using JWT.
3. **Relational Database**: managed relationships between users, conversations, and messages using SQLAlchemy ORM with MySQL.

## Installation and Setup Guide

### Requirements

- MySQL server
- `.env` file for environment variable management

### Installation Steps

1. Clone the repository:
   ```bash
   git clone [URL]
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # this is for ubuntu
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure the `.env` file:
   ```
   # Database settings
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_HOST=localhost
   DB_NAME=chatapp_db
   
   # JWT settings
   SECRET_KEY=your_secret_key
   
   # OpenAI API settings
   OPENAI_API_KEY=your_openai_api_key
   ```

5. DB setup with MySQL workbench:
   - open MySQL Workbench and connect to your MySQL server
   - create a new DB:

   ```sql
   CREATE DATABASE chatapp_db;
   ```
   - the application will automatically create the tables when it first runs, using SQLAlchemy's create_all() function

### Running the Application

Start the application:
```bash
python main.py
```

The server runs at `http://localhost:8000` by default.

## Core Features and User Journey

### Core Features

1. **User Management**
   - signup and login processing
   - JWT token-based authentication

2. **Conversation Management**
   - creating new conversations
   - retrieving conversations by user
   - deleting conversations

3. **Message Processing**
   - storing messages within conversations
   - generating AI responses to user messages
   - managing conversation history

4. **AI Integration**
   - generating responses via OpenAI API

### User Journey

1. **Authentication Process**:
   - users register or log in.
   - server validates user information and issues a JWT token.
   - all subsequent requests are authenticated via this token.

2. **Starting Conversations**:
   - users can create new conversations.
   - the server generates a conversation ID and returns it to the user.

3. **Message Exchange**:
   - when a user sends a message, the server stores it.
   - the server calls the OpenAI API to generate a response.
   - AI responses are also stored in the DB to maintain conversation history.

4. **Conversation Management**:
   - users can view their past conversation list.
   - conversations can be deleted.

### DB Management
-> MySQL Workbench

1. user-conversation relationship:

- one-to-many relationship where each user can have multiple conversations
- implemented via a foreign key (user_id) in the conversations table

2. conversation-message relationship:

- one-to-many relationship where each conversation contains multiple messages
- implemented via a foreign key (conversation_id) in the Messages table
- messages are ordered in time order
- each message has an is_user boolean flag to tell between user messages and GPT
- 

3. conversation context preservation:

- all messages within a conversation are linked via their conversation_id
- when generating GPT responses, the system retrieves previous messages to maintain context


4.  message handling:

- user messages and GPT responses are stored with distinct is_user flags
- This allows for different styling in the frontend

5. cascading deletion:

- when a user is deleted -> all their conversations are removed
- when a conversation is deleted -> all messages are removed
- this prevents orphaned records


6. optimization techniques:

- the conversation title is stored for quick reference in the UI without loading all messages
