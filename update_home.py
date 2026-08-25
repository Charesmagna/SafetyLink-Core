import sys

file_path = "src/components/landing/Home.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Update signature
content = content.replace(
    "export function Home({ onLogin, onRegisterOrg }: { onLogin: () => void, onRegisterOrg: () => void }) {",
    "export function Home({ onLogin, onRegisterOrg, onRegisterUser }: { onLogin: () => void, onRegisterOrg: () => void, onRegisterUser: () => void }) {"
)

# Update nav buttons
old_nav = """            <div style={{display:'flex', gap:'12px', alignItems:'center', marginLeft:'12px'}}>
              <button onClick={onLogin} style={{background: 'transparent', color: '#1e293b', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px'}}>Log In</button>
              <button onClick={onRegisterOrg} style={{background: 'var(--green)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px'}}>Create Network</button>
            </div>"""
new_nav = """            <div style={{display:'flex', gap:'12px', alignItems:'center', marginLeft:'12px'}}>
              <button onClick={onLogin} style={{background: 'transparent', color: '#1e293b', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px'}}>Log In</button>
              <button onClick={onRegisterUser} style={{background: 'var(--green)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px'}}>Create New Account</button>
            </div>"""
content = content.replace(old_nav, new_nav)

# Update mobile nav buttons
old_mobile_nav = """          <div style={{display:'flex', flexDirection:'column', gap:'8px', marginTop:'8px', paddingTop:'8px', borderTop:'1px solid var(--border)'}}>
            <button onClick={() => { setMobileMenuOpen(false); onLogin(); }} style={{background: 'transparent', color: '#1e293b', border: '1px solid #cbd5e1', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '15px'}}>Log In</button>
            <button onClick={() => { setMobileMenuOpen(false); onRegisterOrg(); }} style={{background: 'var(--green)', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '15px'}}>Create Network</button>
          </div>"""
new_mobile_nav = """          <div style={{display:'flex', flexDirection:'column', gap:'8px', marginTop:'8px', paddingTop:'8px', borderTop:'1px solid var(--border)'}}>
            <button onClick={() => { setMobileMenuOpen(false); onLogin(); }} style={{background: 'transparent', color: '#1e293b', border: '1px solid #cbd5e1', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '15px'}}>Log In</button>
            <button onClick={() => { setMobileMenuOpen(false); onRegisterUser(); }} style={{background: 'var(--green)', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '15px'}}>Create New Account</button>
          </div>"""
content = content.replace(old_mobile_nav, new_mobile_nav)

# Update Hero buttons
old_hero_btns = """            <div className="hero-btns">
              <a href="https://wa.me/27739441222?text=Hi+I+want+to+get+SafetyLink" target="_blank" rel="noreferrer" className="btn-wa">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Get SafetyLink Now
              </a>
              <a href="#technology" className="btn-out">See How It Works →</a>
            </div>"""
new_hero_btns = """            <div className="hero-btns" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button onClick={onRegisterUser} className="btn-wa" style={{background: '#1e293b', color: '#fff', border: 'none', cursor: 'pointer', padding: '14px 24px', borderRadius: '30px', fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Register Individual</button>
              <button onClick={onRegisterOrg} className="btn-wa" style={{background: 'var(--green)', color: '#fff', border: 'none', cursor: 'pointer', padding: '14px 24px', borderRadius: '30px', fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Start your 14-day trial</button>
            </div>"""
content = content.replace(old_hero_btns, new_hero_btns)

with open(file_path, "w") as f:
    f.write(content)

