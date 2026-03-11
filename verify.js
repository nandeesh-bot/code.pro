const jwt = require('jsonwebtoken');
require('dotenv').config();

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5YWVlYzhiM2VlZDRhMzU4MWZjOWZkYSIsImlhdCI6MTc3MzA3MTUwNSwiZXhwIjoxNzczMDc1MTA1fQ.NXcrZjrFoZ9ZVDArY7KAI14ne2UqXj9QcUbEg4fupcg';

console.log('JWT_SECRET:', process.env.JWT_SECRET);

try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
} catch (error) {
    console.log('Verification failed:', error.message);
}