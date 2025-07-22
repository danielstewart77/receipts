import streamlit as st
import requests
import json
from PIL import Image
import io
import base64
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:8001"

# Custom CSS for mobile-like styling
st.set_page_config(
    page_title="Receipts App",
    page_icon="🧾",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Custom CSS to match mobile app design
st.markdown("""
<style>
    .main > div {
        padding: 1rem;
    }
    
    .stTabs [data-baseweb="tab-list"] {
        gap: 2rem;
        justify-content: center;
    }
    
    .stTabs [data-baseweb="tab"] {
        height: 50px;
        padding: 0.5rem 1rem;
        border-radius: 25px;
        background-color: #f0f0f0;
        border: none;
        font-weight: 500;
    }
    
    .stTabs [aria-selected="true"] {
        background-color: #6366f1;
        color: white;
    }
    
    .camera-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 2rem;
        background-color: #f8f9fa;
        border-radius: 12px;
        margin: 2rem 0;
    }
    
    .camera-button {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        border: 4px solid #6366f1;
        background-color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        margin-top: 2rem;
    }
    
    .camera-button:hover {
        background-color: #f0f0f0;
    }
    
    .login-container {
        max-width: 400px;
        margin: 0 auto;
        padding: 2rem;
        background-color: white;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .login-header {
        text-align: center;
        margin-bottom: 2rem;
        color: #6366f1;
    }
</style>
""", unsafe_allow_html=True)

def check_authentication():
    """Check if user has valid JWT token"""
    if 'access_token' not in st.session_state:
        return False
    
    try:
        headers = {"Authorization": f"Bearer {st.session_state.access_token}"}
        response = requests.get(f"{API_BASE_URL}/receipts/authenticated", headers=headers)
        return response.status_code == 200
    except:
        return False

def login_user(username, password):
    """Authenticate user and store tokens"""
    try:
        response = requests.post(
            f"{API_BASE_URL}/auth/login",
            json={"username": username, "password": password}
        )
        
        if response.status_code == 200:
            data = response.json()
            st.session_state.access_token = data['access_token']
            st.session_state.refresh_token = data['refresh_token']
            st.session_state.username = username
            return True, "Login successful!"
        else:
            return False, response.json().get('detail', 'Login failed')
    except Exception as e:
        return False, f"Connection error: {str(e)}"

def logout_user():
    """Clear user session"""
    for key in ['access_token', 'refresh_token', 'username']:
        if key in st.session_state:
            del st.session_state[key]

def login_page():
    """Display login page"""
    st.markdown('<div class="login-container">', unsafe_allow_html=True)
    st.markdown('<h1 class="login-header">🧾 Receipts App</h1>', unsafe_allow_html=True)
    
    with st.form("login_form"):
        username = st.text_input("Username", placeholder="Enter your username")
        password = st.text_input("Password", type="password", placeholder="Enter your password")
        
        col1, col2, col3 = st.columns([1, 2, 1])
        with col2:
            login_button = st.form_submit_button("Login", use_container_width=True)
        
        if login_button:
            if username and password:
                success, message = login_user(username, password)
                if success:
                    st.success(message)
                    st.rerun()
                else:
                    st.error(message)
            else:
                st.error("Please enter both username and password")
    
    st.markdown('</div>', unsafe_allow_html=True)

def upload_in_store_image(image_data):
    """Upload image to in-store endpoint"""
    try:
        headers = {"Authorization": f"Bearer {st.session_state.access_token}"}
        
        # Convert image to bytes
        if isinstance(image_data, Image.Image):
            img_bytes = io.BytesIO()
            image_data.save(img_bytes, format='PNG')
            img_bytes.seek(0)
            
            files = {"file": ("image.png", img_bytes, "image/png")}
            response = requests.post(
                f"{API_BASE_URL}/receipts/upload_in_store",
                files=files,
                headers=headers
            )
            
            if response.status_code == 200:
                return True, response.json()
            else:
                return False, response.json().get('detail', 'Upload failed')
        
    except Exception as e:
        return False, f"Upload error: {str(e)}"

def upload_receipt_image(image_data):
    """Upload image to receipt endpoint"""
    try:
        headers = {"Authorization": f"Bearer {st.session_state.access_token}"}
        
        if isinstance(image_data, Image.Image):
            img_bytes = io.BytesIO()
            image_data.save(img_bytes, format='PNG')
            img_bytes.seek(0)
            
            files = {"file": ("receipt.png", img_bytes, "image/png")}
            response = requests.post(
                f"{API_BASE_URL}/receipts/upload_receipt",
                files=files,
                headers=headers
            )
            
            if response.status_code == 200:
                return True, response.json()
            else:
                return False, response.json().get('detail', 'Upload failed')
        
    except Exception as e:
        return False, f"Upload error: {str(e)}"

def save_in_store_item(item_data):
    """Save in-store item data to the database"""
    try:
        headers = {"Authorization": f"Bearer {st.session_state.access_token}"}
        response = requests.post(
            f"{API_BASE_URL}/receipts/save_in_store",
            json=item_data,
            headers=headers
        )
        
        if response.status_code == 200:
            return True, response.json()
        else:
            return False, response.json().get('detail', 'Save failed')
    except Exception as e:
        return False, f"Save error: {str(e)}"

def send_chat_message(message):
    """Send message to chat endpoint"""
    try:
        headers = {"Authorization": f"Bearer {st.session_state.access_token}"}
        response = requests.post(
            f"{API_BASE_URL}/receipts/chat",
            json={"query": message},
            headers=headers
        )
        
        if response.status_code == 200:
            return True, response.json()['message']
        else:
            return False, response.json().get('detail', 'Chat failed')
    except Exception as e:
        return False, f"Chat error: {str(e)}"

def main_app():
    """Main application with tabs"""
    # Header with logout button
    col1, col2 = st.columns([3, 1])
    with col1:
        st.title("🧾 Receipts App")
    with col2:
        if st.button("Logout", key="logout_btn"):
            logout_user()
            st.rerun()
    
    # Create tabs
    tab1, tab2, tab3 = st.tabs(["📱 In-Store", "🧾 Receipt", "💬 Chat"])
    
    with tab1:
        st.header("In-Store Scanner")
        
        # Initialize session state for in-store data
        if "instore_data" not in st.session_state:
            st.session_state.instore_data = None
        
        # Camera input
        st.markdown('<div class="camera-container">', unsafe_allow_html=True)
        
        # Use camera input
        camera_image = st.camera_input("Take a picture of the item")
        
        if camera_image is not None:
            # Convert camera image to PIL Image
            image = Image.open(camera_image)
            
            # Process button
            if st.button("Process In-Store Item", key="process_instore"):
                with st.spinner("Processing image..."):
                    result = upload_in_store_image(image)
                    
                    if result and len(result) == 2:
                        success, data = result
                        if success:
                            st.success("Image processed successfully!")
                            # Store the processed data in session state
                            st.session_state.instore_data = data
                            st.rerun()
                        else:
                            st.error(f"Processing failed: {data}")
                    else:
                        st.error("Processing failed: Invalid response")
        
        # Show the form if we have processed data
        if st.session_state.instore_data is not None:
            st.markdown("---")
            st.subheader("Edit Item Details")
            
            data = st.session_state.instore_data
            
            with st.form("instore_form"):
                # Pre-populate form fields with LLM extracted data
                item_name = st.text_input("Item Name", value=data.get("item", ""))
                unit_price = st.number_input("Unit Price ($)", value=float(data.get("unitPrice", 0.0)), min_value=0.0, format="%.2f")
                total_price = st.number_input("Total Price ($)", value=float(data.get("totalPrice", 0.0)), min_value=0.0, format="%.2f")
                store_name = st.text_input("Store Name", value=data.get("store", ""))
                
                # Auto-populate date with current date, but make it editable
                current_date = datetime.now().strftime("%Y-%m-%d")
                purchase_date = st.date_input("Purchase Date", value=datetime.strptime(current_date, "%Y-%m-%d").date())
                
                col1, col2, col3 = st.columns([1, 1, 1])
                
                with col1:
                    if st.form_submit_button("Save Item", use_container_width=True):
                        # Prepare data for saving
                        save_data = {
                            "item": item_name,
                            "unitPrice": unit_price,
                            "totalPrice": total_price,
                            "store": store_name,
                            "date": purchase_date.strftime("%Y-%m-%d")
                        }
                        
                        with st.spinner("Saving item..."):
                            success, response = save_in_store_item(save_data)
                            
                            if success:
                                st.success("Item saved successfully!")
                                # Clear the session data
                                st.session_state.instore_data = None
                                st.rerun()
                            else:
                                st.error(f"Failed to save item: {response}")
                
                with col2:
                    if st.form_submit_button("Cancel", use_container_width=True):
                        st.session_state.instore_data = None
                        st.rerun()
        
        st.markdown('</div>', unsafe_allow_html=True)
    
    with tab2:
        st.header("Receipt Scanner")
        
        # Camera input for receipt
        receipt_image = st.camera_input("Take a picture of the receipt", key="receipt_camera")
        
        if receipt_image is not None:
            # Display the image
            image = Image.open(receipt_image)
            st.image(image, caption="Receipt Image", use_container_width=True)
            
            # Process button
            if st.button("Process Receipt", key="process_receipt"):
                with st.spinner("Processing receipt..."):
                    result = upload_receipt_image(image)
                    
                    if result and len(result) == 2:
                        success, data = result
                        if success:
                            st.success("Receipt processed successfully!")
                            st.json(data)
                        else:
                            st.error(f"Processing failed: {data}")
                    else:
                        st.error("Processing failed: Invalid response")
    
    with tab3:
        st.header("Chat Assistant")
        
        # Initialize chat history
        if "chat_history" not in st.session_state:
            st.session_state.chat_history = []
        
        # Display chat history
        for message in st.session_state.chat_history:
            if message["role"] == "user":
                st.markdown(f"**You:** {message['content']}")
            else:
                st.markdown(f"**Assistant:** {message['content']}")
        
        # Chat input
        with st.form("chat_form", clear_on_submit=True):
            user_input = st.text_input("Ask about your receipts...", placeholder="What would you like to know?")
            send_button = st.form_submit_button("Send")
            
            if send_button and user_input:
                # Add user message to history
                st.session_state.chat_history.append({"role": "user", "content": user_input})
                
                # Send to API
                with st.spinner("Thinking..."):
                    success, response = send_chat_message(user_input)
                    
                    if success:
                        st.session_state.chat_history.append({"role": "assistant", "content": response})
                    else:
                        st.session_state.chat_history.append({"role": "assistant", "content": f"Error: {response}"})
                
                st.rerun()

def main():
    """Main application entry point"""
    if check_authentication():
        main_app()
    else:
        login_page()

if __name__ == "__main__":
    main()
