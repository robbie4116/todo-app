# Todo App with JWT Authentication

A full-stack todo application built with React, TypeScript, Express, and MongoDB. Features JWT authentication with bcrypt password hashing.

## 🎯 What You'll Learn

### Backend Concepts
- **Express.js** - RESTful API creation
- **JWT (JSON Web Tokens)** - Token-based authentication
- **bcrypt** - Password hashing and security
- **MongoDB & Mongoose** - Database operations
- **Middleware** - Authentication & request handling
- **CORS** - Cross-Origin Resource Sharing

### Frontend Concepts
- **React with TypeScript** - Type-safe React development
- **React Router** - Client-side routing
- **Context API** - Global state management
- **Protected Routes** - Authentication-based access control
- **Axios** - HTTP requests with interceptors
- **shadcn/ui** - Modern component library

## 📁 Project Structure

```
todo-app/
├── backend/                 # Express API server
│   ├── src/
│   │   ├── models/         # MongoDB schemas (User, Todo)
│   │   ├── routes/         # API endpoints (auth, todos)
│   │   ├── middleware/     # Auth middleware (JWT verification)
│   │   ├── config/         # Database configuration
│   │   └── server.ts       # Main server file
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
└── frontend/               # React application
    ├── src/
    │   ├── components/ui/  # shadcn/ui components
    │   ├── contexts/       # Auth context (global state)
    │   ├── pages/          # Login & Todos pages
    │   ├── lib/            # Utility functions
    │   ├── App.tsx         # Main app with routing
    │   └── main.tsx        # Entry point
    ├── package.json
    └── vite.config.ts
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (free tier)

### Step 1: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free account
2. Create a new cluster (choose the free M0 tier)
3. Click "Connect" → "Connect your application"
4. Copy the connection string (looks like: `mongodb+srv://username:password@cluster...`)
5. Replace `<password>` with your actual password in the connection string

### Step 2: Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env file and add your MongoDB connection string
# Also add a secure JWT secret (random string)
```

Your `.env` file should look like:
```env
MONGODB_URI=mongodb+srv://yourusername:yourpassword@cluster0.xxxxx.mongodb.net/todoapp?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-random-string-here-make-it-long
PORT=5000
```

```bash
# Start the backend server
npm run dev
```

You should see:
```
✅ MongoDB connected successfully
🚀 Server is running on http://localhost:5000
```

### Step 3: Frontend Setup

Open a NEW terminal window:

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

### Step 4: Open in Browser

Open your browser and go to: **http://localhost:5173**

You should see the login page!

## 🔐 How Authentication Works

### Registration Flow:
1. User enters email, password, and name
2. Frontend sends POST request to `/api/auth/register`
3. Backend hashes password with bcrypt (happens automatically in User model)
4. User is saved to MongoDB
5. Backend generates JWT token with user ID and email
6. Token is sent back to frontend
7. Frontend stores token in localStorage
8. User is redirected to todos page

### Login Flow:
1. User enters email and password
2. Frontend sends POST request to `/api/auth/login`
3. Backend finds user by email
4. Backend compares password with hashed password using bcrypt
5. If valid, backend generates JWT token
6. Token is sent back to frontend
7. Frontend stores token in localStorage
8. User is redirected to todos page

### Protected Routes:
1. Frontend sends token in `Authorization: Bearer <token>` header
2. Backend middleware verifies token using JWT secret
3. If valid, request continues to route handler
4. If invalid, returns 401 Unauthorized

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login to existing account

### Todos (Protected - requires token)
- `GET /api/todos` - Get all todos for logged-in user
- `POST /api/todos` - Create new todo
- `PATCH /api/todos/:id` - Toggle todo completion
- `DELETE /api/todos/:id` - Delete todo

## 🧪 Testing the App

1. **Register a new account**
   - Click "Don't have an account? Sign up"
   - Enter name, email, and password (min 6 characters)
   - Click "Sign Up"

2. **Add todos**
   - Type in the input field
   - Click "Add"

3. **Toggle completion**
   - Click the circle icon to mark complete
   - Click the checkmark to mark incomplete

4. **Delete todos**
   - Click the trash icon

5. **Logout**
   - Click "Logout" button
   - You'll be redirected to login page

## 🔍 Key Files to Study

### Backend
- `src/models/User.ts` - See how passwords are hashed
- `src/middleware/auth.ts` - See how JWT tokens are verified
- `src/routes/auth.ts` - See how tokens are generated
- `src/routes/todos.ts` - See how protected routes work

### Frontend
- `src/contexts/AuthContext.tsx` - See how auth state is managed globally
- `src/pages/LoginPage.tsx` - See form handling and auth
- `src/App.tsx` - See protected routes implementation

## 🐛 Common Issues

### Backend won't start
- Make sure MongoDB URI is correct in `.env`
- Check if MongoDB Atlas IP whitelist includes your IP (or use 0.0.0.0/0 for testing)

### Frontend can't connect to backend
- Make sure backend is running on port 5000
- Check CORS settings in `backend/src/server.ts`

### "Invalid token" errors
- Check if token is being sent in Authorization header
- Verify JWT_SECRET is the same in `.env`

## 📚 Next Steps to Learn More

1. Add todo editing functionality
2. Add todo categories/tags
3. Add user profile page
4. Implement token refresh
5. Add password reset functionality
6. Deploy to production (Vercel + Railway/Render)

## 🎓 Learning Resources

- [JWT.io](https://jwt.io/) - Understand JWT structure
- [bcrypt](https://github.com/kelektiv/node.bcrypt.js) - Learn about password hashing
- [Express Middleware](https://expressjs.com/en/guide/using-middleware.html)
- [React Router](https://reactrouter.com/)
- [Mongoose Docs](https://mongoosejs.com/docs/guide.html)

## 🤝 Need Help?

If you get stuck:
1. Check the console for errors (browser and terminal)
2. Read the error messages carefully
3. Google the error message
4. Check that all dependencies are installed
5. Verify environment variables are set correctly

Happy coding! 🚀
