import React from 'react';

const PrivacyPolicy: React.FC = () => (
  <div style={{ maxWidth: '800px', margin: '80px auto', padding: '0 24px', fontFamily: 'Inter, sans-serif', color: '#1e293b', lineHeight: 1.8 }}>
    <h1 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '8px', color: '#0f172a' }}>Privacy Policy</h1>
    <p style={{ color: '#64748b', marginBottom: '32px', fontSize: '13px' }}>
      SafetyLink® · TM Media Solutions (Reg: 2018/500191/07) · Last updated: September 2026
    </p>

    <section style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px', color: '#0f172a' }}>1. Who We Are</h2>
      <p>SafetyLink is an emergency response platform operated by TM Media Solutions (Pty) Ltd, registration number 2018/500191/07, based in South Africa. Our platform is available at <a href="https://safetylink.online" style={{ color: '#15803d' }}>safetylink.online</a>. Contact us at <a href="mailto:info@safetylink.online" style={{ color: '#15803d' }}>info@safetylink.online</a> or WhatsApp +27 73 944 1222.</p>
    </section>

    <section style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px', color: '#0f172a' }}>2. Information We Collect</h2>
      <ul style={{ paddingLeft: '20px' }}>
        <li><strong>Identity data:</strong> Name, email address, phone number</li>
        <li><strong>Location data:</strong> GPS coordinates captured only during active panic alerts</li>
        <li><strong>Device data:</strong> Bluetooth device identifiers for iTAG pairing</li>
        <li><strong>Emergency contacts:</strong> Names and phone numbers you choose to register</li>
        <li><strong>Alert history:</strong> Timestamps and trigger types of past alerts</li>
        <li><strong>Payment data:</strong> Processed securely by Paystack — we never store card details</li>
      </ul>
    </section>

    <section style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px', color: '#0f172a' }}>3. How We Use Your Information</h2>
      <ul style={{ paddingLeft: '20px' }}>
        <li>To dispatch emergency alerts to your registered contacts</li>
        <li>To operate the SafetyLink Command Deck for your organisation</li>
        <li>To process your subscription via Paystack</li>
        <li>To improve platform performance and response times</li>
        <li>To comply with legal obligations including POPIA</li>
      </ul>
    </section>

    <section style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px', color: '#0f172a' }}>4. POPIA Compliance</h2>
      <p>SafetyLink processes personal information in accordance with the Protection of Personal Information Act 4 of 2013 (POPIA). We only collect information necessary for emergency response purposes. You have the right to access, correct, or request deletion of your personal information at any time by contacting us.</p>
    </section>

    <section style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px', color: '#0f172a' }}>5. Location Data</h2>
      <p>GPS location is captured <strong>only</strong> when a panic alert is triggered. Location data is transmitted to your registered emergency contacts and the SafetyLink command centre solely for the purpose of directing help to you. We do not track your location continuously or sell location data to any third party.</p>
    </section>

    <section style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px', color: '#0f172a' }}>6. Third-Party Services</h2>
      <p>SafetyLink uses the following third-party services to deliver its emergency response capabilities:</p>
      <ul style={{ paddingLeft: '20px' }}>
        <li><strong>Twilio</strong> — SMS and WhatsApp alert delivery</li>
        <li><strong>VAPI</strong> — AI voice call dispatch</li>
        <li><strong>Africa's Talking</strong> — USSD emergency access</li>
        <li><strong>Paystack</strong> — Payment processing</li>
        <li><strong>Cloudinary</strong> — Evidence media storage</li>
        <li><strong>Google Gemini</strong> — AI language processing</li>
        <li><strong>Cloudflare</strong> — API infrastructure and DDoS protection</li>
      </ul>
      <p style={{ marginTop: '12px' }}>Each service operates under its own privacy policy and data processing agreements.</p>
    </section>

    <section style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px', color: '#0f172a' }}>7. Data Retention</h2>
      <p>Alert records are retained for 24 months for legal compliance and insurance purposes. Payment records are retained for 7 years as required by South African tax law. You may request earlier deletion of personal data where legally permissible.</p>
    </section>

    <section style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px', color: '#0f172a' }}>8. Data Security</h2>
      <p>All data is encrypted in transit using TLS 1.3. Panic alert records are stored in an immutable Evidence Ledger. We do not store payment card details. Access to personal data is restricted to authorised SafetyLink personnel only.</p>
    </section>

    <section style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px', color: '#0f172a' }}>9. Your Rights</h2>
      <p>Under POPIA you have the right to:</p>
      <ul style={{ paddingLeft: '20px' }}>
        <li>Access your personal information</li>
        <li>Correct inaccurate information</li>
        <li>Request deletion of your data</li>
        <li>Object to processing of your data</li>
        <li>Lodge a complaint with the Information Regulator of South Africa</li>
      </ul>
    </section>

    <section style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px', color: '#0f172a' }}>10. Contact & Complaints</h2>
      <p>
        <strong>SafetyLink Privacy Officer</strong><br/>
        TM Media Solutions (Pty) Ltd<br/>
        Reg: 2018/500191/07<br/>
        Email: <a href="mailto:info@safetylink.online" style={{ color: '#15803d' }}>info@safetylink.online</a><br/>
        WhatsApp: +27 73 944 1222<br/>
        Website: <a href="https://safetylink.online" style={{ color: '#15803d' }}>safetylink.online</a>
      </p>
    </section>

    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginTop: '40px', textAlign: 'center' }}>
      <p style={{ fontSize: '12px', color: '#64748b' }}>
        SafetyLink® · Powered by ©TM Media Solutions · Reg: 2018/500191/07<br/>
        POPIA compliant · All data processed within South Africa
      </p>
    </div>
  </div>
);

export default PrivacyPolicy;
