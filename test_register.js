// Test script to register a new user
const axios = require('axios');

async function testRegister() {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/register', {
      username: 'testuser',
      email: 'hetvirani87@gmail.com',
      password: '123'
    });
    console.log('Registration Success:', response.data);
  } catch (error) {
    console.log('Registration Error Status:', error.response?.status);
    console.log('Registration Error Data:', error.response?.data);
  }
}

testRegister();
