export default function Loading() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        .sk {
          background: linear-gradient(90deg, #F3F4F6 25%, #E9EAEC 50%, #F3F4F6 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s ease-in-out infinite;
          border-radius: 10px;
        }
      `}</style>

            {/* Header skeleton */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div className="sk" style={{ width: 140, height: 26, marginBottom: 6 }} />
                    <div className="sk" style={{ width: 90, height: 14 }} />
                </div>
                <div className="sk" style={{ width: 100, height: 36 }} />
            </div>

            {/* Stats row skeleton */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[1, 2, 3].map(i => (
                    <div key={i} className="sk" style={{ height: 70, borderRadius: 14 }} />
                ))}
            </div>

            {/* Content cards skeleton */}
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="sk" style={{ height: 72, borderRadius: 14 }} />
            ))}
        </div>
    )
}