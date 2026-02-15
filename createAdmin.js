const bcrypt = require('bcrypt');
const db = require('./database');

async function createAdmin() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  db.run(
    `INSERT OR REPLACE INTO users (id, email, password, name, role) 
     VALUES (1, 'admin@event.com', ?, 'Admin', 'admin')`,
    [hashedPassword],
    (err) => {
      if (err) {
        console.error('Error creating admin:', err);
      } else {
        console.log('Admin user created successfully!');
        console.log('Email: admin@event.com');
        console.log('Password: admin123');
      }
      db.close();
    }
  );
}

createAdmin();
