import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

function truncate(str: string, maxChars: number = 16): string {
    if (!str) return '';
    return str.length > maxChars ? str.slice(0, maxChars - 1) + '…' : str;
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        
        const type = searchParams.get('type');

        // ==========================================
        // 1. CONNECTED / MATCH ACCEPTED BANNER
        // ==========================================
        if (type === 'connected') {
            const userName = truncate(searchParams.get('userName') || searchParams.get('n1') || 'You', 16);
            const partnerName = truncate(searchParams.get('partnerName') || searchParams.get('n2') || 'Match', 16);
            const userPhoto = searchParams.get('userPhoto') || searchParams.get('p1') || null;
            const partnerPhoto = searchParams.get('partnerPhoto') || searchParams.get('p2') || null;

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
                            backgroundImage: 'linear-gradient(135deg, #0a0518 0%, #1e0c38 35%, #3b0d2d 70%, #0c071a 100%)',
                            color: 'white',
                            padding: '30px 40px',
                            fontFamily: 'sans-serif',
                            position: 'relative'
                        }}
                    >
                        {/* Top Mutual Connection Tag */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '8px 24px',
                                borderRadius: '100px',
                                backgroundColor: 'rgba(244, 63, 94, 0.2)',
                                border: '1.5px solid rgba(244, 63, 94, 0.6)',
                                color: '#fda4af',
                                fontSize: '15px',
                                fontWeight: 'bold',
                                marginBottom: '14px',
                                letterSpacing: '1px'
                            }}
                        >
                            ✨ MUTUAL CONNECTION ✨
                        </div>

                        {/* Bold Celebration Headline */}
                        <div
                            style={{
                                fontSize: '42px',
                                fontWeight: 900,
                                color: '#ffffff',
                                textAlign: 'center',
                                marginBottom: '24px',
                                letterSpacing: '-1px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            {userName} & {partnerName} are Connected!
                        </div>

                        {/* Avatars Row with Heart Connector */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                width: '640px',
                                marginBottom: '20px'
                            }}
                        >
                            {/* Connecting Line */}
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '75px',
                                    left: '100px',
                                    right: '100px',
                                    height: '6px',
                                    backgroundImage: 'linear-gradient(90deg, #f43f5e, #ec4899, #a855f7)',
                                    zIndex: 1
                                }}
                            />

                            {/* Left User Profile */}
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    marginRight: 'auto',
                                    zIndex: 2
                                }}
                            >
                                <div
                                    style={{
                                        width: '160px',
                                        height: '160px',
                                        borderRadius: '9999px',
                                        border: '5px solid #f43f5e',
                                        boxShadow: '0 0 25px rgba(244, 63, 94, 0.6)',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: '#1e1b4b'
                                    }}
                                >
                                    {userPhoto && !userPhoto.includes('.svg') && !userPhoto.includes('dicebear.com') ? (
                                        <img
                                            src={userPhoto}
                                            width="160"
                                            height="160"
                                            style={{
                                                objectFit: 'cover'
                                            }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundImage: 'linear-gradient(135deg, #f43f5e, #be123c)',
                                                color: '#ffffff',
                                                fontSize: '68px',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            {userName.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div
                                    style={{
                                        fontSize: '22px',
                                        fontWeight: 'bold',
                                        color: '#f8fafc',
                                        marginTop: '10px'
                                    }}
                                >
                                    {userName}
                                </div>
                            </div>

                            {/* Center Glowing Heart Badge */}
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '28px',
                                    left: '272px',
                                    width: '96px',
                                    height: '96px',
                                    borderRadius: '9999px',
                                    backgroundImage: 'linear-gradient(135deg, #e11d48, #9333ea)',
                                    border: '4px solid #ffffff',
                                    boxShadow: '0 0 30px rgba(225, 29, 72, 0.8)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 3
                                }}
                            >
                                <div style={{ fontSize: '36px', lineHeight: 1 }}>💖</div>
                                <div
                                    style={{
                                        fontSize: '9px',
                                        fontWeight: 'bold',
                                        color: '#ffffff',
                                        letterSpacing: '1px',
                                        marginTop: '4px'
                                    }}
                                >
                                    CONNECTED
                                </div>
                            </div>

                            {/* Right User Profile */}
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    marginLeft: 'auto',
                                    zIndex: 2
                                }}
                            >
                                <div
                                    style={{
                                        width: '160px',
                                        height: '160px',
                                        borderRadius: '9999px',
                                        border: '5px solid #a855f7',
                                        boxShadow: '0 0 25px rgba(168, 85, 247, 0.6)',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: '#1e1b4b'
                                    }}
                                >
                                    {partnerPhoto && !partnerPhoto.includes('.svg') && !partnerPhoto.includes('dicebear.com') ? (
                                        <img
                                            src={partnerPhoto}
                                            width="160"
                                            height="160"
                                            style={{
                                                objectFit: 'cover'
                                            }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundImage: 'linear-gradient(135deg, #a855f7, #7e22ce)',
                                                color: '#ffffff',
                                                fontSize: '68px',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            {partnerName.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div
                                    style={{
                                        fontSize: '22px',
                                        fontWeight: 'bold',
                                        color: '#f8fafc',
                                        marginTop: '10px'
                                    }}
                                >
                                    {partnerName}
                                </div>
                            </div>
                        </div>

                        {/* Subtitle CTA */}
                        <div
                            style={{
                                fontSize: '19px',
                                color: 'rgba(255, 255, 255, 0.85)',
                                textAlign: 'center',
                                marginBottom: '18px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            You can now chat, voice call & video call freely! Tap to say hello 👋
                        </div>

                        {/* Footer Branding */}
                        <div
                            style={{
                                position: 'absolute',
                                bottom: '24px',
                                left: '60px',
                                right: '60px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >
                            <div style={{ fontSize: '17px', fontWeight: 'bold', letterSpacing: '2px', color: '#a5b4fc' }}>
                                LIFEPARTNERAI.IN
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                    border: '1px solid rgba(16, 185, 129, 0.4)',
                                    padding: '6px 18px',
                                    borderRadius: '100px',
                                    color: '#34d399',
                                    fontSize: '14px',
                                    fontWeight: 'bold'
                                }}
                            >
                                🔒 100% Free & Verified Match
                            </div>
                        </div>
                    </div>
                ),
                {
                    width: 1200,
                    height: 600,
                }
            );
        }

        // ==========================================
        // 2. STANDARD / PROMOTIONAL OG IMAGE
        // ==========================================
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
