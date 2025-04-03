# ChatApp Frontend

## Project Overview and Key Strategies

Implement a real-time AI chatbot interface developed using React. 

### Key Strategies:

1. **Routing System**: implemented navigation between authentication and chat page via React Router.
2. **Token-Based Authentication**: maintained user sessions by storing JWT tokens in local storage.

## Installation and Setup Guide

### Requirements

- FastAPI backend server must be running

### Installation Steps

1. Clone the repository:
   ```bash
   git clone [URL]
   cd mission
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

Start the development server:
```bash
npm start
```

The application runs at `http://localhost:3000` by default.


## Core Features and User Journey

### Core Features

1. **User Authentication**
   - signup and login interface
   - Token-based authentication

2. **Conversation Interface**
   - Real-time message exchange
   - Message input and sending
   - Loading indicators response status

3. **Conversation Management**
   - Creating new conversations
   - Viewing previous conversations
   - Deleting conversations

4. **Responsive Design**
   - Optimized for various devices including desktop and mobile
   - Intuitive layout following ChatGPT's page UI

### User Journey

1. **Authentication Phase**:
   - Users see the login/signup screen when accessing the app.

2. **Conversation List**:
   - After logging in -> users can see their previous conversations in the sidebar.
   - They can start a new conversation by clicking the "New Chat" button.
   - Selecting a conversation loads its message history.

3. **Conversing with AI**:
   - Users can type messages in the input field and send them.
   - The AI response is displayed in the conversation area when it arrives.

4. **Conversation Delete**:
   - Users can delete conversations by clicking the delete icon next to specific conversations in the list.


