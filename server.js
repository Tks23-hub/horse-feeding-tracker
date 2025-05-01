const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const dotenv = require("dotenv");
const app = express();
const PORT = process.env.PORT || 3000;

dotenv.config();

// Middleware
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Determine database location
const dbPath =
  process.env.NODE_ENV === "production"
    ? "/tmp/feed_log.db"
    : "./db/feed_log.db";

// Connect to database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("DB connection error:", err);
  else console.log("Connected to SQLite database.");
});

// Create tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS feedings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    time TEXT,
    date TEXT
  )`);

  db.run(
    `CREATE TABLE IF NOT EXISTS bag_status (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    count INTEGER
  )`,
    () => {
      // Ensure one row exists with default value 5
      db.get("SELECT count FROM bag_status WHERE id = 1", (err, row) => {
        if (!row) {
          db.run("INSERT INTO bag_status (id, count) VALUES (1, 5)");
        }
      });
    }
  );
});

// Load users from .env
const userEnv = process.env.USERS;
const users = {};
if (userEnv) {
  userEnv.split(",").forEach((entry) => {
    const [name, pass] = entry.split(":");
    users[name] = pass;
  });
}

// API: Log a feeding and update bag count
app.post("/feed", (req, res) => {
  const { name, password, bagCount } = req.body;

  if (!users[name] || users[name] !== password) {
    return res.status(401).json({ error: "Invalid name or password" });
  }

  const nowUTC = new Date();
  const nowIST = new Date(nowUTC.getTime() + 3 * 60 * 60 * 1000); // convert to My timezone (UTC+3)
  const time = nowIST.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = nowIST.toISOString().split("T")[0];

  db.run(
    "INSERT INTO feedings (name, time, date) VALUES (?, ?, ?)",
    [name, time, date],
    (err) => {
      if (err)
        return res.status(500).json({ error: "Database error (feedings)" });

      // Update bag count
      db.run(
        "UPDATE bag_status SET count = ? WHERE id = 1",
        [bagCount],
        (err2) => {
          if (err2)
            return res
              .status(500)
              .json({ error: "Database error (bag update)" });
          return res.json({
            message: "Feeding recorded",
            time,
            date,
            bagCount,
          });
        }
      );
    }
  );
});

// API: Get today’s feedings
app.get("/today", (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  db.all("SELECT * FROM feedings WHERE date = ?", [today], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error (today)" });
    res.json(rows);
  });
});

// API: Get all history
app.get("/history", (req, res) => {
  db.all(
    "SELECT * FROM feedings ORDER BY date DESC, time DESC",
    (err, rows) => {
      if (err)
        return res.status(500).json({ error: "Database error (history)" });
      res.json(rows);
    }
  );
});

// API: Get current feed bag count
app.get("/bag-count", (req, res) => {
  db.get("SELECT count FROM bag_status WHERE id = 1", (err, row) => {
    if (err)
      return res.status(500).json({ error: "Database error (bag-count)" });
    res.json({ count: row?.count ?? 5 });
  });
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
