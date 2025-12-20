
export default function RefundPolicyPage() {
    return (
        <div className="min-h-screen bg-white p-8 md:p-16 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Cancellation and Refund Policy</h1>
            <p className="text-gray-500 text-sm mb-8">Last Updated: Dec 20, 2025</p>

            <div className="prose prose-indigo max-w-none text-gray-700 space-y-6">
                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">1. Coin Purchases</h2>
                    <p>
                        "LifePartner Coins" are a digital currency used within the LifePartner AI application to unlock premium features.
                        All purchases of Coins are final and non-refundable. Once Coins are added to your wallet, they cannot be exchanged for cash or refunded.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">2. Premium Subscriptions</h2>
                    <p>
                        If you purchase a Premium Subscription (e.g., Gold Membership), the benefits are active immediately.
                        We do not offer refunds for partial subscription periods. You may cancel renewal at any time, but no refund will be issued for the current active period.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">3. Technical Errors</h2>
                    <p>
                        If a transaction fails but you are charged, the amount is usually refunded automatically by your bank within 5-7 business days.
                        If the amount is deducted and Coins are not credited within 24 hours, please contact us at <a href="mailto:lifepartnerai.support@gmail.com" className="text-indigo-600 hover:underline">lifepartnerai.support@gmail.com</a> with your Transaction ID, and we will manually process the refund or credit.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">4. Chargebacks</h2>
                    <p>
                        Unauthorized chargebacks will result in the immediate permanent suspension of your account.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">5. Contact Us</h2>
                    <p>
                        For any billing related queries, please contact our support team at <a href="mailto:lifepartnerai.support@gmail.com" className="text-indigo-600 hover:underline">lifepartnerai.support@gmail.com</a>.
                    </p>
                </section>
            </div>
        </div>
    );
}
