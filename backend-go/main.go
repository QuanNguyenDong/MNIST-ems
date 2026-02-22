package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	_ "github.com/mattn/go-sqlite3"
	"github.com/rs/cors"
)

var db *sql.DB

func initDB() {
	var err error
	db, err = sql.Open("sqlite3", "experiments.db?_journal_mode=WAL")
	if err != nil {
		log.Fatal(err)
	}

	createTableQuery := `
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
    )`
	_, err = db.Exec(createTableQuery)
	if err != nil {
		log.Fatalf("Warning: table creation might fail if already exists or invalid: %v", err)
	}
}

// Ensure the json has sorted keys to match Python's sort_keys=True behavior (Go json.Marshal map[string]interface{} sorts keys)
func startExperiment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var data map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	paramsBytes, _ := json.Marshal(data)
	paramsStr := string(paramsBytes)

	// Check if existing
	var existingID int
	var existingStatus sql.NullString
	err := db.QueryRow(`
		SELECT id, status 
		FROM experiments 
		WHERE params = ?
	`, paramsStr).Scan(&existingID, &existingStatus)

	if err == nil {
		// Found existing
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message":       "Experiment with the same parameters already exists.",
			"experiment_id": existingID,
			"status":        existingStatus.String,
		})
		return
	} else if err != sql.ErrNoRows {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Not existing, create new
	epochs := 0
	if val, ok := data["epochs"].(float64); ok {
		epochs = int(val)
	} else if val, ok := data["epochs"].(int); ok {
		epochs = val
	}

	res, err := db.Exec(`
		INSERT INTO experiments (params, status, current_epoch, total_epochs)
		VALUES (?, 'queued', 0, ?)
	`, paramsStr, epochs)
	if err != nil {
		http.Error(w, "Database error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	expID, _ := res.LastInsertId()

	// Run experiment in background mock natively in Go
	go runExperimentMock(expID, paramsStr)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"experiment_id": expID,
		"status":        "queued",
	})
}

func runExperimentMock(id int64, paramsStr string) {
	// Parse params
	var hparams map[string]interface{}
	json.Unmarshal([]byte(paramsStr), &hparams)

	epochs := 5
	if val, ok := hparams["epochs"].(float64); ok {
		epochs = int(val)
	} else if val, ok := hparams["epochs"].(int); ok {
		epochs = val
	}

	// Update status to running
	_, err := db.Exec("UPDATE experiments SET status = 'running' WHERE id = ?", id)
	if err != nil {
		log.Printf("Error setting running: %v", err)
		return
	}

	// Mock training loop
	loss := 2.30 + rand.Float64()*0.5
	accuracy := 10.0 + rand.Float64()*5.0

	for epoch := 1; epoch <= epochs; epoch++ {
		time.Sleep(2 * time.Second) // Simulate epoch computation time

		loss = loss * 0.7
		accuracy = accuracy + (100.0-accuracy)*0.4

		_, err := db.Exec(`
			UPDATE experiments
			SET current_epoch = ?,
			    current_loss = ?,
			    current_accuracy = ?
			WHERE id = ?
		`, epoch, loss, accuracy, id)

		if err != nil {
			log.Printf("Error updating epoch %d: %v", epoch, err)
			_, _ = db.Exec("UPDATE experiments SET status = 'failed' WHERE id = ?", id)
			return
		}
	}

	// Completed
	_, _ = db.Exec(`
		UPDATE experiments
		SET status = 'completed',
		    final_accuracy = ?
		WHERE id = ?
	`, accuracy, id)
}

func getRunningExperiments(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	rows, err := db.Query(`
		SELECT id, params, status, current_epoch, total_epochs, current_loss, current_accuracy, created_at
		FROM experiments
		WHERE status IN ('queued', 'running')
		ORDER BY created_at DESC
	`)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var results []map[string]interface{}
	for rows.Next() {
		var (
			id             int
			paramsStr      string
			status         string
			currentEpoch   sql.NullInt64
			totalEpochs    sql.NullInt64
			currentLoss    sql.NullFloat64
			currentAccuracy sql.NullFloat64
			createdAt      string
		)
		if err := rows.Scan(&id, &paramsStr, &status, &currentEpoch, &totalEpochs, &currentLoss, &currentAccuracy, &createdAt); err != nil {
			log.Println(err)
			continue
		}

		var params map[string]interface{}
		json.Unmarshal([]byte(paramsStr), &params)

		exp := map[string]interface{}{
			"id":               id,
			"params":           params,
			"status":           status,
			"current_epoch":    currentEpoch.Int64,
			"total_epochs":     totalEpochs.Int64,
			"current_loss":     currentLoss.Float64,
			"current_accuracy": currentAccuracy.Float64,
		}
		if !currentLoss.Valid {
			exp["current_loss"] = nil
		}
		if !currentAccuracy.Valid {
			exp["current_accuracy"] = nil
		}
		results = append(results, exp)
	}

	if results == nil {
		results = make([]map[string]interface{}, 0)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
}

func getExperiments(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	rows, err := db.Query(`
		SELECT id, params, status, final_accuracy, current_epoch, total_epochs
		FROM experiments
		WHERE status IN ('completed', 'failed')
		ORDER BY final_accuracy DESC
	`)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var results []map[string]interface{}
	for rows.Next() {
		var (
			id           int
			paramsStr    string
			status       string
			finalAcc     sql.NullFloat64
			currentEpoch sql.NullInt64
			totalEpochs  sql.NullInt64
		)
		if err := rows.Scan(&id, &paramsStr, &status, &finalAcc, &currentEpoch, &totalEpochs); err != nil {
			log.Println(err)
			continue
		}

		var params map[string]interface{}
		json.Unmarshal([]byte(paramsStr), &params)

		exp := map[string]interface{}{
			"id":             id,
			"params":         params,
			"status":         status,
			"current_epoch":  currentEpoch.Int64,
			"total_epochs":   totalEpochs.Int64,
			"final_accuracy": finalAcc.Float64,
		}
		if !finalAcc.Valid {
			exp["final_accuracy"] = nil
		}
		results = append(results, exp)
	}

	if results == nil {
		results = make([]map[string]interface{}, 0)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
}

func indexHandler(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/")
	if path == "experiment" || strings.HasPrefix(path, "experiments") {
		http.NotFound(w, r)
		return
	}

	if path == "" {
		path = "index.html"
	}

	staticPath := filepath.Join("static", path)
	if _, err := os.Stat(staticPath); err == nil {
		http.ServeFile(w, r, staticPath)
	} else {
		http.ServeFile(w, r, filepath.Join("static", "index.html"))
	}
}

func main() {
	initDB()
	defer db.Close()

	mux := http.NewServeMux()

	mux.HandleFunc("/experiment", startExperiment)
	mux.HandleFunc("/experiments/running", getRunningExperiments)
	mux.HandleFunc("/experiments", getExperiments)
	mux.HandleFunc("/", indexHandler)

	c := cors.Default()
	handler := c.Handler(mux)

	log.Println("Listening on :5001...")
	log.Fatal(http.ListenAndServe(":5001", handler))
}
