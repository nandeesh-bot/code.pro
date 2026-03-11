// Simple test script to verify API endpoints
async function testAPI() {
    const fetch = (await import('node-fetch')).default;

    try {
        // Test registration
        console.log('Testing registration...');
        const registerResponse = await fetch('http://localhost:5000/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test User 3',
                email: 'test3@example.com',
                password: 'password123'
            })
        });
        const registerData = await registerResponse.json();
        console.log('Registration:', registerData);

        // Test login
        console.log('Testing login...');
        const loginResponse = await fetch('http://localhost:5000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test3@example.com',
                password: 'password123'
            })
        });
        const loginData = await loginResponse.json();
        console.log('Login:', loginData);

        if (loginData.token) {
            // Test dashboard
            console.log('Testing dashboard...');
            const dashboardResponse = await fetch('http://localhost:5000/dashboard', {
                headers: { 'Authorization': `Bearer ${loginData.token}` }
            });
            const dashboardData = await dashboardResponse.json();
            console.log('Dashboard:', dashboardData);
        }
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testAPI();