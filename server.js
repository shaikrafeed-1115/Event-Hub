const express = require('express');
const cors = require('cors');
const db = require('./database');
const path = require('path');
const { sendRegistrationEmail } = require('./emailService');
const { hashPassword, comparePassword, generateToken, authenticateToken, isAdmin } = require('./auth');
const { checkAndSendReminders } = require('./reminderService');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Redirect root to welcome page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/welcome.html'));
});

app.use(express.static(path.join(__dirname, '../public')));

// Start reminder service
console.log('Event reminder service started');

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, name } = req.body;
  
  try {
    const hashedPassword = await hashPassword(password);
    db.run(
      `INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, 'user')`,
      [email, hashedPassword, name],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            res.status(400).json({ error: 'Email already registered' });
          } else {
            res.status(500).json({ error: err.message });
          }
        } else {
          const token = generateToken({ id: this.lastID, email, role: 'user' });
          res.json({ token, user: { id: this.lastID, email, name, role: 'user' } });
        }
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const validPassword = await comparePassword(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const token = generateToken(user);
    res.json({ 
      token, 
      user: { id: user.id, email: user.email, name: user.name, role: user.role } 
    });
  });
});

// Get all events
app.get('/api/events', (req, res) => {
  db.all(`SELECT e.*, 
    (SELECT COUNT(*) FROM registrations WHERE event_id = e.id) as registered_count
    FROM events e ORDER BY date ASC`, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Get single event
app.get('/api/events/:id', (req, res) => {
  db.get(`SELECT e.*,
    (SELECT COUNT(*) FROM registrations WHERE event_id = e.id) as registered_count
    FROM events e WHERE e.id = ?`, [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (!row) {
      res.status(404).json({ error: 'Event not found' });
    } else {
      res.json(row);
    }
  });
});

// Create event (admin)
app.post('/api/events', (req, res) => {
  const { title, description, date, time, location, capacity } = req.body;
  db.run(`INSERT INTO events (title, description, date, time, location, capacity)
    VALUES (?, ?, ?, ?, ?, ?)`,
    [title, description, date, time, location, capacity],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ id: this.lastID, message: 'Event created successfully' });
      }
    }
  );
});

// Register for event
app.post('/api/registrations', (req, res) => {
  const { event_id, name, email, phone } = req.body;
  
  db.get('SELECT capacity, (SELECT COUNT(*) FROM registrations WHERE event_id = ?) as registered FROM events WHERE id = ?',
    [event_id, event_id], (err, event) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      if (event.registered >= event.capacity) {
        return res.status(400).json({ error: 'Event is full' });
      }

      db.run(`INSERT INTO registrations (event_id, name, email, phone)
        VALUES (?, ?, ?, ?)`,
        [event_id, name, email, phone],
        async function(err) {
          if (err) {
            if (err.message.includes('UNIQUE')) {
              res.status(400).json({ error: 'Already registered for this event' });
            } else {
              res.status(500).json({ error: err.message });
            }
          } else {
            const registrationId = this.lastID;
            
            // Get event details for email
            db.get('SELECT * FROM events WHERE id = ?', [event_id], async (err, eventDetails) => {
              if (!err && eventDetails) {
                // Send confirmation email
                const registration = { id: registrationId, name, email, phone };
                await sendRegistrationEmail(registration, eventDetails);
              }
            });
            
            res.json({ id: registrationId, message: 'Registration successful! Check your email for confirmation.' });
          }
        }
      );
    }
  );
});

// Get registrations for an event (admin)
app.get('/api/events/:id/registrations', (req, res) => {
  db.all(`SELECT * FROM registrations WHERE event_id = ? ORDER BY registered_at DESC`,
    [req.params.id], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(rows);
      }
    }
  );
});

// Delete event (admin)
app.delete('/api/events/:id', (req, res) => {
  db.run('DELETE FROM registrations WHERE event_id = ?', [req.params.id], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    db.run('DELETE FROM events WHERE id = ?', [req.params.id], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ message: 'Event deleted successfully' });
      }
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
