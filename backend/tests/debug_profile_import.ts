
try {
    console.log("Attempting to import profile route...");
    const profile = require('../src/routes/profile');
    console.log("Success!");
} catch (e) {
    console.error("Import Failed:", e);
}
