"""Flask app for the "Ciência vs Pseudociência" visualization.

Run with:
    python app.py
"""

from flask import Flask, jsonify, render_template

from data.loader import load_app_data, load_philosophers, load_theories

app = Flask(__name__)


@app.route("/")
def index():
    philosophers = load_philosophers()
    return render_template("index.html", philosophers=philosophers)


@app.route("/sobre")
def sobre():
    return render_template("sobre.html")


@app.route("/api/data")
def api_data():
    return jsonify(load_app_data())


@app.route("/philosopher/<key>")
def philosopher_detail(key):
    philosophers = load_philosophers()
    p = next((phil for phil in philosophers if phil['key'] == key), None)
    if not p:
        return "Filósofo não encontrado", 404
    return render_template(f"philosophers/{key}.html", p=p)

if __name__ == "__main__":
    app.run(debug=True, port=5000)