import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

export default function handler() {
  return new ImageResponse(
    <div
      style={{
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a001e 0%, #1a0533 40%, #2d0f6b 70%, #1a0533 100%)',
        fontFamily: 'serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background orbs */}
      <div
        style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          top: '-150px',
          right: '-100px',
          background: 'radial-gradient(circle, rgba(147,51,234,0.35) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          bottom: '-100px',
          left: '-80px',
          background: 'radial-gradient(circle, rgba(201,150,63,0.2) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />

      {/* Top gold bar */}
      <div
        style={{
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          height: '4px',
          background: 'linear-gradient(90deg, #7C3AED, #C9963F, #E8C97A, #C9963F, #7C3AED)',
        }}
      />

      {/* Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(201,150,63,0.15)',
          border: '1px solid rgba(201,150,63,0.4)',
          borderRadius: '30px',
          padding: '8px 24px',
          marginBottom: '32px',
        }}
      >
        <span style={{ fontSize: '14px', fontWeight: 700, color: '#E8C97A', letterSpacing: '3px', textTransform: 'uppercase' }}>
          ✦ Premium Digital Store
        </span>
      </div>

      {/* Main title */}
      <div
        style={{
          fontSize: '72px',
          fontWeight: 800,
          color: '#ffffff',
          lineHeight: 1.1,
          textAlign: 'center',
          marginBottom: '16px',
          letterSpacing: '-1px',
        }}
      >
        Longlife{' '}
        <span style={{ color: '#E8C97A' }}>Digital</span>
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontSize: '26px',
          color: 'rgba(255,255,255,0.7)',
          textAlign: 'center',
          maxWidth: '700px',
          lineHeight: 1.4,
          marginBottom: '48px',
        }}
      >
        Courses · AI Tools · Ebooks · Marketing Templates · Domains
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '40px' }}>
        {[['11+', 'Products'], ['⚡', 'Instant Delivery'], ['★ 4.9', 'Avg Rating']].map(([val, label]) => (
          <div
            key={label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '16px',
              padding: '16px 32px',
            }}
          >
            <span style={{ fontSize: '28px', fontWeight: 800, color: '#E8C97A' }}>{val}</span>
            <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* URL */}
      <div
        style={{
          position: 'absolute',
          bottom: '32px',
          fontSize: '18px',
          color: 'rgba(255,255,255,0.35)',
          letterSpacing: '1px',
        }}
      >
        longlifedigital.co
      </div>
    </div>,
    { width: 1200, height: 630 }
  );
}
