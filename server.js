const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const dotenv = require("dotenv");
const app = express();
const PORT = process.env.PORT || 3000;

dotenv.config(); // Load .env variables

// Serve static files
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set correct DB path depending on environment
const dbPath =
  process.env.NODE_ENV === "production"
    ? "/tmp/feed_log.db"
    : "./db/feed_log.db";

// Create or open the SQLite DB
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("DB connection error:", err);
  else console.log("Connected to SQLite database.");
});

// Create the table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS feedings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  time TEXT,
  date TEXT
)`);

// Load users from .env
const userEnv = process.env.USERS;
const users = {};

if (userEnv) {
  userEnv.split(",").forEach((entry) => {
    const [name, pass] = entry.split(":");
    users[name] = pass;
  });
}

// API: Log a feeding
app.post("/feed", (req, res) => {
  const { name, password } = req.body;

  if (!users[name] || users[name] !== password) {
    return res.status(401).json({ error: "Invalid name or password" });
  }

  const now = new Date();
  const time = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = now.toISOString().split("T")[0];

  db.run(
    "INSERT INTO feedings (name, time, date) VALUES (?, ?, ?)",
    [name, time, date],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      return res.json({ message: "Feeding recorded", time, date });
    }
  );
});

// API: Get today's feedings
app.get("/today", (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  db.all("SELECT * FROM feedings WHERE date = ?", [today], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(rows);
  });
});

// API: Get all history
app.get("/history", (req, res) => {
  db.all(
    "SELECT * FROM feedings ORDER BY date DESC, time DESC",
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json(rows);
    }
  );
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
