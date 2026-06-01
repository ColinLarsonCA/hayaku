run_parser:
	cd data && uv run extract_wiktionary.py

run:
	cd app && npm run dev