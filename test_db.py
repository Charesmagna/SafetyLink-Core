import json
import os

try:
    with open('firebase-applet-config.json', 'r') as f:
        print("firebase config exists:", json.load(f))
except Exception as e:
    print("firebase config missing:", str(e))
