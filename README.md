# Stock-taking agent (Gemini)

1. `pip install -r requirements.txt`
2. Get a free key at https://aistudio.google.com/apikey and set it:
   - Mac/Linux: `export GEMINI_API_KEY="your-key"`
   - Windows PowerShell: `$env:GEMINI_API_KEY="your-key"`
3. `python stock_agent.py --dry-run`   (no API call, checks the data loads)
4. `python stock_agent.py`             (the real run -> stock_report.md + findings.json)
5. `python stock_agent.py --score`     (grades findings.json against data/answer_key.csv)

If you see "model not found": `python stock_agent.py --model gemini-3-flash-preview`

Never commit or share your API key. The `data/` folder is made-up shop data.
