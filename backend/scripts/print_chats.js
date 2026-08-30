const r = require('../deep_audit_db_report.json');

console.log('=== ALL ' + r.issueChats.length + ' ISSUE / KEYWORD CHATS ===\n');
r.issueChats.forEach((c, i) => {
  console.log(`[${i+1}] ${c.date} | ${c.sender} -> ${c.receiver}`);
  console.log(`    "${c.content}"\n`);
});
