import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Privacy Policy | LifePartner AI',
    description: 'Read the privacy policy for LifePartner AI. We respect your privacy and protect your personal data in full compliance with the Digital Personal Data Protection (DPDP) Act, 2023.',
    keywords: ['privacy policy', 'data protection', 'lifepartner privacy', 'dpdp act 2023', 'data security', 'gdpr compliance'],
    alternates: {
        canonical: 'https://lifepartnerai.in/privacy',
    }
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-950 p-6 md:p-16 max-w-4xl mx-auto text-gray-800 dark:text-gray-200 font-sans">
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-gray-100 dark:border-gray-800 gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">Privacy Policy</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            Effective Date: October 26, 2026 | Compliant with Digital Personal Data Protection (DPDP) Act, 2023 &amp; IT Act, 2000
                        </p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300 w-fit">
                        <span>🔒</span> DPDP Act 2023 Certified
                    </div>
                </div>

                <div className="space-y-8 leading-relaxed text-sm md:text-base">

                    {/* Section 1 */}
                    <section>
                        <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">1. Introduction &amp; Commitment to Privacy</h2>
                        <p>
                            At <strong>LifePartner AI</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), your privacy and trust are paramount. We design our matchmaking platform and mobile applications with strict data privacy principles matching multinational corporate standards. This Privacy Policy details how LifePartner AI, as a Data Fiduciary, collects, uses, processes, stores, and safeguards your personal data under the <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong> and the <strong>Information Technology Act, 2000</strong>.
                        </p>
                    </section>

                    {/* Section 2 */}
                    <section>
                        <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">2. Information We Collect</h2>
                        <p>We collect only the information necessary to provide matchmaking, safe communication, and identity verification services:</p>
                        <div className="space-y-3 mt-3">
                            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/70 dark:border-gray-700/60">
                                <h3 className="font-bold text-sm text-gray-900 dark:text-white">A. Information You Provide Directly</h3>
                                <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1.5">
                                    <li><strong>Registration Details:</strong> Full name, verified email address, phone number (for secure OTP verification), date of birth, and gender.</li>
                                    <li><strong>Matrimonial Profile Data:</strong> Education, profession, lifestyle habits, religious/cultural preferences, horoscope details, and partner expectations.</li>
                                    <li><strong>Media Assets:</strong> Photographs, avatar images, and stories you voluntarily upload to your profile.</li>
                                    <li><strong>Direct Communications:</strong> Private text messages and shared media exchanged between mutual matches.</li>
                                </ul>
                            </div>

                            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/70 dark:border-gray-700/60">
                                <h3 className="font-bold text-sm text-gray-900 dark:text-white">B. Automatically Collected Information</h3>
                                <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1.5">
                                    <li><strong>Device &amp; Technical Identifiers:</strong> Operating system, app version, IP address, device model, and secure session identifiers for authentication and fraud prevention.</li>
                                    <li><strong>Platform Usage Data:</strong> Login timestamps, match swipes, and feature usage patterns to improve recommendation accuracy.</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Section 3 */}
                    <section>
                        <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">3. How We Use Your Personal Data</h2>
                        <p>We process your personal information strictly for legitimate, lawful purposes based on your explicit consent:</p>
                        <ul className="list-disc pl-5 space-y-1.5 mt-2 text-gray-700 dark:text-gray-300">
                            <li>To deliver AI-powered matchmaking recommendations based on compatibility traits and preferences.</li>
                            <li>To facilitate real-time messaging, match notifications, and direct connection requests.</li>
                            <li>To safeguard our platform against impersonation, automated bots, harassment, and prohibited content using automated safety filters.</li>
                            <li>To process authorized in-app purchases and coin wallet transactions.</li>
                            <li>To comply with statutory legal obligations and respond to valid law enforcement inquiries.</li>
                        </ul>
                    </section>

                    {/* Section 4 */}
                    <section>
                        <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">4. Zero Sale of Personal Data &amp; Sharing Principles</h2>
                        <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl p-4 text-emerald-900 dark:text-emerald-200 font-medium text-xs sm:text-sm">
                            🛡️ <strong>Absolute Commitment:</strong> LifePartner AI does <strong>NOT sell, rent, monetize, or trade</strong> your personal information, contact numbers, photos, or private conversations to third-party advertisers, data aggregators, or marketing brokers.
                        </div>
                        <p className="mt-3 text-gray-700 dark:text-gray-300">
                            We disclose personal data strictly in the following limited circumstances:
                        </p>
                        <ul className="list-disc pl-5 space-y-1.5 mt-2 text-gray-700 dark:text-gray-300">
                            <li><strong>To Other Members:</strong> Information you choose to display on your public matrimonial profile is visible to other registered users of the Platform.</li>
                            <li><strong>To Trusted Service Processors:</strong> We partner with enterprise cloud storage, payment gateway, and SMS verification infrastructure providers who operate under strict non-disclosure and data protection contracts.</li>
                            <li><strong>For Legal &amp; Safety Compliance:</strong> We may disclose information if required to do so by a lawful court order, summons, or legal process issued by competent law enforcement agencies to investigate cyber fraud, harassment, or imminent harm.</li>
                        </ul>
                    </section>

                    {/* Section 5 */}
                    <section>
                        <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">5. Privacy of Calls &amp; Private Messages</h2>
                        <p>
                            Like leading global communication platforms, we uphold strict technical and operational confidentiality over member conversations:
                        </p>
                        <div className="space-y-3 mt-3">
                            <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-700/80">
                                <h3 className="font-bold text-sm text-gray-900 dark:text-white">A. Audio &amp; Video Calls (Never Recorded)</h3>
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
                                    All 1-on-1 voice and video calls travel directly in real-time between user devices. LifePartner AI does <strong>NOT record, monitor, listen to, or store</strong> your video or audio call streams. Once a call finishes, no video or voice recording exists on our servers.
                                </p>
                            </div>
                            <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-700/80">
                                <h3 className="font-bold text-sm text-gray-900 dark:text-white">B. Direct Text Chats &amp; Media Attachments</h3>
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
                                    Text messages and shared photos are transmitted securely and stored in encrypted cloud storage solely to synchronize message history across your devices. Conversations are private between matched users. LifePartner AI employees do not read private communications unless reported by a participant for harassment, abuse, or safety violations.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 6 */}
                    <section>
                        <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">6. Data Security &amp; Protection Standards</h2>
                        <p>
                            We apply enterprise-grade administrative, technical, and physical safeguards to protect your personal data from unauthorized access, loss, or misuse:
                        </p>
                        <ul className="list-disc pl-5 space-y-1.5 mt-2 text-gray-700 dark:text-gray-300">
                            <li><strong>Cloud Security:</strong> All user media, profile photos, and data records are stored in secure enterprise cloud infrastructure with strict access controls and encrypted channels.</li>
                            <li><strong>Cryptographic Password Protection:</strong> Passwords are cryptographically hashed and cannot be viewed in plain text by any platform administrator.</li>
                            <li><strong>Automated Safety Screening:</strong> In-memory automated safety filters examine uploaded media in real-time to prevent sexually explicit or prohibited images from entering the community.</li>
                        </ul>
                    </section>

                    {/* Section 7 */}
                    <section id="deletion">
                        <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">7. Data Retention &amp; Right to Erasure (Account Deletion)</h2>
                        <p>
                            We retain your personal data only as long as you maintain an active account on LifePartner AI. Under the <strong>DPDP Act 2023</strong>, you have an unqualified <strong>Right to Erasure</strong>:
                        </p>
                        <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-xl border border-gray-200 dark:border-gray-700 mt-3 space-y-2 text-sm">
                            <p className="font-semibold text-gray-900 dark:text-white">How to Permanently Delete Your Data:</p>
                            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                <li><strong>Direct In-App Deletion:</strong> Navigate to <em>Profile Settings &gt; Account Security &gt; Delete Account</em> and confirm with your security prompt.</li>
                                <li><strong>Email Request:</strong> Send an email from your registered address to <a href="mailto:lifepartnerai.in@gmail.com" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">lifepartnerai.in@gmail.com</a> with the subject <em>&ldquo;Account Deletion Request&rdquo;</em>.</li>
                                <li><strong>Deletion Scope:</strong> Upon confirmation, your profile, photos, direct messages, and personal attributes are permanently purged from active systems within 30 days, except for minimal compliance logs retained strictly where mandated by statutory law.</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 8 */}
                    <section>
                        <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">8. Your Rights Under the DPDP Act, 2023</h2>
                        <p>As a data principal, you hold explicit legal rights regarding your personal information:</p>
                        <ul className="list-disc pl-5 space-y-1 mt-2 text-gray-700 dark:text-gray-300">
                            <li><strong>Right to Access:</strong> You can request a summary of the personal data being processed by us.</li>
                            <li><strong>Right to Correction &amp; Updation:</strong> You can edit or correct misleading or outdated profile information anytime via your profile editor.</li>
                            <li><strong>Right to Withdraw Consent:</strong> You may withdraw your consent for data processing at any time by deleting your account.</li>
                            <li><strong>Right to Grievance Redressal:</strong> You have the right to register complaints regarding data privacy directly with our Data Protection Officer.</li>
                            <li><strong>Right to Nominate:</strong> You may designate another individual to exercise your privacy rights in the event of death or incapacity.</li>
                        </ul>
                    </section>

                    {/* Section 9 */}
                    <section>
                        <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">9. Protection of Minors</h2>
                        <p>
                            LifePartner AI is strictly prohibited for individuals under 18 years of age. We do not knowingly solicit or collect personal data from anyone under the age of 18. If we discover that a user under 18 has registered an account, that profile and all associated data will be immediately removed.
                        </p>
                    </section>

                    {/* Section 10 */}
                    <section>
                        <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">10. Grievance Officer &amp; Data Protection Desk</h2>
                        <p>
                            In accordance with the Digital Personal Data Protection Act, 2023 and the Information Technology Act, 2000, our designated Data Protection &amp; Grievance Redressal Officer can be reached at:
                        </p>
                        <div className="bg-gray-50 dark:bg-gray-800/60 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 mt-3 space-y-2 text-sm">
                            <p><strong>Designation:</strong> Data Protection &amp; Grievance Officer</p>
                            <p><strong>Entity:</strong> LifePartner AI</p>
                            <p><strong>Email:</strong> <a href="mailto:lifepartnerai.in@gmail.com" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">lifepartnerai.in@gmail.com</a></p>
                            <p><strong>Location:</strong> Hyderabad, Telangana, India</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 pt-1">
                                All privacy inquiries and grievances will be acknowledged within 24 hours and addressed in accordance with statutory guidelines.
                            </p>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}
