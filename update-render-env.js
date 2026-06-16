const RENDER_API_KEY = 'rnd_EjpzbXUbKm5bKmrEGE3w7Pq7Y7oi';
const backendUrl = 'https://ai-platform-backend-ere8.onrender.com';
const googleMapsApiKey = 'AIzaSyCOXs6hgVuSxntXkI39sSepafHPfMd6r98';

fetch('https://api.render.com/v1/services?name=ai-platform-frontend', {
  headers: {
    'Accept': 'application/json',
    'Authorization': `Bearer ${RENDER_API_KEY}`
  }
})
.then(res => res.json())
.then(async services => {
  if (services.length === 0) {
    console.error("Frontend service not found");
    return;
  }
  
  const serviceId = services[0].service.id;
  console.log(`Found frontend service ID: ${serviceId}`);

  console.log('Updating Environment Variables...');
  const res = await fetch(`https://api.render.com/v1/services/${serviceId}/env-vars`, {
    method: 'PUT',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RENDER_API_KEY}`
    },
    body: JSON.stringify([
      { key: 'VITE_API_URL', value: backendUrl },
      { key: 'VITE_GOOGLE_MAPS_API_KEY', value: googleMapsApiKey }
    ])
  });

  const data = await res.json();
  console.log('Update Response:', data);
})
.catch(err => console.error(err));
