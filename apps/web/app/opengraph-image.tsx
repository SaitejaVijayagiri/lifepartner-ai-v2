
import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const alt = 'LifePartner AI - Smart Matchmaking';
export const size = {
    width: 1200,
    height: 630,
};

export const contentType = 'image/png';

// Image generation
export default async function Image() {
    return new ImageResponse(
        (
            // ImageResponse JSX element
            <div
                style={{
                    display: 'flex',
                    height: '100%',
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    backgroundImage: 'linear-gradient(to bottom right, #4338ca, #be185d)',
                    color: 'white',
                    fontFamily: 'sans-serif',
                    position: 'relative',
                }}
            >
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 2%, transparent 10%)',
                    backgroundSize: '40px 40px',
                }}></div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '40px',
                    padding: '40px 80px',
                    border: '2px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                    flexDirection: 'column',
                }}>
                    <div style={{ fontSize: 80, marginBottom: 20 }}>✨</div>
                    <div style={{ fontSize: 60, fontWeight: 'bolder', marginBottom: 10, letterSpacing: '-0.02em', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                        LifePartner AI
                    </div>
                    <div style={{ fontSize: 30, opacity: 0.9, fontWeight: 'normal', color: '#e0e7ff' }}>
                        Matches made by AI. Verified by Humans.
                    </div>
                    <div style={{
                        marginTop: 40,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 20,
                    }}>
                        <div style={{ padding: '10px 20px', backgroundColor: '#fff', color: '#4338ca', borderRadius: '20px', fontSize: 24, fontWeight: 'bold' }}>100% Free</div>
                        <div style={{ padding: '10px 20px', backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: '20px', fontSize: 24 }}>No Fake Profiles</div>
                    </div>
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
