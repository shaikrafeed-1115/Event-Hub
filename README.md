# Event Registration System

A full-stack event management system with user registration and admin panel.

## Features

- Browse upcoming events
- Register for events with capacity control
- Admin panel to create and manage events
- View attendee lists
- SQLite database for data persistence
- Responsive design

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Database: SQLite

## Setup Instructions

1. Install dependencies:
```
cd backend
npm install
```

2. Start the server:
```
npm start
```

3. Open your browser and navigate to:
- User Interface: http://localhost:3000
- Admin Panel: http://localhost:3000/admin.html

## Project Structure

```
event-registration/
├── backend/
│   ├── server.js          # Express server and API routes
│   ├── database.js        # SQLite database setup
│   └── package.json       # Backend dependencies
├── public/
│   ├── index.html         # User interface
│   ├── admin.html         # Admin panel
│   ├── style.css          # Styling
│   └── script.js          # Frontend logic
└── README.md
```

## API Endpoints

- GET /api/events - Get all events
- GET /api/events/:id - Get single event
- POST /api/events - Create event (admin)
- POST /api/registrations - Register for event
- GET /api/events/:id/registrations - Get event registrations (admin)
- DELETE /api/events/:id - Delete event (admin)
