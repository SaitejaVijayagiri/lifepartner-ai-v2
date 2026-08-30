
import { Metadata, ResolvingMetadata } from 'next';
import ProfileClient from '@/components/ProfileClient';
import Script from 'next/script';

// Define the API URL for server-side fetching
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Props = {
    params: { id: string }
};

// Fetch profile data on server
async function getProfile(id: string) {
    try {
        const res = await fetch(`${API_URL}/profile/${id}`, {
            next: { revalidate: 60 }, // Cache for 60 seconds (ISR style)
            headers: {
                // Ensure we ask for JSON
                'Content-Type': 'application/json',
                // For public profiles, we assume the API returns limited data without token
                // If the API strictly requires token (401), this will fail. 
                // In that case, we return null and let Client ensure "Not Found" or "Login" UI.
            }
        });

        if (!res.ok) {
            // If 401/403, we can't show SEO data, return null
            if (res.status === 401 || res.status === 403) return null;
            return null;
        }

        return res.json();
    } catch (error) {
        console.error("Failed to fetch profile server-side:", error);
        return null;
    }
}

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const profile = await getProfile(params.id);

    // Default metadata if profile is not found or private
    if (!profile) {
        return {
            title: 'Profile Not Found | LifePartner AI',
            description: 'The requested profile could not be found or is private.',
        };
    }

    const name = profile.name || 'Member';
    const age = profile.age ? `${profile.age} yrs` : '';
    const profession = profile.role || profile.career?.profession || profile.profession || 'Verified Member';
    const location = profile.location?.city || profile.location?.district || profile.city || 'India';
    const photos = profile.photos || [];
    const bio = profile.bio || profile.aboutMe || `Connect with ${name} on LifePartner AI.`;
    const summaryHeader = [name, age, profession, location].filter(Boolean).join(' • ');

    return {
        title: `${name} - ${profession} in ${location} | LifePartner AI`,
        description: bio.substring(0, 160),
        openGraph: {
            title: `${summaryHeader} | LifePartner AI`,
            description: `${bio.substring(0, 140)}... Connect with ${name} on LifePartner AI.`,
            images: photos.length > 0 ? [photos[0]] : ['https://lifepartnerai.in/og-image.jpg'],
            type: 'profile',
        },
        twitter: {
            card: 'summary_large_image',
            title: `${summaryHeader} is on LifePartner AI`,
            description: `Connect with ${name} from ${location}.`,
            images: photos.length > 0 ? [photos[0]] : ['https://lifepartnerai.in/og-image.jpg'],
        },
    };
}

export default async function ProfilePage({ params }: Props) {
    const profile = await getProfile(params.id);

    // Structured Data (JSON-LD) for Person
    const jsonLd = profile ? {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: profile.name,
        jobTitle: profile.role || profile.profession,
        address: {
            '@type': 'PostalAddress',
            addressLocality: profile.location?.city,
            addressCountry: 'IN'
        },
        image: profile.photos?.[0],
        description: profile.bio || profile.aboutMe,
        url: `https://lifepartnerai.in/profile/${profile.id}`
    } : null;

    return (
        <>
            {profile && (
                <Script
                    id="profile-json-ld"
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            <ProfileClient initialProfile={profile} profileId={params.id} />
        </>
    );
}
