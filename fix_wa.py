import sys

# 1. Update Home.tsx
file_path = "src/components/landing/Home.tsx"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace(
    '<a href="https://wa.me/27739441222?text=I+want+to+register+as+a+SafetyLink+resident" target="_blank" rel="noreferrer" className="price-cta o">Register Now</a>',
    '<button onClick={onRegisterUser} className="price-cta o" style={{border: "none", cursor: "pointer"}}>Register Now</button>'
)

content = content.replace(
    '<a href="https://wa.me/27739441222?text=I+want+to+onboard+my+estate+to+SafetyLink" target="_blank" rel="noreferrer" className="price-cta g">Get a Quote on WhatsApp</a>',
    '<button onClick={onRegisterOrg} className="price-cta g" style={{border: "none", cursor: "pointer"}}>Start your 14-day trial</button>'
)

content = content.replace(
    '<a href="https://wa.me/27739441222?text=Hi+I+want+to+deploy+SafetyLink+for+my+community" target="_blank" rel="noreferrer" className="wa-btn">',
    '<button onClick={onRegisterOrg} className="wa-btn" style={{border: "none", cursor: "pointer"}}>'
)

with open(file_path, "w") as f:
    f.write(content)

# 2. Update Layout.tsx
file_path = "src/components/landing/Layout.tsx"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace(
    '<a href="https://wa.me/27739441222?text=Hi+I+want+to+request+a+SafetyLink+demo" target="_blank" rel="noreferrer" className="bg-[#15803d] hover:bg-green-700 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-colors shadow-sm">Request Demo</a>',
    '<button onClick={onRegisterOrg} className="bg-[#15803d] hover:bg-green-700 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-colors shadow-sm">Start your 14-day trial</button>'
)

content = content.replace(
    '<a href="https://wa.me/27739441222" target="_blank" rel="noreferrer" className="bg-[#15803d] text-white p-3 rounded-full font-bold text-center text-[15px] block">Request Demo</a>',
    '<button onClick={onRegisterOrg} className="bg-[#15803d] text-white p-3 rounded-full font-bold text-center text-[15px] block w-full">Start your 14-day trial</button>'
)

with open(file_path, "w") as f:
    f.write(content)

# 3. Update Pricing.tsx (just in case they are there)
file_path = "src/components/landing/Pricing.tsx"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace(
    '<a href="https://wa.me/27739441222?text=Hi+I+want+an+enterprise+quote" target="_blank" rel="noreferrer" className="w-full bg-[#15803d] hover:bg-green-700 text-white text-center text-xs font-bold py-3 rounded-xl transition-colors">Contact via WhatsApp</a>',
    '<button onClick={onRegisterOrg} className="w-full bg-[#15803d] hover:bg-green-700 text-white text-center text-xs font-bold py-3 rounded-xl transition-colors">Start your 14-day trial</button>'
)
with open(file_path, "w") as f:
    f.write(content)

