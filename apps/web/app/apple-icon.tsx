import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const size = {
    width: 180,
    height: 180,
};
export const contentType = 'image/png';

// Image generation
export default function AppleIcon() {
    return new ImageResponse(
        (
            <div
                style={{
                    fontSize: 120,
                    background: 'linear-gradient(to bottom right, #4F46E5, #312E81)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    borderRadius: '36px', // Apple style rounded corners
                }}
            >
                <svg
                    width="120"
                    height="120"
                    viewBox="0 0 512 512"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M256 120C190 120 150 160 150 210C150 260 200 300 256 350C312 300 362 260 362 210C362 160 322 120 256 120ZM256 380C190 320 130 270 130 210C130 145 180 100 256 100C332 100 382 145 382 210C382 270 322 320 256 380Z"
                        fill="url(#goldGradient)"
                    />
                    <defs>
                        <linearGradient id="goldGradient" x1="100" y1="100" x2="400" y2="400" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#FCD34D" />
                            <stop offset="1" stopColor="#D97706" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>
        ),
        {
            ...size,
        }
    );
}
