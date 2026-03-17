
AI_COMPANIES = ["OpenAI","Google","Meta","Anthropic","Microsoft","Stability AI"]

def detect_company(text):
    for c in AI_COMPANIES:
        if c.lower() in text.lower():
            return c
    return "Unknown"

def process(raw):
    result=[]
    for r in raw:
        result.append({
            "case_name": r.get("caseName"),
            "company": detect_company(r.get("caseName","")),
            "court": r.get("court"),
            "state": "NA",
            "file_date": r.get("dateFiled"),
            "case_type": "unknown",
            "url": "https://www.courtlistener.com"+r.get("absolute_url","")
        })
    return result
