import Link from 'next/link'

export default function NotFound() {
    return (
        <div style={{
            minHeight: '100dvh',
            background: '#F4F6F9',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '24px', textAlign: 'center',
            fontFamily: 'Inter, sans-serif',
        }}>
            <div style={{ fontSize: '72px', marginBottom: '16px' }}>🔍</div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#111827', marginBottom: '8px' }}>
                Page Not Found
            </div>
            <div style={{ fontSize: '15px', color: '#6B7280', marginBottom: '32px', maxWidth: '280px' }}>
                The page you're looking for doesn't exist or has been moved.
            </div>
            <Link href="/" style={{
                background: 'linear-gradient(135deg, #00A651, #007A3D)',
                color: 'white', fontWeight: 700, fontSize: '15px',
                padding: '14px 28px', borderRadius: '16px',
                textDecoration: 'none',
                boxShadow: '0 6px 20px rgba(0,166,81,0.35)',
            }}>
                Go Home
            </Link>
        </div>
    )
}