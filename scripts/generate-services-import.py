"""Create editable WordPress service posts; never bundled as storefront mock data."""
import json
from pathlib import Path
from xml.etree import ElementTree as ET

root = Path(__file__).resolve().parents[1]
wp = 'http://wordpress.org/export/1.2/'
content = 'http://purl.org/rss/1.0/modules/content/'
excerpt = 'http://wordpress.org/export/1.2/excerpt/'
dc = 'http://purl.org/dc/elements/1.1/'
for prefix, uri in [('wp', wp), ('content', content), ('excerpt', excerpt), ('dc', dc)]:
    ET.register_namespace(prefix, uri)
rss = ET.Element('rss', version='2.0')
channel = ET.SubElement(rss, 'channel')

def node(parent, name, value, ns=None):
    result = ET.SubElement(parent, '{' + ns + '}' + name if ns else name)
    result.text = str(value)
    return result

node(channel, 'title', 'Longlife Digital — Digital Services')
node(channel, 'link', 'https://longlifedigital.co')
node(channel, 'description', 'The five service records requested for the storefront.')
node(channel, 'wxr_version', '1.2', wp)
node(channel, 'base_site_url', 'https://longlifedigital.co', wp)
node(channel, 'base_blog_url', 'https://longlifedigital.co', wp)
for index, service in enumerate(json.loads((root / 'docs/cms/services-content.json').read_text()), 1):
    item = ET.SubElement(channel, 'item')
    node(item, 'title', service['title'])
    node(item, 'creator', 'longlife-services', dc)
    node(item, 'encoded', service['content'], content)
    node(item, 'encoded', service['excerpt'], excerpt)
    for key, value in dict(post_id=900000 + index, post_date='2026-09-30 00:00:00', post_date_gmt='2026-09-30 00:00:00', post_name=service['slug'], status='publish', post_type='lld_service', post_parent=0, menu_order=index, post_password='', comment_status='closed', ping_status='closed', is_sticky=0).items():
        node(item, key, value, wp)
    fields = {
        'lld_icon': service['icon'], 'lld_nav_label': service['navLabel'],
        'lld_nav_summary': service['excerpt'], 'lld_service_visual': service['visual'],
        'lld_specialties': '\n'.join(service['specialties']),
        'lld_package_details': service['packageDetails'], 'lld_service_process': service['process'],
        'lld_pricing_mode': 'contact', 'lld_inquiry_title': 'Tell us about your next step.',
        'lld_inquiry_intro': 'Share a few details and we’ll get back to you to discuss your project and a tailored quote.',
    }
    for name, value in fields.items():
        for meta_key, meta_value in [(name, value), ('_' + name, 'field_lld_service_' + name)]:
            meta = ET.SubElement(item, '{' + wp + '}postmeta')
            node(meta, 'meta_key', meta_key, wp)
            node(meta, 'meta_value', meta_value, wp)
ET.indent(rss, space='  ')
ET.ElementTree(rss).write(root / 'docs/cms/Longlife-Digital-Services-Content.xml', encoding='utf-8', xml_declaration=True)
