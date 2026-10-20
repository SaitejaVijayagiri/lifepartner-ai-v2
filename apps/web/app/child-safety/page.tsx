import StaticPageLayout from '@/components/StaticPageLayout';
import { ShieldCheck, AlertTriangle, Flag, PhoneCall, Mail, Scale } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Child Safety Standards & CSAE Prevention Policy | LifePartner AI',
    description: 'LifePartner AI maintains strict zero-tolerance policies against child sexual abuse and exploitation (CSAE/CSAM), with proactive reporting, in-app safety tools, and law enforcement cooperation.',
    alternates: {
        canonical: 'https://lifepartnerai.in/child-safety',
    }
};

export default function ChildSafetyPage() {
    return (
        <StaticPageLayout>
            <div className="max-w-4xl mx-auto px-4 py-16">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                    <ShieldCheck size={16} />
                    Child Safety & CSAE Prevention Standards
                </div>

                <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-6">
                    Child Safety Standards & Protection Policy
                </h1>
                
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                    LifePartner AI maintains an absolute, non-negotiable <strong>Zero-Tolerance Policy</strong> against 
                    Child Sexual Abuse Material (CSAM), Child Sexual Exploitation and Abuse (CSAE), grooming, and any form of harm or exploitation involving minors. 
                    We are fully committed to creating a secure, legal, and wholesome matchmaking environment for verified adults.
                </p>

                <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 mb-12">
                    <div className="flex items-start gap-4">
                        <AlertTriangle className="text-rose-600 shrink-0 mt-1" size={24} />
                        <div>
                            <h3 className="font-bold text-rose-900 dark:text-rose-200 text-lg">Strict Age Restriction: 18+ Only</h3>
                            <p className="text-sm text-rose-800 dark:text-rose-300 mt-1 leading-relaxed">
                                LifePartner AI is exclusively designed and operated for adults aged 18 years and older seeking serious matchmaking and relationships. 
                                Minors (anyone under the age of 18) are strictly prohibited from creating accounts, browsing profiles, or utilizing any feature of this platform. 
                                Any account identified as belonging to or operated on behalf of a minor is immediately terminated.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-10 text-gray-800 dark:text-gray-200">
                    <section className="space-y-3">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Scale className="text-indigo-600" size={22} />
                            1. Prohibition of Child Sexual Exploitation and Abuse (CSAE)
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                            We strictly forbid the transmission, generation, storage, sharing, or solicitation of any material that depicts, promotes, or facilitates child sexual exploitation or abuse. This includes:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-sm sm:text-base text-gray-600 dark:text-gray-300">
                            <li>Visual media depicting child sexual abuse or exploitation (CSAM), whether photographic, video, or synthetic/AI-generated.</li>
                            <li>Grooming behaviors, predatory messages, child sexual solicitation, or inappropriate discussions involving minors.</li>
                            <li>Links, URLs, or external references directing users to child sexual abuse material or illicit communities.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Flag className="text-indigo-600" size={22} />
                            2. In-App Reporting & Rapid Escalation
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                            LifePartner AI provides accessible, built-in reporting mechanisms on every member profile, chat conversation, and media item:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                                <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">In-App Report Button</h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    Tap the <strong>"Report Profile"</strong> or <strong>"Report Message"</strong> button located inside every profile modal and chat window. Select "Child Safety Concern" or "Underage User" for immediate priority routing.
                                </p>
                            </div>
                            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                                <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">Direct Safety Hotline</h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    Email our dedicated trust and safety team directly at <a href="mailto:saitejavijayagiri@gmail.com" className="text-indigo-600 font-bold underline">saitejavijayagiri@gmail.com</a> with subject <em>"Urgent: Child Safety Concern"</em> for immediate human review.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <PhoneCall className="text-indigo-600" size={22} />
                            3. Law Enforcement Cooperation & Mandatory Reporting
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                            LifePartner AI actively cooperates with law enforcement and regulatory agencies globally. In accordance with applicable laws (including the Protection of Children from Sexual Offences [POCSO] Act and international reporting directives):
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-sm sm:text-base text-gray-600 dark:text-gray-300">
                            <li>All confirmed incidents or material involving CSAM are immediately reported to the <strong>National Center for Missing & Exploited Children (NCMEC)</strong> and regional cybercrime units (including India's National Cyber Crime Reporting Portal at <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">cybercrime.gov.in</a>).</li>
                            <li>We preserve forensic metadata, IP logs, and communication artifacts in secure accordance with legal requirements to aid criminal investigations and prosecutions.</li>
                            <li>Offending accounts are permanently banned and device-blacklisted across our platform.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Mail className="text-indigo-600" size={22} />
                            4. Designated Child Safety Point of Contact
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                            In compliance with Google Play's Child Safety Standards policy, the designated point of contact responsible for our CSAM prevention practices, compliance, and law enforcement coordination is:
                        </p>
                        <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-sm space-y-1.5">
                            <p className="font-bold text-indigo-950 dark:text-indigo-200">Designated Child Safety Compliance Lead</p>
                            <p className="text-gray-700 dark:text-gray-300"><strong>Name:</strong> Saiteja Vijayagiri</p>
                            <p className="text-gray-700 dark:text-gray-300"><strong>Contact Email:</strong> <a href="mailto:saitejavijayagiri@gmail.com" className="text-indigo-600 font-bold underline">saitejavijayagiri@gmail.com</a></p>
                            <p className="text-gray-700 dark:text-gray-300"><strong>Organization:</strong> LifePartner AI</p>
                            <p className="text-gray-700 dark:text-gray-300"><strong>Support Portal:</strong> <a href="https://www.lifepartnerai.in/contact" className="text-indigo-600 underline">https://www.lifepartnerai.in/contact</a></p>
                        </div>
                    </section>
                </div>
            </div>
        </StaticPageLayout>
    );
}
