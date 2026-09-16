import sys

file_path = "src/components/landing/Home.tsx"
with open(file_path, "r") as f:
    content = f.read()

# 1. Update the Header Logo
# Current: <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('home'); }} className="nav-logo">            <span>SafetyLink</span>          </a>
# Change to include an image
new_nav_logo = """<a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('home'); }} className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/official_safetylink_logo.svg" alt="SafetyLink Logo" style={{ height: '32px' }} />
            <span>SafetyLink</span>
          </a>"""

content = content.replace(
    '<a href="#" onClick={(e) => { e.preventDefault(); setCurrentView(\'home\'); }} className="nav-logo">\n            <span>SafetyLink</span>\n          </a>',
    new_nav_logo
)

# 2. Update the Hero images
# Hero right currently has:
# <img className="hero-phone" src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313194/Code_Generated_Image_1.png" alt="SafetyLink SOS Screen" />
# <img className="hero-phone" src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309979/ChatGPT_Image_Jul_3_2026_11_33_15_PM.png" alt="SafetyLink Command Login" />
new_hero_images = """              <img className="hero-phone" src="/Screenshot_20260820_201927_com.aistudio.safetylink.vqnztp.jpg" alt="SafetyLink App UI" />
              <img className="hero-phone" src="/panic-button-smooth.png" alt="SafetyLink Button" style={{ padding: '20px', objectFit: 'contain' }} />
              <img className="hero-phone" src="/Polish_20260620_014530309.jpg" alt="Organizations Panel" />"""

content = content.replace(
    '<img className="hero-phone" src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313194/Code_Generated_Image_1.png" alt="SafetyLink SOS Screen" />\n              <img className="hero-phone" src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309979/ChatGPT_Image_Jul_3_2026_11_33_15_PM.png" alt="SafetyLink Command Login" />',
    new_hero_images
)

# 3. Replace the K'lev.ai image
# <img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309978/K_leva.png" alt="K'lev.ai Intelligence Platform" />
content = content.replace(
    '<img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309978/K_leva.png" alt="K\'lev.ai Intelligence Platform" />',
    '<img src="/Polish_20260727_023640262.jpg" alt="SafetyLink App Analytics UI" style={{ borderRadius: \'12px\' }} />'
)

# 4. Replace the "skull" 3D logo in the gallery
# <div className="gal-item"><img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787310052/copilot_image_1783703540293.png" alt="SafetyLink 3D logo" /><div className="gal-caption">SafetyLink 3D Brand Mark</div></div>
content = content.replace(
    '<div className="gal-item"><img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787310052/copilot_image_1783703540293.png" alt="SafetyLink 3D logo" /><div className="gal-caption">SafetyLink 3D Brand Mark</div></div>',
    '<div className="gal-item"><img src="/safetylink-metallic.svg" alt="SafetyLink 3D logo" style={{ padding: \'20px\', objectFit: \'contain\', background: \'#1e293b\' }} /><div className="gal-caption">SafetyLink Brand Identity</div></div>'
)

# 5. Fix "SafetyLink Global Protection Network" banner image
content = content.replace(
    '<img className="network-banner" src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309945/Gemini_Generated_Image_59psss59psss59ps.jpg" alt="SafetyLink Global Protection Network" />',
    '<img className="network-banner" src="/Polish_20260727_010938698.jpg" alt="SafetyLink Global Protection Network" />'
)

with open(file_path, "w") as f:
    f.write(content)
