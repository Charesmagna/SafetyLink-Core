import sys
import re

file_path = "src/components/landing/Home.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Replace the buttons
content = content.replace(
    '<a href="https://wa.me/27739441222?text=I+want+to+register+as+a+SafetyLink+resident" target="_blank" rel="noreferrer" className="price-cta o">Register Now</a>',
    '<button onClick={onRegisterUser} className="price-cta o" style={{border: "none", cursor: "pointer"}}>Register Now</button>'
)
content = content.replace(
    '<a href="https://wa.me/27739441222?text=I+want+to+onboard+my+estate+to+SafetyLink" target="_blank" rel="noreferrer" className="price-cta g">Get a Quote on WhatsApp</a>',
    '<button onClick={onRegisterOrg} className="price-cta g" style={{border: "none", cursor: "pointer"}}>Start your 14-day trial</button>'
)

# Fix the big svg block wa-btn
content = re.sub(
    r'<a href="https://wa\.me/27739441222\?text=Hi\+I\+want\+to\+deploy\+SafetyLink\+for\+my\+community" target="_blank" rel="noreferrer" className="wa-btn">([\s\S]*?)</a>',
    r'<button onClick={onRegisterOrg} className="wa-btn" style={{border: "none", cursor: "pointer"}}>\1</button>',
    content
)

with open(file_path, "w") as f:
    f.write(content)

