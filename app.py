import os
import sqlite3
import random
from flask import Flask, render_template, request, redirect, url_for
from werkzeug.utils import secure_filename
from datetime import datetime

app = Flask(__name__)

# Configuration
UPLOAD_FOLDER = 'static/uploads'
DB_PATH = 'database/submissions.db'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max limit

# Ensure upload directory exists
try:
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
except OSError:
    # Vercel has a read-only file system, so we skip creating the directory
    pass

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Mock AI Analysis Function
def analyze_image(filepath, user_dates):
    """
    Simulates AI analysis of the screenshot.
    In a real scenario, this would call an OCR service or LLM (e.g., GPT-4 Vision).
    """
    # Simulate processing delay if needed, but for now we just return mock data.

    # Mock Logic:
    # 1. Generate a random step count close to a realistic number.
    # 2. Return the dates the user selected, or "detect" one if missing.

    mock_steps = random.randint(5000, 15000)

    # In a real app, the AI might detect a different date than selected.
    # Here we trust the user input but pretend the AI "confirmed" it or found it.
    detected_dates = user_dates if user_dates else datetime.now().strftime("%Y-%m-%d")

    return {
        "steps": mock_steps,
        "dates": detected_dates,
        "raw_text": "Mock OCR Text: ... 10,234 steps ..."
    }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    if 'screenshot' not in request.files:
        return redirect(request.url)

    file = request.files['screenshot']

    if file.filename == '':
        return redirect(request.url)

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        # Add timestamp to filename to prevent overwrites
        timestamped_filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], timestamped_filename)
        file.save(filepath)

        # Get form data
        name = request.form.get('name')
        submission_type = request.form.get('submission_type')
        dates = request.form.get('dates')
        comment = request.form.get('comment')

        # Perform "AI Analysis"
        ai_result = analyze_image(filepath, dates)

        # Prepare data for verification page
        form_data = {
            "name": name,
            "submission_type": submission_type,
            "dates": dates,
            "comment": comment,
            "screenshot_path": filepath
        }

        return render_template('verify.html', form_data=form_data, ai_data=ai_result, image_url=filepath)

    return redirect(request.url)

@app.route('/submit', methods=['POST'])
def submit():
    # Retrieve confirmed data from the verification form
    name = request.form.get('name')
    submission_type = request.form.get('submission_type')
    dates = request.form.get('dates')
    steps = request.form.get('steps')
    comment = request.form.get('comment')
    screenshot_path = request.form.get('screenshot_path')

    conn = get_db_connection()
    conn.execute('INSERT INTO submissions (name, submission_type, dates, steps, comment, screenshot_path) VALUES (?, ?, ?, ?, ?, ?)',
                 (name, submission_type, dates, steps, comment, screenshot_path))
    conn.commit()
    conn.close()

    return redirect(url_for('leaderboard'))

@app.route('/leaderboard')
def leaderboard():
    conn = get_db_connection()
    submissions = conn.execute('SELECT * FROM submissions ORDER BY created_at DESC').fetchall()
    conn.close()

    # Process submissions for display if needed
    formatted_submissions = []
    for sub in submissions:
        formatted_submissions.append({
            "name": sub['name'],
            "type": sub['submission_type'],
            "dates": sub['dates'],
            "steps": sub['steps'],
            "comment": sub['comment'],
            "created_at": sub['created_at'],
            "screenshot_path": sub['screenshot_path']
        })

    return render_template('leaderboard.html', submissions=formatted_submissions)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
