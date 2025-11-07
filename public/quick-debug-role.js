// QUICK DEBUG - Copy paste ke browser console

// 1. Cek role Anda saat ini
const user = JSON.parse(localStorage.getItem('sirangkul_user') || '{}');
console.log('👤 Your Role:', user.role);
console.log('📋 Role Type:', typeof user.role);
console.log('📋 Role Length:', user.role?.length);
console.log('📋 Role (lowercase):', user.role?.toLowerCase());
console.log('📋 Role (trimmed):', user.role?.trim());

// 2. Cek dari API
fetch('http://127.0.0.1:8000/api/auth/me', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('sirangkul_token')
  }
})
.then(r => r.json())
.then(data => {
  console.log('');
  console.log('👤 User from API:', data);
  console.log('📋 Role from API:', data.role);
  console.log('📋 Role (lowercase):', data.role?.toLowerCase());
})
.catch(err => console.error('❌ Error:', err));

// 3. Expected roles
console.log('');
console.log('Expected roles (lowercase):');
console.log('  - pengusul');
console.log('  - verifikator');
console.log('  - kepala_madrasah  ← Expected for Kepala Madrasah');
console.log('  - komite');
console.log('  - bendahara');
