
from courtlistener import fetch_cases
from processor import process
from storage import insert_cases

def run():
    raw = fetch_cases()
    cleaned = process(raw)
    insert_cases(cleaned)

if __name__ == "__main__":
    run()
