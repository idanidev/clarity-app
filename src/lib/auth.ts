import { betterAuth } from "better-auth";
import { emailOTP, openAPI } from "better-auth/plugins";

export const auth = betterAuth({
  database: {
    type: "firebase",
    firebaseConfig: {
      apiKey: "AIzaSyCFhaSfL2VGvSA0PtSCRISB7l_e9ig1kSI",
      authDomain: "clarity-gastos.firebaseapp.com",
      projectId: "clarity-gastos",
      storageBucket: "clarity-gastos.firebasestorage.app",
      messagingSenderId: "318846020421",
      appId: "1:318846020421:web:d55aadfbe492db8d29ec2c",
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.VITE_GOOGLE_CLIENT_ID,
      clientSecret: process.env.VITE_GOOGLE_CLIENT_SECRET,
      redirectURI: `${window.location.origin}/api/auth/callback/google`,
    },
  },
  plugins: [
    emailOTP({
      sendVerificationOTP: async ({ email, otp, type }) => {
        console.log(`Sending OTP ${otp} to ${email} for ${type}`);
        // Implement email sending logic here
      },
    }),
    openAPI(),
  ],
});

export type Session = typeof auth.$Infer.Session;
