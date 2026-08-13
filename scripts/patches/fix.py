import sys
content = sys.stdin.read()
content = content.replace('            body  = "Distress signal broadcasting! Location: [" + locationStr + "] \\\n• GHOST ENGINE: ACTIVE \\\n• BLE LINK: ACTIVE \\\n• TX RELAY: ENGAGED";', '            body  = "Distress signal broadcasting! Location: [" + locationStr + "] \\n• GHOST ENGINE: ACTIVE \\n• BLE LINK: ACTIVE \\n• TX RELAY: ENGAGED";')
content = content.replace('            body  = "• SERVICE ACTIVE \\\n• GHOST ENGINE ACTIVE \\\n• BLE LINKED: " + devicesStr + " \\\n• HPE GPS LOCKED: [" + locationStr + "]";', '            body  = "• SERVICE ACTIVE \\n• GHOST ENGINE ACTIVE \\n• BLE LINKED: " + devicesStr + " \\n• HPE GPS LOCKED: [" + locationStr + "]";')
sys.stdout.write(content)
