const r = require('../deep_audit_db_report.json');

console.log('=== USER INQUIRIES ===');
console.log(r.inquiries);

console.log('\n=== ISSUE CHATS COUNT: ' + r.issueChats.length + ' ===');
r.issueChats.forEach((c, i) => {
  console.log(`[${i+1}] [${c.date}] ${c.sender} -> ${c.receiver}: "${c.content}" (Mediator: ${c.is_mediator})`);
});

console.log('\n=== CALL LOGS (' + r.callLogs.length + ') ===');
console.log(r.callLogs);

console.log('\n=== MATCH & INTERACTION STATS ===');
console.log(r.matchStats);

console.log('\n=== NOTIFICATION STATS ===');
console.log(r.notificationStats);

console.log('\n=== USER FUNNEL STATS ===');
console.log(r.userFunnel);

console.log('\n=== SAMPLE STUCK USERS (Top 20) ===');
console.table(r.stuckUsers.slice(0, 20).map(u => ({
  Email: u.email,
  Name: u.full_name,
  Verified: u.is_verified,
  Gender: u.gender,
  Age: u.age,
  Avatar: u.avatar_url ? 'YES' : 'NO',
  Created: u.created_at
})));
