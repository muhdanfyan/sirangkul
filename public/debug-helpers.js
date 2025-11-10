// Debug helper untuk test authorization
// Copy-paste ke browser console untuk debugging

// 1. Cek current user dan role
function checkCurrentUser() {
  const token = localStorage.getItem('sirangkul_token');
  const userStr = localStorage.getItem('sirangkul_user');
  
  console.log('🔐 Token:', token ? 'EXISTS' : 'NOT FOUND');
  
  if (userStr) {
    const user = JSON.parse(userStr);
    console.log('👤 User from localStorage:', user);
    console.log('📋 Role:', user.role);
  }
  
  // Fetch from API
  fetch('http://127.0.0.1:8000/api/auth/me', {
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    }
  })
  .then(r => r.json())
  .then(data => {
    console.log('👤 User from API:', data);
    console.log('✅ Role:', data.role);
  })
  .catch(err => console.error('❌ Error:', err));
}

// 2. Test verify endpoint
function testVerify(proposalId) {
  const token = localStorage.getItem('sirangkul_token');
  
  console.log('🔄 Testing verify for proposal:', proposalId);
  
  fetch(`http://127.0.0.1:8000/api/proposals/${proposalId}/verify`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  })
  .then(r => r.json())
  .then(data => {
    console.log('✅ Verify response:', data);
  })
  .catch(err => console.error('❌ Error:', err));
}

// 3. Test approve endpoint
function testApprove(proposalId) {
  const token = localStorage.getItem('sirangkul_token');
  
  console.log('🔄 Testing approve for proposal:', proposalId);
  
  fetch(`http://127.0.0.1:8000/api/proposals/${proposalId}/approve`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  })
  .then(r => r.json())
  .then(data => {
    console.log('✅ Approve response:', data);
  })
  .catch(err => console.error('❌ Error:', err));
}

// 4. Test debug endpoint (jika sudah dibuat di backend)
function testDebugMe() {
  const token = localStorage.getItem('sirangkul_token');
  
  fetch('http://127.0.0.1:8000/api/debug/me', {
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    }
  })
  .then(r => r.json())
  .then(data => {
    console.log('🔐 Debug info:', data);
    console.log('📋 Role:', data.role);
    console.log('📋 Role (lowercase):', data.role_lowercase);
    console.log('✅ Is Verifikator?', data.is_verifikator);
  })
  .catch(err => console.error('❌ Error:', err));
}

// 5. Test reject endpoint
function testReject(proposalId, reason) {
  const token = localStorage.getItem('sirangkul_token');
  
  console.log('🔄 Testing reject for proposal:', proposalId);
  
  fetch(`http://127.0.0.1:8000/api/proposals/${proposalId}/reject`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      rejection_reason: reason || 'Test rejection'
    })
  })
  .then(r => r.json())
  .then(data => {
    console.log('✅ Reject response:', data);
  })
  .catch(err => console.error('❌ Error:', err));
}

// Usage:
console.log('📋 Debug helpers loaded!');
console.log('');
console.log('Available functions:');
console.log('  checkCurrentUser() - Check your current role');
console.log('  testVerify(proposalId) - Test verify endpoint');
console.log('  testApprove(proposalId) - Test approve endpoint');
console.log('  testReject(proposalId, reason) - Test reject endpoint');
console.log('  testDebugMe() - Test debug/me endpoint');
console.log('');
console.log('Example:');
console.log('  checkCurrentUser()');
console.log('  testVerify("9dc15c84-...")');
