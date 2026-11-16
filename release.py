#!/usr/bin/env python3
"""Stamp a new version so installed apps pick up the change.

Usage: python3 release.py "One line on what's new, shown to users in the update card."
Then commit and push. Run it for every change, however small.
(The line is shown as written, in both languages. Keep it short and plain.)
"""
import hashlib, re, sys, pathlib
root = pathlib.Path(__file__).parent
news = (sys.argv[1] if len(sys.argv) > 1 else "Small fixes and improvements.").replace('"', "'")
files = ["index.html", "css/app.css", "manifest.webmanifest",
         "js/brand.js", "js/i18n.js", "js/store.js", "js/ui.js", "js/news.js", "js/auth.js", "js/onboard.js",
         "js/founder.js", "js/waste.js", "js/partner.js", "js/investor.js", "js/team.js", "js/app.js",
         "data/projects.json", "data/waste.json", "data/partners.json", "data/investors.json", "data/activity.json"]
STAMP = r'var ICON_VERSION = "[^"]*", ICON_NEWS = "[^"]*";'
shell = (root / "js/shell.js").read_text(encoding="utf-8")
shell_body = re.sub(STAMP, "", shell)
h = hashlib.sha1()
for f in files: h.update((root / f).read_bytes())
h.update(shell_body.encode()); h.update(news.encode())
sw = (root / "sw.js").read_text(encoding="utf-8")
h.update(re.sub(r'const VERSION = "[^"]*";', "", sw).encode())
ver = h.hexdigest()[:10]
shell = re.sub(STAMP, f'var ICON_VERSION = "{ver}", ICON_NEWS = "{news}";', shell, count=1)
(root / "js/shell.js").write_text(shell, encoding="utf-8")
sw = re.sub(r'const VERSION = "[^"]*";', f'const VERSION = "{ver}";', sw, count=1)
(root / "sw.js").write_text(sw, encoding="utf-8")
print("version", ver)
