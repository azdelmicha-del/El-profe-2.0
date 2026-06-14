import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace chat-main and adminPanel
content = re.sub(
    r'<div class="chat-main" id="chat-main" data-panel="chat">.*?<div id="calendarPanel"',
    '<div class="chat-main" id="chat-main" data-panel="chat"></div>\n  <div id="adminPanel" class="panel-content" data-panel="admin"></div>\n\n  <div id="calendarPanel"',
    content,
    flags=re.DOTALL
)

# Replace Modals (from line 280 to 596)
# Look for '<!-- Modals -->' and '<script src="/public/js/admin.js?v=5"></script>'
content = re.sub(
    r'<!-- Modals -->.*?<script src="/public/js/admin.js\?v=5"></script>',
    '<!-- Modals Container -->\n<div id="modals-container"></div>\n\n  <script src="/public/js/admin.js?v=5"></script>',
    content,
    flags=re.DOTALL
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
