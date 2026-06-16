const RENDER_API_KEY = 'rnd_EjpzbXUbKm5bKmrEGE3w7Pq7Y7oi';
const REPO_URL = 'https://github.com/likithgowda314-cyber/Urban-temperature-ai';

// Let's list the owner ID first, since we need it to create a service/blueprint
fetch('https://api.render.com/v1/owners', {
  headers: {
    'Accept': 'application/json',
    'Authorization': `Bearer ${RENDER_API_KEY}`
  }
})
.then(res => res.json())
.then(async owners => {
  if (!owners.length) {
    console.error('No owners found for this API key.');
    return;
  }
  const ownerId = owners[0].owner.id;
  console.log('Found owner ID:', ownerId);
  
  // Try to create the web service for backend directly if Blueprint creation is too complex
  const backendPayload = {
    ownerId: ownerId,
    type: 'web_service',
    name: 'ai-platform-backend',
    repo: REPO_URL,
    autoDeploy: 'yes',
    branch: 'main',
    serviceDetails: {
      env: 'python',
      plan: 'free',
      region: 'oregon',
      envSpecificDetails: {
        buildCommand: 'pip install -r backend/requirements.txt && pip install gunicorn',
        startCommand: 'cd backend && gunicorn main:app'
      },
      envVars: [
        { key: 'PYTHON_VERSION', value: '3.11.5' },
        { key: 'DATABASE_URL', value: 'sqlite:///./ai_platform.db' }
      ]
    }
  };

  console.log('Attempting to create backend service...');
  let res = await fetch('https://api.render.com/v1/services', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RENDER_API_KEY}`
    },
    body: JSON.stringify(backendPayload)
  });
  
  let data = await res.json();
  console.log('Backend Response:', data.id ? 'Success - ID: ' + data.id : data);
  const backendUrl = data.service ? data.service.service.url : 'https://ai-platform-backend.onrender.com';

  const frontendPayload = {
    ownerId: ownerId,
    type: 'static_site',
    name: 'ai-platform-frontend',
    repo: REPO_URL,
    autoDeploy: 'yes',
    branch: 'main',
    serviceDetails: {
      buildCommand: 'npm install --prefix frontend && npm run build --prefix frontend',
      publishPath: 'frontend/dist',
      pullRequestPreviewsEnabled: 'no',
      envVars: [
        { key: 'VITE_API_URL', value: backendUrl }
      ]
    }
  };

  console.log('Attempting to create frontend service...');
  res = await fetch('https://api.render.com/v1/services', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RENDER_API_KEY}`
    },
    body: JSON.stringify(frontendPayload)
  });

  data = await res.json();
  console.log('Frontend Response:', data.id ? 'Success - ID: ' + data.id : data);
})
.catch(err => console.error(err));
