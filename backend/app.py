from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import threading

from database import get_db, init_db
from train import train_mnist_model

app = Flask(__name__)
CORS(app)

@app.route('/experiment', methods=['POST'])
def start_experiment():
    data = request.json
    params_str = json.dumps(data, sort_keys=True)

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, status 
        FROM experiments 
        WHERE params == ?
    """, (params_str,))
    existing = cursor.fetchone()

    if existing:
        exp_id, status = existing
        return jsonify({
            "message": "Experiment with the same parameters already exists.",
            "experiment_id": exp_id,
            "status": status
        }), 201

    cursor.execute("""
        INSERT INTO experiments (params, status, current_epoch, total_epochs)
        VALUES (?, 'queued', 0, ?)
    """, (params_str, data.get("epochs", 0)))
    exp_id = cursor.lastrowid
    conn.commit()

    thread = threading.Thread(target=run_experiment, args=(exp_id, data))
    thread.start()

    return jsonify({
        "experiment_id": exp_id, 
        "status": "queued"
    }), 200

def run_experiment(exp_id, hparams):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE experiments 
        SET status = 'running' WHERE id = ?""", (exp_id,))
    conn.commit()

    def update_callback(epoch, loss, accuracy):
        cursor.execute("""
            UPDATE experiments
            SET current_epoch = ?,
                current_loss = ?,
                current_accuracy = ?
            WHERE id = ?
        """, (epoch, round(loss, 4), round(accuracy, 4), exp_id))
        conn.commit()

    try:
        result = train_mnist_model(hparams, update_callback)
        final_acc = result['final_val_accuracy']

        cursor.execute("""
            UPDATE experiments
            SET status = 'completed',
                final_accuracy = ?
            WHERE id = ?
        """, (round(final_acc, 4), exp_id))
        conn.commit()
    except Exception as e:
        cursor.execute("""
            UPDATE experiments
            SET status = 'failed'
            WHERE id = ?
        """, (exp_id,))
        conn.commit()

@app.route('/experiments/running', methods=['GET'])
def get_running_experiments():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, params, status, current_epoch, total_epochs, current_loss, current_accuracy, created_at
        FROM experiments
        WHERE status IN ('queued', 'running')
        ORDER BY created_at DESC
    """)
    rows = cursor.fetchall()
    
    results = []
    for row in rows:
        exp_id, params_str, status, current_epoch, total_epochs, current_loss, current_accuracy, created_at = row
        results.append({
            "id": exp_id,
            "params": json.loads(params_str),
            "status": status,
            "current_epoch": current_epoch,
            "total_epochs": total_epochs,
            "current_loss": current_loss,
            "current_accuracy": current_accuracy
        })
    return jsonify(results), 200

@app.route('/experiments', methods=['GET'])
def get_experiments():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, params, status, final_accuracy, current_epoch, total_epochs
        FROM experiments
        WHERE status IN ('completed', 'failed')
        ORDER BY final_accuracy DESC
    """)
    rows = cursor.fetchall()
    
    results = []
    for row in rows:
        exp_id, params_str, status, final_acc, current_epoch, total_epochs = row
        results.append({
            "id": exp_id,
            "params": json.loads(params_str),
            "status": status,
            "final_accuracy": final_acc,
            "current_epoch": current_epoch,
            "total_epochs": total_epochs
        })
    return jsonify(results), 200

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
