const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.all("SELECT id, name, status FROM Users LIMIT 5", (err, rows) => {
        if (err) console.error(err);
        else console.log(rows);
        db.close();
    });
});
