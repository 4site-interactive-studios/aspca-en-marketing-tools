"""Resolve the Springboard Twig branches in the one-time/annual source so each
EN page can be compared against the branch it replaces. QA instrument only."""
import re, sys
src = open(sys.argv[1], encoding='utf-8').read()
def resolve(s, annual):
    body = re.compile(r"\{%\s*if donation\.donation\.recurring_frequency == 'sb_fs_annually' %\}(.*?)\{% else %\}(.*?)\{% endif %\}", re.S)
    s = body.sub(lambda m: m.group(1) if annual else m.group(2), s, count=1)
    dtype = re.compile(r"\{% if donation\.donation\.recurring_frequency == 'recurs' %\}.*?\{% endif %\}", re.S)
    return dtype.sub('Annual' if annual else 'One-time', s, count=1)
open(sys.argv[2], 'w', encoding='utf-8').write(resolve(src, False))
open(sys.argv[3], 'w', encoding='utf-8').write(resolve(src, True))
