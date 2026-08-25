import xml.etree.ElementTree as ET

tree = ET.parse('android/app/src/main/AndroidManifest.xml')
root = tree.getroot()
app = root.find('application')

# Find and remove unwanted elements
to_remove = []
for child in app:
    name = child.attrib.get('{http://schemas.android.com/apk/res/android}name', '')
    if name in ['.services.WatchdogService', '.services.WatchdogAlarmReceiver', '.SafetyBackgroundService']:
        to_remove.append(child)

for child in to_remove:
    app.remove(child)

# Remove the permission FOREGROUND_SERVICE_DATA_SYNC
to_remove_perm = []
for child in root.findall('uses-permission'):
    name = child.attrib.get('{http://schemas.android.com/apk/res/android}name', '')
    if name == 'android.permission.FOREGROUND_SERVICE_DATA_SYNC':
        to_remove_perm.append(child)

for child in to_remove_perm:
    root.remove(child)

# Register namespace so we don't get ns0: prefixes
ET.register_namespace('android', 'http://schemas.android.com/apk/res/android')
ET.register_namespace('tools', 'http://schemas.android.com/tools')

tree.write('android/app/src/main/AndroidManifest.xml', encoding='utf-8', xml_declaration=True)
