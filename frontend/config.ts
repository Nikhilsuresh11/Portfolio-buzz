// Basic configuration for the frontend app
const API_BASE_URL = "https://portfolio-buzz.onrender.com"; //"http://127.0.0.1:5000"; //
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export const config = {
    API_BASE_URL,
    GOOGLE_CLIENT_ID,
};
