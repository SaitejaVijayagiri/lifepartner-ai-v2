import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Refund & Cancellation Policy | LifePartner AI',
    description: 'Read the cancellation, refund, and instant digital fulfillment policy for LifePartner AI premium features and coin purchases.',
    keywords: ['refund policy', 'cancellation policy', 'lifepartner ai billing', 'cashfree refunds'],
    alternates: {
        canonical: 'https://lifepartnerai.in/refund-policy',
    }
};

export default function RefundPolicyPage() {
    return (
        <div className="min-h-screen bg-white p-8 md:p-16 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-gray-900">Cancellation and Refund Policy</h1>
            <p className="text-gray-500 text-sm mb-8">Last Updated: March 2026 | Electronic Policy in Compliance with Payment Aggregator Guidelines</p>

            <div className="prose prose-indigo max-w-none text-gray-700 space-y-6">
                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">1. Nature of Services & Digital Fulfillment</h2>
                    <p>
                        LifePartner AI provides digital matchmaking, AI-powered compatibility analysis, and secure communication tools.
                        Upon successful payment through our authorized payment gateway partner (Cashfree Payments), all digital items (such as LifePartner Coins) and Premium Subscriptions (such as Gold/VIP Membership) are <strong>credited and activated immediately (instant digital fulfillment)</strong> to your registered account wallet.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">2. Coin Purchases & Consumables</h2>
                    <p>
                        "LifePartner Coins" are a digital virtual currency used exclusively within the LifePartner AI platform to unlock matchmaking features, audio/video calls, and direct interactions.
                        All purchases of Coins are final and non-refundable once credited. Coins hold no fiat cash value, cannot be redeemed for legal currency, and cannot be transferred between accounts.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">3. Premium Subscriptions & Cancellations</h2>
                    <p>
                        When you subscribe to a Premium Membership plan, all subscription benefits are activated immediately.
                        You may cancel recurring subscriptions at any time via your account settings. Upon cancellation, your membership remains active until the end of the current paid billing cycle, and no further automatic charges will occur. We do not provide prorated or partial refunds for active subscription durations already elapsed.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">4. Payment Failures & Technical Error Refunds</h2>
                    <p>
                        In rare cases where your bank account or payment method is debited but the digital Coins or subscription are not credited to your account due to network or gateway technical issues:
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 mt-2">
                        <li><strong>Auto-Reversal:</strong> Most failed transactions are automatically reconciled by your issuing bank and Cashfree Payments within <strong>5 to 7 business days</strong>.</li>
                        <li><strong>Manual Review:</strong> If your funds are debited and not credited after 24 hours, contact our billing desk at <a href="mailto:lifepartnerai.in@gmail.com" className="text-indigo-600 font-semibold hover:underline">lifepartnerai.in@gmail.com</a> with your Payment Reference / Transaction ID and payment screenshot.</li>
                        <li><strong>Refund Processing:</strong> Validated refund requests will be initiated through our payment gateway (Cashfree) to the <strong>original payment method</strong> (UPI, debit/credit card, or net banking) within <strong>48 hours</strong>, and typically reflect in your source account within <strong>5 to 7 business days</strong> depending on your bank.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">5. Chargebacks & Fraudulent Disputes</h2>
                    <p>
                        In accordance with payment aggregator and banking regulations, initiating unwarranted chargebacks without contacting support will result in temporary or permanent suspension of your account. In the case of disputed transactions, we provide verified system transaction logs, IP addresses, and digital delivery confirmations to the acquiring bank and payment gateway partner.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">6. Customer Support & Grievance Contact</h2>
                    <p>
                        For any billing inquiries, payment confirmation delays, or refund queries, please contact our dedicated billing and customer support team:
                    </p>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm mt-2 space-y-1">
                        <p><strong>Support Email:</strong> <a href="mailto:lifepartnerai.in@gmail.com" className="text-indigo-600 font-semibold hover:underline">lifepartnerai.in@gmail.com</a></p>
                        <p><strong>Response Time:</strong> Within 24-48 business hours</p>
                        <p><strong>Operating Location:</strong> Hyderabad, Telangana, India</p>
                    </div>
                </section>
            </div>
        </div>
    );
}
