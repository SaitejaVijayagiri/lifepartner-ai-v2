import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Account & Data Deletion Request | LifePartner AI',
    description: 'Request the permanent deletion of your LifePartner AI account and all associated personal data in compliance with Google Play Developer Policy and the DPDP Act 2023.',
    keywords: ['delete account', 'data deletion', 'delete lifepartner account', 'privacy rights', 'dpdp act 2023', 'google play compliance'],
    alternates: {
        canonical: 'https://lifepartnerai.in/delete-account',
    }
};

export default function DeleteAccountPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-950 p-6 md:p-16 max-w-4xl mx-auto text-gray-800 dark:text-gray-200 font-sans">
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-gray-100 dark:border-gray-800 gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">Account &amp; Data Deletion</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            Google Play Policy &amp; DPDP Act 2023 Compliant Deletion Request
                        </p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300 w-fit">
                        <span>🛡️</span> Right to Erasure
                    </div>
                </div>

                <div className="space-y-6 leading-relaxed text-sm md:text-base">
                    <section>
                        <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">Our Commitment to Your Privacy</h2>
                        <p>
                            At <strong>LifePartner AI</strong>, you own your personal information. Under Google Play Developer Policies and the Digital Personal Data Protection (DPDP) Act 2023, you have the absolute right to request the complete deletion of your account and all associated data at any time.
                        </p>
                    </section>

                    <section className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-base text-gray-900 dark:text-white mb-3">Option 1: Instant In-App Deletion (Fastest)</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            If you have access to your account, you can permanently delete it immediately inside the mobile app or website:
                        </p>
                        <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-700 dark:text-gray-200">
                            <li>Open the <strong>LifePartner AI</strong> app or log in at <Link href="/login" className="text-indigo-600 dark:text-indigo-400 font-semibold underline">lifepartnerai.in</Link>.</li>
                            <li>Go to <strong>Profile / Settings</strong> (tap your avatar).</li>
                            <li>Scroll to the <strong>Account Security</strong> section at the bottom.</li>
                            <li>Click <strong>Permanently Delete Account</strong> and type &ldquo;DELETE&rdquo; to confirm.</li>
                        </ol>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            ✓ Your profile, photos, matches, chat history, and tokens are instantly purged from live systems.
                        </p>
                    </section>

                    <section className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-base text-gray-900 dark:text-white mb-3">Option 2: Web Deletion Request (Without Logging In)</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                            If you have uninstalled the app or cannot access your account, you can submit a deletion request directly by sending an email:
                        </p>
                        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2 text-sm">
                            <p><strong>To:</strong> <a href="mailto:lifepartnerai.in@gmail.com" className="text-indigo-600 dark:text-indigo-400 font-semibold underline">lifepartnerai.in@gmail.com</a></p>
                            <p><strong>Subject:</strong> <code>Account Deletion Request - [Your Registered Email]</code></p>
                            <p><strong>Body:</strong> Please include your registered phone number or email address with the message: <em>&ldquo;Please permanently delete my LifePartner AI account and all associated data.&rdquo;</em></p>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            ✓ Requests are verified and processed within <strong>24 to 48 hours</strong>.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">What Data is Deleted?</h2>
                        <ul className="list-disc pl-5 space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
                            <li><strong>Profile &amp; Identity:</strong> Name, age, gender, phone number, email address, bio, horoscope/kundli data.</li>
                            <li><strong>Media:</strong> Uploaded profile pictures, avatars, story images/videos.</li>
                            <li><strong>Social &amp; Matching:</strong> Likes, favorites, waves, match connections, and private messages.</li>
                            <li><strong>Device &amp; Tokens:</strong> Push notification tokens (FCM/OneSignal) and login sessions.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">Data Retention Policy</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Personal data is immediately revoked from active access upon confirmation. Encrypted database backups and financial audit logs strictly mandated by Indian taxation laws (e.g. GST receipts for paid transactions) are permanently purged within 30 days of deletion request.
                        </p>
                    </section>

                    <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <Link href="/" className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                            ← Return to LifePartner AI Home
                        </Link>
                        <Link href="/privacy" className="text-sm text-gray-500 hover:underline">
                            Read Privacy Policy
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
