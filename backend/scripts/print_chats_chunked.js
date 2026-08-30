const r = require('../deep_audit_db_report.json');

console.log('=== CHATS 1 TO 35 ===\n');
r.issueChats.slice(0, 35).forEach((c, i) => {
  console.log('[' + (i+1) + '] ' + c.date + ' | ' + c.sender + ' -> ' + c.receiver);
  console.log('    "' + c.content + '"\n');
});

console.log('=== CHATS 36 TO 70 ===\n');
r.issueChats.slice(35, 70).forEach((c, i) => {
  console.log('[' + (i+36) + '] ' + c.date + ' | ' + c.sender + ' -> ' + c.receiver);
  console.log('    "' + c.content + '"\n');
});
