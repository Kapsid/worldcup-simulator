import fetch from 'node-fetch';

async function testLogin() {
  try {
    // Login
    const loginResponse = await fetch('http://localhost:3001/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);

    if (loginData.token) {
      // Test authenticated endpoint
      const worldsResponse = await fetch('http://localhost:3001/api/worlds', {
        headers: {
          'Authorization': `Bearer ${loginData.token}`
        }
      });

      const worldsData = await worldsResponse.json();
      console.log('Worlds response:', worldsData);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testLogin();