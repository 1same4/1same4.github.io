# Build live pages from the staging copies in /v2/
import re
R='/home/claude/1same4.github.io/'
ar=open(R+'v2/index.html',encoding='utf8').read()
en=open(R+'v2/en.html',encoding='utf8').read()
ar=ar.replace('<meta name="robots" content="noindex">','<link rel="canonical" href="https://janabiai.com/">')
ar=ar.replace('href="/v2/en.html" id="en"','href="/en/" id="en"')
ar=ar.replace('<script>try{if("scrollRestoration" in history)history.scrollRestoration="manual";','<script>try{if("scrollRestoration" in history)history.scrollRestoration="manual";var B=/bot|crawl|spider|slurp|google|bing|yandex|lighthouse/i.test(navigator.userAgent);var L=B?"ar":localStorage.getItem("lang");if(L==="en")location.replace("/en/");else if(!L){var n=(navigator.languages&&navigator.languages[0])||navigator.language||"ar";if(!/^ar/i.test(n))location.replace("/en/")}',1)
en=en.replace('<meta name="robots" content="noindex">','')
en=en.replace('href="/v2/" id="en"','href="/" id="en"')
assert 'noindex' not in ar and 'noindex' not in en and 'location.replace("/en/")' in ar
open(R+'index.html','w',encoding='utf8').write(ar)
open(R+'en/index.html','w',encoding='utf8').write(en)
print('live built')
