"""Loads philosopher metadata and theory data for the app.

Each philosopher lives in its own JSON file under data/philosophers/ so
different people can edit their philosopher without touching the same file.
"""

import csv
import json
import re
import unicodedata
from pathlib import Path

DATA_DIR = Path(__file__).parent
PHILOSOPHERS_DIR = DATA_DIR / "philosophers"
CSV_PATH = DATA_DIR / "teorias_filosofos.csv"
TEXTO_CSV_PATH = DATA_DIR / "textos_filosofos.csv"

THRESHOLD = 0.50


def slugify(text):
    text = unicodedata.normalize("NFKD", str(text))
    text = text.encode("ascii", "ignore").decode()
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "_", text)
    return text.strip("_")


def load_philosophers():
    """Reads every data/philosophers/*.json file, fills in bio/criterion/reference
    from texto_filosofos.csv, and returns them sorted by 'order'."""
    texts = load_philosopher_texts()

    philosophers = []
    for path in sorted(PHILOSOPHERS_DIR.glob("*.json")):
        with path.open(encoding="utf-8") as f:
            phil = json.load(f)
        text = texts.get(phil["csv_name"], {})
        phil["bio"] = text.get("bio", "")
        phil["criterion"] = text.get("criterion", "")
        phil["reference"] = text.get("reference", "")
        philosophers.append(phil)
    philosophers.sort(key=lambda p: p.get("order", 0))
    return philosophers


def load_philosopher_texts():
    """Reads texto_filosofos.csv into a dict keyed by philosopher name (Nome)."""
    with TEXTO_CSV_PATH.open(encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))

    texts = {}
    for row in rows:
        name = (row.get("Nome") or "").strip()
        if not name:
            continue
        texts[name] = {
            "bio": (row.get("Breve descrição do pensamento") or "").strip(),
            "criterion": (row.get("Critérios de demarcação") or "").strip(),
            "reference": (row.get("Referência") or "").strip(),
        }
    return texts


def load_theories(philosophers):
    """Parses the CSV into a list of theories with per-philosopher score/justification."""
    with CSV_PATH.open(encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))

    # Normalize header whitespace (e.g. "Kuhn_H " -> "Kuhn_H")
    rows = [{k.strip(): v for k, v in row.items()} for row in rows]

    theories = []
    for row in rows:
        label = row.get("Teoria", "").strip()
        if not label:
            continue
        theory_id = slugify(label)

        scores = {}
        for phil in philosophers:
            key = phil["key"]
            prefix = phil["csv_prefix"]
            verdict = (row.get(f"{prefix}_H") or "").strip().upper()
            justification = (row.get(f"{prefix}_J") or "").strip()
            reference = (row.get(f"{prefix}_R") or "").strip()

            if verdict == "V":
                is_science = True
            elif verdict == "F":
                is_science = False
            else:
                is_science = None

            args = [a for a in [justification] if a]
            if reference:
                args.append(f"Referência: {reference}")

            scores[key] = {"is_science": is_science, "args": args}

        theories.append(
            {
                "id": theory_id,
                "label": label,
                "since": row.get("Desde", "").strip() or "Desconhecido",
                "scores": scores,
            }
        )

    return theories


def load_app_data():
    philosophers = load_philosophers()
    theories = load_theories(philosophers)
    return {
        "philosophers": philosophers,
        "theories": theories,
        "threshold": THRESHOLD,
    }