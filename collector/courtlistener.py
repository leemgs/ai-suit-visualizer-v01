
import requests

def fetch_cases(query="artificial intelligence", page_size=50):
    url = "https://www.courtlistener.com/api/rest/v3/dockets/"
    params = {"search":query,"page_size":page_size}
    res = requests.get(url, params=params)
    return res.json()["results"]
