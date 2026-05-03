import StaticPageLayout from '@/components/StaticPageLayout';
import { Shield, Eye, Lock, MapPin } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Dating Safety Tips | LifePartner AI',
    description: 'Prioritize your safety with our dating tips and verify your matches using our 100% human-verified system.',
    keywords: ['dating safety', 'safe matrimony', 'anti catfish dating']
};

export default function SafetyPage() {
    return (
        <StaticPageLayout>
            <div className="max-w-3xl mx-auto px-4 py-16">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Dating Safety Tips</h1>
                <p className="text-xl text-gray-600 mb-12">
                    Your safety is our top priority. Please read these guidelines to stay safe while interacting with others.
                </p>

                <div className="mb-16 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-900/10 rounded-3xl p-8 border border-rose-100 dark:border-rose-900">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-full text-sm font-bold mb-4">
                        <Shield size={16} />
                        Flagship Feature
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">The Women's Safety Kit 🛡️</h2>
                    <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
                        We are the only matchmaking platform that protects you *during* your offline dates. When you schedule a date through our app, we automatically activate an end-to-end safety protocol to ensure your peace of mind.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FeatureCard 
                            icon="💬"
                            title="1. Schedule a Safe Date"
                            desc="Tap the Calendar icon in your chat to propose a date. By logging it in the app, our backend servers securely track your meetup time and location."
                        />
                        <FeatureCard 
                            icon="🚨"
                            title="2. The Safety Overlay"
                            desc="During your date, a discreet red shield appears on your screen. Tap it to access emergency tools like 'Fake a Call' or 'WhatsApp SOS'."
                        />
                        <FeatureCard 
                            icon="📱"
                            title="3. Fake a Call"
                            desc="If your date is going poorly or you feel uncomfortable, press this button. In 10 seconds, your phone will ring loudly, giving you the perfect excuse to leave safely."
                        />
                        <FeatureCard 
                            icon="⏱️"
                            title="4. Angel Timer & Escalation"
                            desc="Exactly 45 minutes into your date, we send a notification asking 'Are you safe?'. If you don't respond, we instantly email your GPS location to your Emergency Contact."
                        />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">General Safety Tips</h2>
                <div className="space-y-6">
                    <SafetyItem
                        icon={<Lock />}
                        title="Keep Personal Info Private"
                        desc="Never share your financial details, Aadhar/SSN, or home address securely until you have established significant trust."
                    />
                    <SafetyItem
                        icon={<MapPin />}
                        title="Meet in Public Places"
                        desc="For your first few dates, always meet in a busy, public location like a coffee shop or mall. Arranging your own transportation is also recommended."
                    />
                    <SafetyItem
                        icon={<Eye />}
                        title="Watch for Red Flags"
                        desc="Be wary of anyone who asks for money, pushes for a serious relationship immediately, or refuses to video call."
                    />
                </div>

                <div className="mt-12 bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl border border-red-100 dark:border-red-900/50 text-red-800 dark:text-red-200">
                    <h4 className="font-bold mb-2 text-lg">Emergency Assistance</h4>
                    <p className="text-sm">
                        If you are in immediate danger, please contact your local emergency services (100 or 112 in India) immediately.
                    </p>
                </div>
            </div>
        </StaticPageLayout>
    );
}

function FeatureCard({ icon, title, desc }: any) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="text-3xl mb-3">{icon}</div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{desc}</p>
        </div>
    );
}

function SafetyItem({ icon, title, desc }: any) {
    return (
        <div className="flex gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                {icon}
            </div>
            <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600 leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}
