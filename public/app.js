// Function to dynamically load the SuperTokens script
const loadSuperTokensScript = () => {
  return new Promise((resolve, reject) => {
    if (typeof supertokens !== 'undefined') {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/supertokens-web-js@0.8.0/bundle/bundle.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load SuperTokens script'));
    document.body.appendChild(script);
  });
};

// Initialize SuperTokens
const initializeSuperTokens = async () => {
  try {
    await loadSuperTokensScript();
    
    // Get the domain from the current URL
    const apiDomain = window.location.origin;
    document.getElementById('apiUrl').textContent = apiDomain;

    supertokens.init({
      appInfo: {
        apiDomain,
        apiBasePath: "/auth",
        appName: "Beehiiv Auth Test"
      },
      recipeList: [
        supertokens.Passwordless.init()
      ]
    });
  } catch (error) {
    console.error('Failed to initialize SuperTokens:', error);
    showMessage("Failed to load authentication system. Please try refreshing the page.", "error");
  }
};

// Function to handle sending magic link
const sendMagicLink = async () => {
  const email = document.getElementById('email').value.trim();
  const messageDiv = document.getElementById('message');
  const loader = document.getElementById('loader');
  const loginButton = document.getElementById('loginButton');
  
  // Basic validation
  if (!email || !email.includes('@')) {
    showMessage("Please enter a valid email address", "error");
    return;
  }
  
  // Show loading state
  loginButton.disabled = true;
  loader.classList.remove('hidden');
  messageDiv.classList.add('hidden');
  
  try {
    // Send magic link using direct API call
    const apiUrl = '/auth/magic-link';
    console.log(`Sending request to: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    // Check response type
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      // Not JSON - log the actual response text for debugging
      const htmlResponse = await response.text();
      console.error("Received non-JSON response:", htmlResponse.substring(0, 150) + "...");
      throw new Error(`API returned non-JSON response (${contentType}). Server might be unavailable.`);
    }
    
    const data = await response.json();
    console.log("Response data:", data);
    
    // Hide loader
    loader.classList.add('hidden');
    
    if (response.ok && data.success) {
      showMessage(`Magic link sent to ${email}! Please check your inbox.`, "success");
    } else {
      showMessage(data.message || "Failed to send magic link. Please try again.", "error");
      loginButton.disabled = false;
    }
  } catch (error) {
    loader.classList.add('hidden');
    loginButton.disabled = false;
    showMessage(`Error: ${error.message || "Failed to send magic link"}`, "error");
    console.error("Error sending magic link:", error);
  }
};

// Function to handle magic link callback
const handleMagicLinkCallback = async () => {
  // Show loading state
  document.getElementById('loader').classList.remove('hidden');
  document.getElementById('loginButton').disabled = true;
  
  try {
    // Get code from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const preAuthSessionId = urlParams.get('preAuthSessionId');
    const code = urlParams.get('code');
    
    if (!preAuthSessionId || !code) {
      showMessage("Invalid magic link parameters", "error");
      return;
    }
    
    // Verify magic link using direct API call
    const response = await fetch('/auth/verify-magic-link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ preAuthSessionId, code })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      // Store the token in localStorage
      localStorage.setItem('authToken', data.token);
      // Redirect to dashboard
      window.location.href = '/dashboard.html';
    } else {
      showMessage(data.message || "Failed to verify magic link.", "error");
    }
  } catch (error) {
    showMessage(`Authentication error: ${error.message || "Unknown error"}`, "error");
    console.error("Auth error:", error);
  } finally {
    document.getElementById('loader').classList.add('hidden');
    document.getElementById('loginButton').disabled = false;
  }
};

// Helper function to show messages
const showMessage = (text, type = "success") => {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = text;
  messageDiv.classList.remove('hidden', 'success', 'error');
  messageDiv.classList.add(type);
};

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
  // Display API URL
  const apiDomain = window.location.origin;
  document.getElementById('apiUrl').textContent = apiDomain;
  
  // Add event listener to the login button
  document.getElementById('loginButton').addEventListener('click', sendMagicLink);
  
  // Check for magic link redirects
  if (window.location.pathname.includes("/auth/callback")) {
    handleMagicLinkCallback();
  }
});
