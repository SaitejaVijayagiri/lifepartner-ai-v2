import axios from 'axios';

async function run() {
    try {
        const email = `test_onboard_${Date.now()}@example.com`;
        const password = 'Password123!';

        console.log(`Registering ${email}...`);
        try {
            const regRes = await axios.post('http://localhost:4000/auth/register', {
                email,
                password,
                fullName: 'Test Onboard User'
            });
            console.log("Register Response:", regRes.data);

            const token = regRes.data.token || regRes.data.session?.access_token;
            if (!token) throw new Error("No token returned");

            console.log("Registered! Token:", token.substring(0, 15) + "...");

            const payload = {
                name: "Test User",
                age: 28,
                gender: "Male",
                height: "5'10\"",
                location: {
                    city: "Mumbai",
                    district: "Mumbai Suburban",
                    state: "Maharashtra",
                    country: "India",
                    lat: "19.0760",
                    lng: "72.8777"
                },
                religion: { religion: "Hindu", caste: "Brahmin", interCasteOpen: true, gothra: "Bharadwaja" },
                horoscope: { zodiacSign: "Aries", nakshatra: "Ashwini", manglik: "No", birthTime: "12:00 PM" },
                career: { profession: "Engineer", company: "Tech Corp", education: "Bachelor's", college: "IIT", degree: "B.Tech", income: "10-15 LPA" },
                family: { type: "Nuclear", values: "Modern", fatherOccupation: "Business", nativePlace: "Delhi" },
                lifestyle: { diet: "Vegetarian", smoke: "No", drink: "No" },
                prompt: "I am looking for a partner.",
                partnerPreferences: { ageRange: "25-30", heightRange: "5'2\" - 5'8\"", income: "Any", location: "Mumbai" },
                motherTongue: "Hindi",
                maritalStatus: "Single",
                photos: ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="],
                photoUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
            };

            console.log("Submitting Onboarding Payload...");
            const putRes = await axios.put('http://localhost:4000/profile/me', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("Update Success:", putRes.data);

        } catch (e: any) {
            console.log("Sub-request error:", e.response?.data || e.message);
        }

    } catch (err: any) {
        if (err.response) {
            console.error("API Error Response:", err.response.data);
        } else {
            console.error("Error:", err.message);
        }
    }
}

run();
