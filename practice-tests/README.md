# Informatics Practice Tests

A simple, dependency-free web app for practicing the "Základy informatiky"
question bank (176 questions parsed from the source markdown).

## Run

Open `index.html` directly in a browser, or serve the folder:

```
python3 -m http.server 8000
# then open http://localhost:8000
```

## Modes

- **Test – 30 questions**: generates a random set of 30 questions. Clicking an
  option turns it green (correct) or red (incorrect); the correct option is
  always marked green and a brief explanation appears below the options.
  "New test" buttons sit at the top and bottom right; "Home" at the bottom left
  returns to the mode selection.
- **Practice one by one**: flashcard mode — one question centered on screen,
  same correct/incorrect feedback, then "Next question". Green/red boxes next to
  the question show how many answers were right/wrong in the session.

## Files

- `index.html`, `style.css`, `app.js` — the app (no build step, no dependencies)
- `questions.js` — generated question data (`window.QUESTIONS`)
- `tools/parse_questions.py` — regenerates `questions.js` from the source markdown:

  ```
  python3 tools/parse_questions.py "source.md" questions.js
  ```
