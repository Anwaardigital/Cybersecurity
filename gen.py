#!/usr/bin/env python3
"""CyberSec Hub site generator — templates + page builders."""
import os

BASE = os.path.dirname(os.path.abspath(__file__))
GA = "G-T6WVGJVD4J"
SITE = "https://anwaardigital.com/Cybersecurity"

NAV = """<nav class="navbar"><div class="nav-inner">
<a href="{root}index.html" class="brand"><span class="brand-icon">🛡️</span><span>CyberSec <span class="green">Hub</span></span></a>
<button class="nav-toggle" onclick="document.getElementById('navLinks').classList.toggle('open')">☰</button>
<ul class="nav-links" id="navLinks">
<li><a href="{root}index.html">Home</a></li>
<li><a href="{root}index.html#basics">Basics</a></li>
<li><a href="{root}index.html#hacking">Ethical Hacking</a></li>
<li><a href="{root}index.html#tools">Tools</a></li>
<li><a href="{root}index.html#career">Career</a></li>
<li><a href="{root}sectools/index.html">SecTools</a></li>
<li><a href="{root}glossary.html">Glossary</a></li>
<li><a href="{root}faq.html">FAQ</a></li>
<li><a href="{root}about.html">About</a></li>
</ul></div></nav>"""

WA_BTN = """<a href="https://wa.me/923288317526" class="wa-float" target="_blank" rel="noopener" aria-label="Chat on WhatsApp"><svg viewBox="0 0 32 32"><path d="M16 3C9.4 3 4 8.4 4 15c0 2.4.7 4.6 2 6.5L4 29l7.7-2c1.8 1 3.9 1.6 6.1 1.6h.1c6.6 0 12-5.4 12-12S22.6 3 16 3zm0 21.8c-1.9 0-3.7-.5-5.3-1.5l-.4-.2-4.6 1.2 1.2-4.5-.3-.4c-1-1.6-1.6-3.5-1.6-5.5C5 9.6 10.6 5 16 5s11 4.6 11 10-5.4 9.8-11 9.8zm6.1-7.3c-.3-.2-2-1-2.3-1.1-.3-.1-.5-.2-.8.2-.2.3-.9 1.1-1.1 1.3-.2.2-.4.3-.8.1-.3-.2-1.4-.5-2.7-1.6-.9-.9-1.6-1.9-1.8-2.3-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.4.3-.6.1-.2 0-.4 0-.6L13 9.5c-.3-.8-.7-.7-1-.7h-.8c-.3 0-.7.1-1.1.5-.4.4-1.4 1.4-1.4 3.5s1.5 4 1.7 4.3c.2.3 2.9 4.4 7 6.2 1 .4 1.7.7 2.3.9.9.3 1.8.2 2.5.2.8-.1 2.3-1 2.7-1.9.3-.9.3-1.7.2-1.9-.1-.1-.3-.2-.7-.4z"/></svg></a>"""

FOOT_TMPL = """<footer class="footer"><div class="container">
<div class="footer-brand">🛡️ CyberSec <span class="green">Hub</span></div>
<p>Learn cybersecurity the ethical, legal way.</p>
<div class="footer-links">
<a href="{root}index.html">Home</a><a href="{root}about.html">About</a><a href="{root}contact.html">Contact</a><a href="{root}privacy.html">Privacy Policy</a><a href="{root}disclaimer.html">Disclaimer</a><a href="{root}terms.html">Terms</a>
</div>
<p class="copyright">© 2026 CyberSec Hub by Anwaar Digital. All rights reserved. Educational content only — always test with written permission.</p>
<p class="copyright">Developed by <strong style="color:#00e676">Malik Anwaar</strong></p>
</div></footer>"""

GA_SCRIPT = """<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=""" + GA + """"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','""" + GA + """');</script>"""

HEAD_TMPL = """<!DOCTYPE html>
<html lang="en">
<head>
<link rel="icon" type="image/png" sizes="192x192" href="https://anwaardigital.com/Cybersecurity/cyber-icon-192.png">
<link rel="icon" type="image/png" sizes="512x512" href="https://anwaardigital.com/Cybersecurity/cyber-icon-512.png">
<link rel="apple-touch-icon" href="https://anwaardigital.com/Cybersecurity/cyber-icon-192.png">
<!-- Cookie consent (GDPR): Google Analytics loads only after you press Accept -->
<script src="{root}cookie-consent.js" defer></script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="stylesheet" href="{root}styles.css">
<link rel="canonical" href="{canonical}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:type" content="website">
<meta property="og:url" content="{canonical}">
<meta property="og:site_name" content="CyberSec Hub">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{desc}">
</head>
<body>
"""

def make_head(title, desc, root, canonical):
    return HEAD_TMPL.replace("{ga}", GA_SCRIPT).replace("{title}", title).replace("{desc}", desc).replace("{root}", root).replace("{canonical}", canonical)

ETHICAL = """<div class="ethical-box"><strong>⚠️ Ethical Use Only:</strong> Only test systems you own or have <strong>written permission</strong> to test. Unauthorized hacking is illegal in Pakistan and worldwide. Everything here is for defensive security education and authorized testing only.</div>"""

def article_page(root, slug, title, desc, category, body_html, ethical=True):
    eth = ETHICAL if ethical else ""
    head = make_head(title, desc, root, f"{SITE}/{slug}")
    nav = NAV.replace("{root}", root)
    foot = FOOT_TMPL.replace("{root}", root)
    return head + nav + \
        f"""<div class="breadcrumb"><a href="{root}index.html">Home</a> / {category} / {title.split('—')[0].split(':')[0].strip()}</div>
<header class="article-hero"><span class="section-tag">{category}</span><h1>{title}</h1><div class="article-meta">By CyberSec Hub · {len(body_html)//600 + 4} min read</div></header>
<main class="article-body">{eth}{body_html}</main>
""" + foot + WA_BTN + "</body></html>"

def static_page(root, slug, title, desc, h1, body_html):
    head = make_head(title, desc, root, f"{SITE}/{slug}")
    nav = NAV.replace("{root}", root)
    foot = FOOT_TMPL.replace("{root}", root)
    return head + nav + \
        f"""<main class="page-wrap"><h1>{h1}</h1>{body_html}</main>
""" + foot + WA_BTN + "</body></html>"

def write(path, content):
    full = os.path.join(BASE, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w") as f:
        f.write(content)
    words = len(content.split())
    print(f"  wrote {path} ({words} words)")
