const RENDER_API_KEY = 'rnd_EjpzbXUbKm5bKmrEGE3w7Pq7Y7oi';
const REPO_URL = 'https://github.com/likithgowda314-cyber/Urban-temperature-ai';
const backendUrl = 'https://ai-platform-backend-ere8.onrender.com';

fetch('https://api.render.com/v1/owners', {
  headers: {
    'Accept': 'application/json',
    'Authorization': `Bearer ${RENDER_API_KEY}`
  }
})
.then(res => res.json())
.then(async owners => {
  const ownerId = owners[0].owner.id;

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
  const res = await fetch('https://api.render.com/v1/services', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RENDER_API_KEY}`
    },
    body: JSON.stringify(frontendPayload)
  });

  const data = await res.json();
  console.log('Frontend Response:', data);
})
.catch(err => console.error(err));
