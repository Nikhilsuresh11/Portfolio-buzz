import streamlit as st
from pymongo import MongoClient
import hashlib
import os
import re
from dotenv import load_dotenv
import time

load_dotenv()

# MongoDB Setup
MONGO_URI = st.secrets.get("MONGODB_URI", os.getenv("MONGODB_URI"))
DB_NAME = "portfolio_buzz"
COLLECTION_NAME = "users"

def get_db():
    try:
        client = MongoClient(MONGO_URI)
        return client[DB_NAME]
    except:
        st.error("Database connection failed")
        return None

def hash_password(pwd):
    return hashlib.sha256(pwd.encode()).hexdigest()

def authenticate_user(email, password):
    db = get_db()
    if db is None: 
        return False, "DB Error"
    user = db[COLLECTION_NAME].find_one({"email": email.lower()})
    if user and user["password"] == hash_password(password):
        return True, "Success"
    return False, "Invalid credentials"

def create_user(email, password):
    db = get_db()
    if db is None: 
        return False, "DB Error"
    if db[COLLECTION_NAME].find_one({"email": email.lower()}):
        return False, "Email already registered"
    try:
        db[COLLECTION_NAME].insert_one({
            "email": email.lower(),
            "password": hash_password(password),
            "created_at": time.time()
        })
        return True, "Account created!"
    except:
        return False, "Error creating account"

# Page Config
st.set_page_config(page_title="Portfolio Buzz - Login", page_icon="💸", layout="centered")

# === PREMIUM FULL-SCREEN STYLING ===
st.markdown("""
<style>
    /* Full viewport centered container */
    .block-container {
        padding-top: 2rem;
        padding-bottom: 2rem;
        max-width: 600px !important;
    }

    /* Animated Gradient Background */
    body {
        background: linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #23d5ab, #23a6d5);
        background-size: 400% 400%;
        animation: gradient 18s ease infinite;
        height: 100vh;
    }
    @keyframes gradient {
        0% {background-position: 0% 50%;}
        50% {background-position: 100% 50%;}
        100% {background-position: 0% 50%;}
    }

    /* Glassmorphism Card */
    .login-card {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.3);
    }

    /* Custom Tab Bar */
    [data-baseweb="tab-list"] {
        background: linear-gradient(90deg, #667eea, #764ba2) !important;
        border-radius: 20px 20px 0 0 !important;
        padding: 0 !important;
        height: 70px !important;
    }
    [data-baseweb="tab"] {
        color: white !important;
        font-weight: 600 !important;
        font-size: 18px !important;
        text-transform: uppercase;
        letter-spacing: 1px;
        flex: 1 !important;
        border-radius: 0 !important;
    }
    [data-baseweb="tab"][aria-selected="true"] {
        background: rgba(255,255,255,0.2) !important;
        text-shadow: 0 0 10px rgba(255,255,255,0.8);
    }

    /* Form Styling */
    .stTextInput > div > div > input {
        border: 2px solid #e0e0e0;
        border-radius: 12px;
        padding: 14px 18px;
        font-size: 16px;
        background: #f8f9fa;
    }
    .stTextInput > div > div > input:focus {
        border-color: #667eea !important;
        box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.15);
    }

    /* Buttons */
    .stButton > button {
        width: 100%;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        font-weight: 600;
        font-size: 17px;
        padding: 16px;
        border: none;
        border-radius: 12px;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
        transition: all 0.3s ease;
    }
    .stButton > button:hover {
        transform: translateY(-4px);
        box-shadow: 0 15px 40px rgba(102, 126, 234, 0.6);
    }

    /* Title */
    h1 {
        font-size: 38px !important;
        font-weight: 700 !important;
        background: linear-gradient(135deg, #667eea, #764ba2);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-align: center;
        margin-bottom: 8px !important;
    }
    .subtitle {
        text-align: center;
        color: #555;
        font-size: 16px;
        margin-bottom: 30px;
    }

    /* Hide Streamlit junk */
    #MainMenu, footer, header {visibility: hidden;}
    [data-testid="stSidebar"] {display: none;}
</style>
""", unsafe_allow_html=True)

# Session State
if "authenticated" not in st.session_state:
    st.session_state.authenticated = False
if "username" not in st.session_state:
    st.session_state.username = None

# Redirect if logged in
if st.session_state.authenticated:
    st.switch_page("pages/home.py")

# === MAIN LOGIN CARD ===
with st.container():
    st.markdown("<h1> Portfolio Buzz</h1>", unsafe_allow_html=True)
    st.markdown("<p class='subtitle'>Every Stock. Every Headline. Miss Nothing</p>", unsafe_allow_html=True)

    st.markdown('<div class="login-card">', unsafe_allow_html=True)

    tab1, tab2 = st.tabs([" Login", " Sign Up"])
    with tab1:
        st.markdown("### Welcome Back")
        email = st.text_input("Email Address", placeholder="email@money.com", key="login_email")
        pwd = st.text_input("Password", type="password", placeholder="*******", key="login_pwd")
        if st.button("Sign In", key="login_btn"):
            if email and pwd:
                success, msg = authenticate_user(email, pwd)
                if success:
                    st.session_state.authenticated = True
                    st.session_state.username = email
                    st.success("Welcome back!")
                    st.balloons()
                    time.sleep(1)
                    st.switch_page("pages/home.py")
                else:
                    st.error("Invalid email or password")
            else:
                st.warning("Please fill in all fields")
        st.markdown("---")
        # st.info("**Demo Account** → `demo@example.com` | `demo123`")
    with tab2:
        st.markdown("### Create Your Account")
        new_email = st.text_input("Email", placeholder="you@money.com", key="reg_email")
        new_pwd = st.text_input("Password", type="password", placeholder="Min 6 characters", key="reg_pwd")
        confirm_pwd = st.text_input("Confirm Password", type="password", key="reg_confirm")

        if st.button("Create Account", key="reg_btn", type="primary", use_container_width=True):
            if not new_email or not new_pwd or not confirm_pwd:
                st.error("All fields are required")
            elif new_pwd != confirm_pwd:
                st.error("Passwords do not match")
            else:
                # Strong password validation
                if len(new_pwd) < 8:
                    st.error("Password must be at least 8 characters long")
                elif not re.search(r"[A-Z]", new_pwd):
                    st.error("Password must contain at least one uppercase letter")
                elif not re.search(r"[a-z]", new_pwd):
                    st.error("Password must contain at least one lowercase letter")
                elif not re.search(r"[0-9]", new_pwd):
                    st.error("Password must contain at least one number")
                elif not re.search(r"[!@#$%^&*(),.?\":{}|<>]", new_pwd):
                    st.error("Password must contain at least one special character")
                else:
                    # All checks passed → create user
                    success, msg = create_user(new_email.lower().strip(), new_pwd)
                    if success:
                        st.success("Account created successfully!")
                        st.balloons()
                        st.snow()
                        time.sleep(1.8)
                        st.rerun()
                    else:
                        st.error(msg)
        
        # Live password strength indicator
        if new_pwd:
            score = 0
            feedback = []
            if len(new_pwd) >= 8: score += 1
            else: feedback.append("8+ characters")
            if re.search(r"[A-Z]", new_pwd): score += 1
            else: feedback.append("one uppercase")
            if re.search(r"[a-z]", new_pwd): score += 1
            else: feedback.append("one lowercase")
            if re.search(r"[0-9]", new_pwd): score += 1
            else: feedback.append("one number")
            if re.search(r"[!@#$%^&*(),.?\":{}|<>]", new_pwd): score += 1
            else: feedback.append("one special char")

            if score == 5:
                st.success("Strong password!")
            elif score >= 3:
                st.warning(f"Medium – add: {', '.join(feedback[:2])}")
            else:
                st.error(f"Weak – needs: {', '.join(feedback)}")
    st.markdown('</div>', unsafe_allow_html=True)
    # Footer Note
    st.markdown("""
    <div style='text-align: center; margin-top: 30px; color: white; opacity: 0.9; font-size: 14px;'>
        <p> Secure • Fast • Built for Serious Investors</p>
    </div>
    """, unsafe_allow_html=True)