fetch('https://mxzflpidclfcdqrgimqn.supabase.co/rest/v1/')
    .then(res => console.log('Status:', res.status, res.statusText))
    .catch(err => console.log('Error:', err.message));
