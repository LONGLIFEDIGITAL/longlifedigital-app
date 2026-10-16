"""Create a translation-only WXR seed; never modify existing live CMS records."""
import json
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/cms'
service = json.loads((OUT / 'translation-content.json').read_text())
# Starter rows are only used to upgrade existing, previously configured services.
# The live page and form read the editable ACF list, not this seed file.
(ROOT / 'wordpress/longlife-headless-commerce/translation-starter.json').write_text(
    json.dumps(json.loads(service['acf']['lld_translation_offerings']), indent=2, ensure_ascii=False) + '\n')
groups = json.loads((OUT / 'Longlife-Digital-ACF-Translation-Update.json').read_text())
wp = 'http://wordpress.org/export/1.2/'
content = 'http://purl.org/rss/1.0/modules/content/'
excerpt = 'http://wordpress.org/export/1.2/excerpt/'
dc = 'http://purl.org/dc/elements/1.1/'
for prefix, uri in [('wp', wp), ('content', content), ('excerpt', excerpt), ('dc', dc)]:
    ET.register_namespace(prefix, uri)

def node(parent, name, value, ns=None):
    result = ET.SubElement(parent, '{' + ns + '}' + name if ns else name)
    result.text = str(value)
    return result

rss = ET.Element('rss', version='2.0')
channel = ET.SubElement(rss, 'channel')
node(channel, 'title', 'Longlife Digital — Translation Service')
node(channel, 'link', 'https://longlifedigital.co')
node(channel, 'description', 'One translation service; existing services are not replaced.')
node(channel, 'wxr_version', '1.2', wp)
node(channel, 'base_site_url', 'https://longlifedigital.co', wp)
node(channel, 'base_blog_url', 'https://longlifedigital.co', wp)
item = ET.SubElement(channel, 'item')
node(item, 'title', service['title'])
node(item, 'creator', 'longlife-services', dc)
node(item, 'encoded', '', content)
node(item, 'encoded', service['excerpt'], excerpt)
for key, value in dict(post_id=910001, post_date='2026-10-15 00:00:00', post_date_gmt='2026-10-15 00:00:00', post_name=service['slug'], status='publish', post_type='lld_service', post_parent=0, menu_order=6, post_password='', comment_status='closed', ping_status='closed', is_sticky=0).items():
    node(item, key, value, wp)

def metadata(fields, values, prefix=''):
    for field in fields:
        name = field['name']
        if name not in values:
            continue
        full_name = prefix + name
        value = values[name]
        if field['type'] == 'group':
            metadata(field['sub_fields'], value, full_name + '_')
            value = ''
        for meta_key, meta_value in [(full_name, value), ('_' + full_name, field['key'])]:
            meta = ET.SubElement(item, '{' + wp + '}postmeta')
            node(meta, 'meta_key', meta_key, wp)
            node(meta, 'meta_value', meta_value, wp)

for group in groups:
    metadata(group['fields'], service['acf'])
ET.indent(rss, space='  ')
ET.ElementTree(rss).write(OUT / 'Longlife-Digital-Translation-Content.xml', encoding='utf-8', xml_declaration=True)
print('Created translation-only WordPress content import.')
