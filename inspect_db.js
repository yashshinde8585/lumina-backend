const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
console.log(`Inspecting DB at: ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

db.serialize(() => {
    db.all("PRAGMA table_info(Users);", (err, rows) => {
        if (err) {
            console.error(err.message);
        } else {
            console.log('Columns in Users table:');
            console.table(rows);

            const hasStatus = rows.some(r => r.name === 'status');
            console.log('Has status column:', hasStatus);
        }
        db.close();
    });
});
