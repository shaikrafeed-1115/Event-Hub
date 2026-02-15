const API_URL = 'http://localhost:3000/api';

// Check authentication
function checkAuth() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token) {
    window.location.href = 'login.html';
    return false;
  }
  
  // Display user info
  const userInfo = document.getElementById('user-info');
  if (userInfo) {
    userInfo.innerHTML = `
      <span class="user-name">Welcome, ${user.name}</span>
      ${user.role === 'admin' ? '<a href="admin.html" class="admin-link">Admin Panel</a>' : ''}
      <button onclick="logout()" class="logout-btn">Logout</button>
    `;
  }
  
  return token;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

// Load events on page load
document.addEventListener('DOMContentLoaded', () => {
  if (!checkAuth()) return;
  loadEvents();
  setupModal();
});

async function loadEvents() {
  try {
    const response = await fetch(`${API_URL}/events`);
    const events = await response.json();
    displayEvents(events);
  } catch (error) {
    console.error('Error loading events:', error);
    document.getElementById('events-container').innerHTML = 
      '<p style="color: white; text-align: center;">Error loading events. Make sure the server is running.</p>';
  }
}

function displayEvents(events) {
  const container = document.getElementById('events-container');
  
  if (events.length === 0) {
    container.innerHTML = '<p style="color: white; text-align: center;">No events available yet.</p>';
    return;
  }

  container.innerHTML = events.map(event => {
    const isFull = event.registered_count >= event.capacity;
    const percentage = (event.registered_count / event.capacity) * 100;
    
    return `
      <div class="event-card ${isFull ? 'full-event' : ''}">
        <h3>${event.title}</h3>
        <p>${event.description || 'No description available'}</p>
        <div class="event-info">
          <p>📅 ${formatDate(event.date)}</p>
          <p>🕐 ${event.time}</p>
          <p>📍 ${event.location}</p>
        </div>
        <div class="capacity-bar">
          <div class="capacity-fill" style="width: ${percentage}%"></div>
        </div>
        <p style="font-size: 0.9rem; color: #666; margin-bottom: 1rem;">
          ${event.registered_count}/${event.capacity} spots filled
        </p>
        ${isFull ? 
          '<span class="full-badge">EVENT FULL</span>' :
          `<button class="btn btn-primary" onclick="openRegistrationModal(${event.id}, '${event.title}')">Register Now</button>`
        }
      </div>
    `;
  }).join('');
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

function setupModal() {
  const modal = document.getElementById('registration-modal');
  const closeBtn = document.querySelector('.close');
  const form = document.getElementById('registration-form');

  closeBtn.onclick = () => modal.style.display = 'none';
  window.onclick = (e) => {
    if (e.target === modal) modal.style.display = 'none';
  };

  form.addEventListener('submit', handleRegistration);
}

function openRegistrationModal(eventId, eventTitle) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  document.getElementById('event-id').value = eventId;
  document.querySelector('#registration-modal h2').textContent = `Register for ${eventTitle}`;
  
  // Pre-fill user data
  if (user.name) document.getElementById('name').value = user.name;
  if (user.email) document.getElementById('email').value = user.email;
  
  document.getElementById('registration-modal').style.display = 'block';
}

async function handleRegistration(e) {
  e.preventDefault();
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const formData = {
    event_id: parseInt(document.getElementById('event-id').value),
    name: document.getElementById('name').value || user.name,
    email: document.getElementById('email').value || user.email,
    phone: document.getElementById('phone').value
  };

  try {
    const response = await fetch(`${API_URL}/registrations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (response.ok) {
      alert('Registration successful! Check your email for confirmation.');
      document.getElementById('registration-modal').style.display = 'none';
      e.target.reset();
      loadEvents();
    } else {
      alert('Error: ' + data.error);
    }
  } catch (error) {
    alert('Error submitting registration. Please try again.');
  }
}
