"""Package the repository's editable starters and matching in-portal previews.

Uses only Python's standard library. Hidden files and unknown extensions are
excluded; .env.example is the single intentional exception. Never copies a
working directory wholesale into a public archive.
"""
from pathlib import Path
import json
import zipfile

PORTAL = Path(__file__).resolve().parent
REPO = PORTAL.parent
ROUTES = ('ui', 'markdown', 'sdk', 'claude-sdk', 'codex-sdk', 'workflow')
EXTENSIONS = {'.md', '.txt', '.py', '.mjs', '.json'}
catalog = {}
destination = PORTAL / 'frontend/public/workshop-starters'
destination.mkdir(parents=True, exist_ok=True)
for route in ROUTES:
    for lang in ('cs', 'en'):
        folder = REPO / route / lang
        files = {}
        for path in sorted(folder.iterdir()):
            if path.is_symlink() or not path.is_file():
                continue
            if path.name != '.env.example' and (path.name.startswith('.') or path.suffix not in EXTENSIONS):
                continue
            files[path.name] = path.read_text(encoding='utf-8')
        for required in ('README.md', 'create-agent.md', 'brief.md', 'instructions.md', 'materials.md', 'task.txt', 'tests.md', 'test-record.md'):
            if required not in files:
                raise ValueError(f'Missing {route}/{lang}/{required}')
        key = f'{route}-{lang}'
        with zipfile.ZipFile(destination / f'{key}.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
            for name, body in files.items():
                # Stable timestamps make repeated builds reproducible.
                entry = zipfile.ZipInfo(f'{key}/{name}', date_time=(2026, 1, 1, 0, 0, 0))
                entry.compress_type = zipfile.ZIP_DEFLATED
                archive.writestr(entry, body.encode('utf-8'))
        catalog[key] = files
(PORTAL / 'frontend/src/workshop/starterCatalog.json').write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Packaged {len(catalog)} starters with matching source previews.')
