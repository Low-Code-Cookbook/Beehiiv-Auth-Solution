// Function to get the JWT token from localStorage
const getToken = () => {
  return localStorage.getItem('authToken');
};

// Function to parse JWT token
const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error parsing JWT:', e);
    return null;
  }
};

// Function to display user information from the token
const displayUserInfo = () => {
  const token = getToken();
  if (!token) {
    redirectToLogin("No authentication token found");
    return;
  }
  
  // Display the token
  document.getElementById('tokenDisplay').textContent = token;
  
  // Parse and display user info from token
  const payload = parseJwt(token);
  if (payload) {
    document.getElementById('userEmail').textContent = payload.email || 'Not available';
    document.getElementById('userId').textContent = payload.userId || 'Not available';
    document.getElementById('isSubscriber').textContent = 'Yes (verified)';
  } else {
    showMessage("Could not parse JWT token", "error");
  }
};

// Function to verify the token with the backend
const verifyToken = async () => {
  const token = getToken();
  if (!token) {
    redirectToLogin("No authentication token found");
    return;
  }
  
  // Show loading state
  document.getElementById('loader').classList.remove('hidden');
  document.getElementById('verifyTokenBtn').disabled = true;
  
  try {
    const response = await fetch('/auth/verify', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.ok && data.valid) {
      showMessage("Token is valid!", "success");
    } else {
      showMessage(`Token verification failed: ${data.message || 'Unknown error'}`, "error");
    }
  } catch (error) {
    showMessage(`Error verifying token: ${error.message}`, "error");
  } finally {
    document.getElementById('loader').classList.add('hidden');
    document.getElementById('verifyTokenBtn').disabled = false;
  }
};

// Function to refresh the token
const refreshToken = async () => {
  // Show loading state
  document.getElementById('loader').classList.remove('hidden');
  document.getElementById('refreshTokenBtn').disabled = true;
  
  try {
    const token = getToken();
    
    const response = await fetch('/auth/refresh', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      // Update token in localStorage
      localStorage.setItem('authToken', data.token);
      
      // Update display
      displayUserInfo();
      
      showMessage("Token refreshed successfully!", "success");
    } else {
      showMessage(`Token refresh failed: ${data.message || 'Unknown error'}`, "error");
    }
  } catch (error) {
    showMessage(`Error refreshing token: ${error.message}`, "error");
  } finally {
    document.getElementById('loader').classList.add('hidden');
    document.getElementById('refreshTokenBtn').disabled = false;
  }
};

// Function to logout
const logout = async () => {
  // Show loading state
  document.getElementById('loader').classList.remove('hidden');
  document.getElementById('logoutBtn').disabled = true;
  
  try {
    const token = getToken();
    
    const response = await fetch('/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Clear token regardless of server response
    localStorage.removeItem('authToken');
    
    // Redirect to login page
    redirectToLogin("You have been logged out successfully");
  } catch (error) {
    console.error("Logout error:", error);
    
    // Even if there's an error, clear the token and redirect
    localStorage.removeItem('authToken');
    redirectToLogin("Logged out with errors. Please try logging in again.");
  }
};

// Helper function to redirect to login
const redirectToLogin = (message) => {
  if (message) {
    localStorage.setItem('loginMessage', message);
  }
  window.location.href = 'index.html';
};

// Helper function to show messages
const showMessage = (text, type = "success") => {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = text;
  messageDiv.classList.remove('hidden', 'success', 'error');
  messageDiv.classList.add(type);
};

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is authenticated
  if (!getToken()) {
    redirectToLogin("Please login to access the dashboard");
    return;
  }
  
  // Display user information
  displayUserInfo();
  
  // Add event listeners
  document.getElementById('verifyTokenBtn').addEventListener('click', verifyToken);
  document.getElementById('refreshTokenBtn').addEventListener('click', refreshToken);
  document.getElementById('logoutBtn').addEventListener('click', logout);
  
  // Check for messages from login page
  const message = localStorage.getItem('dashboardMessage');
  if (message) {
    showMessage(message, "success");
    localStorage.removeItem('dashboardMessage');
  }
});

// API Testing functionality
document.addEventListener('DOMContentLoaded', function() {
  const apiMethodSelect = document.getElementById('apiMethod');
  const requestBodyContainer = document.getElementById('requestBodyContainer');
  const testApiBtn = document.getElementById('testApiBtn');
  
  // Show/hide request body based on method
  apiMethodSelect.addEventListener('change', function() {
    const method = apiMethodSelect.value;
    requestBodyContainer.style.display = 
      (method === 'GET' || method === 'DELETE') ? 'none' : 'block';
  });
  
  // Initial state
  apiMethodSelect.dispatchEvent(new Event('change'));
  
  // Handle API test
  testApiBtn.addEventListener('click', async function() {
    const endpoint = document.getElementById('apiEndpoint').value;
    const method = apiMethodSelect.value;
    const requestBody = document.getElementById('requestBody').value;
    const responseElement = document.getElementById('apiResponse');
    const token = getToken();
    
    if (!token) {
      responseElement.textContent = "Error: No authentication token found";
      responseElement.className = 'response-box error';
      return;
    }
    
    try {
      testApiBtn.disabled = true;
      responseElement.textContent = "Loading...";
      responseElement.className = 'response-box';
      
      const options = {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      // Add body for non-GET/DELETE requests
      if (method !== 'GET' && method !== 'DELETE' && requestBody.trim()) {
        try {
          options.body = JSON.stringify(JSON.parse(requestBody));
        } catch (e) {
          responseElement.textContent = "Error: Invalid JSON in request body";
          responseElement.className = 'response-box error';
          testApiBtn.disabled = false;
          return;
        }
      }
      
      const response = await fetch(endpoint, options);
      
      // Get response as text first
      const responseText = await response.text();
      
      // Try to parse as JSON
      try {
        const responseData = JSON.parse(responseText);
        responseElement.textContent = JSON.stringify(responseData, null, 2);
      } catch (e) {
        // If not JSON, show as text
        responseElement.textContent = responseText;
      }
      
      // Color based on status
      if (response.ok) {
        responseElement.className = 'response-box success';
      } else {
        responseElement.className = 'response-box error';
      }
    } catch (error) {
      responseElement.textContent = `Error: ${error.message}`;
      responseElement.className = 'response-box error';
    } finally {
      testApiBtn.disabled = false;
    }
  });
});
