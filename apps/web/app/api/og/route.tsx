import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        
        // Custom URL parameters for dynamic sharing
        const title = searchParams.get('title') || 'LifePartner AI';
        const subtitle = searchParams.get('subtitle') || 'The World\'s First AI-Powered Matchmaking Platform';
        const isMatched = searchParams.get('matched') === 'true';

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundImage: isMatched 
                            ? 'linear-gradient(to bottom right, #E11D48, #9333EA)' 
                            : 'linear-gradient(to bottom right, #1e1b4b, #312e81)',
                        color: 'white',
                        padding: '80px',
                        textAlign: 'center',
                        fontFamily: 'sans-serif'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px' }}>
                        <div style={{ fontSize: '80px' }}>{isMatched ? '💖' : '✨'}</div>
                    </div>
                    
                    <div
                        style={{
                            fontSize: '64px',
                            fontWeight: 900,
                            letterSpacing: '-2px',
                            marginBottom: '20px',
                            lineHeight: 1.1,
                            background: 'linear-gradient(to bottom, #ffffff, #e2e8f0)',
                            backgroundClip: 'text',
                            color: 'transparent',
                        }}
                    >
                        {title}
                    </div>
                    
                    <div
                        style={{
                            fontSize: '32px',
                            fontWeight: 500,
                            color: 'rgba(255, 255, 255, 0.8)',
                            maxWidth: '800px',
                            lineHeight: 1.4,
                        }}
                    >
                        {subtitle}
                    </div>

                    <div style={{ position: 'absolute', bottom: '60px', left: '80px', display: 'flex', alignItems: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '2px', color: '#a5b4fc' }}>
                            LIFEPARTNERAI.IN
                        </div>
                    </div>
                    
                    {/* Fake Badge */}
                    <div style={{ position: 'absolute', bottom: '60px', right: '80px', display: 'flex', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '100px' }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>
                            100% Free & Verified
                        </div>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        );
    } catch (e: any) {
        console.log(`${e.message}`);
        return new Response(`Failed to generate the image`, {
            status: 500,
        });
    }
}
