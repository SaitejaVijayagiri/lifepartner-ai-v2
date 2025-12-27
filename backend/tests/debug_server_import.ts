
try {
    require('../src/server');
    console.log("✅ Server Imported Successfully");
} catch (e) {
    console.error("❌ Server Import Failed:");
    console.error(e);
}
