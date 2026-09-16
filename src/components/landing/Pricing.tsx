import React from 'react';
import PaystackCheckout from '../PaystackCheckout';

export function Pricing(props: any) {
  return (
    <div style={{ background: '#070a0f', minHeight: '100vh', paddingTop: '80px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
      <PaystackCheckout />
    </div>
  );
}
