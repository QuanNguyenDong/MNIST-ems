import sqlite3

DB_PATH = 'experiments.db'

def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    c.execute("""
    CREATE TABLE IF NOT EXISTS experiments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        params TEXT,
        status TEXT CHECK(status IN ("queued", "running", "completed", "failed")),
        current_epoch INTEGER,
        total_epochs INTEGER,
        current_loss REAL,
        current_accuracy REAL,
        final_accuracy REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    conn.commit()
    conn.close()
