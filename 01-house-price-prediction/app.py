import streamlit as st
import pickle
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler

# Page configuration
st.set_page_config(
    page_title="🏠 Housing Price Predictor",
    page_icon="🏠",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
<style>
    .main-header {
        color: #1f77b4;
        font-size: 3em;
        font-weight: bold;
        text-align: center;
        margin-bottom: 1em;
    }
    .metric-card {
        background-color: #f0f2f6;
        padding: 1.5em;
        border-radius: 0.5em;
        margin: 1em 0;
    }
</style>
""", unsafe_allow_html=True)

# Load model and scaler
@st.cache_resource
def load_model():
    with open('/home/ali-mirza/AI-ML-DS-PROJECTS/01-house-price-prediction/models/housing_model.pkl', 'rb') as f:
        model = pickle.load(f)
    with open('/home/ali-mirza/AI-ML-DS-PROJECTS/01-house-price-prediction/models/scaler.pkl', 'rb') as f:
        scaler = pickle.load(f)
    return model, scaler

model, scaler = load_model()

# App Title
st.markdown("<div class='main-header'>🏠 House Price Prediction</div>", unsafe_allow_html=True)

# Sidebar
st.sidebar.markdown("## Input Features")
st.sidebar.markdown("---")

# Create input columns
col1, col2 = st.columns(2)

with col1:
    st.subheader("📏 Property Size")
    area = st.slider("Area (Sq Ft)", min_value=1500, max_value=20000, value=7500, step=100)
    bedrooms = st.slider("Number of Bedrooms", min_value=1, max_value=6, value=3, step=1)
    bathrooms = st.slider("Number of Bathrooms", min_value=1, max_value=4, value=2, step=1)
    
with col2:
    st.subheader("🏢 Property Details")
    stories = st.slider("Number of Stories", min_value=1, max_value=4, value=2, step=1)
    parking = st.slider("Parking Spaces", min_value=0, max_value=3, value=1, step=1)

# Amenities
st.subheader("🛏️ Amenities")
col_amenities1, col_amenities2, col_amenities3 = st.columns(3)

with col_amenities1:
    mainroad = st.checkbox("Main Road Access", value=True)
    guestroom = st.checkbox("Guest Room", value=False)

with col_amenities2:
    basement = st.checkbox("Basement", value=False)
    hotwaterheating = st.checkbox("Hot Water Heating", value=False)

with col_amenities3:
    airconditioning = st.checkbox("Air Conditioning", value=True)
    prefarea = st.checkbox("Preferred Area", value=True)

# Furnishing status
st.subheader("🛋️ Furnishing Status")
furnishing = st.radio("Select Furnishing Type:", 
                      options=["unfurnished", "semi-furnished", "furnished"],
                      horizontal=True)

# Convert furnishing to dummy variables (one-hot encoding)
furnishing_semi = 1 if furnishing == "semi-furnished" else 0
furnishing_furnished = 1 if furnishing == "furnished" else 0

# Create input array for prediction
input_data = np.array([[
    area,
    bedrooms,
    bathrooms,
    stories,
    int(mainroad),
    int(guestroom),
    int(basement),
    int(hotwaterheating),
    int(airconditioning),
    parking,
    int(prefarea),
    furnishing_semi,
    furnishing_furnished
]])

# Scale the input
input_scaled = scaler.transform(input_data)

# Make prediction
prediction = model.predict(input_scaled)[0]

# Display results
st.divider()
col1, col2, col3 = st.columns(3)

with col1:
    st.metric("Predicted Price", f"PKR {prediction:,.0f}", delta=None)

with col2:
    st.metric("Model Accuracy", "67.32%", delta=None)

with col3:
    st.metric("Features Used", "13", delta=None)

# Additional Information
st.divider()
st.subheader("📊 Price Range Information")

price_info_col1, price_info_col2, price_info_col3 = st.columns(3)

with price_info_col1:
    st.info("💰 **Predicted Price**\n\n" + f"PKR {prediction:,.0f}")

with price_info_col2:
    if prediction > 8000000:
        st.warning("⚠️ **Expensive Property**\n\nModel accuracy lower for high-end properties")
    elif prediction > 5000000:
        st.success("✅ **Mid-Range Property**\n\nHigh prediction accuracy")
    else:
        st.success("✅ **Affordable Property**\n\nHigh prediction accuracy")

with price_info_col3:
    st.info("ℹ️ **Model Info**\n\nLinear Regression\nTraining Samples: 419\nTest Samples: 126")

# Model Performance
st.divider()
st.subheader("📈 Model Performance")

perf_col1, perf_col2, perf_col3, perf_col4 = st.columns(4)

with perf_col1:
    st.metric("R² Score", "0.6732", "67.32%")

with perf_col2:
    st.metric("Mean Error", "PKR 906K", "±1.25M")

with perf_col3:
    st.metric("RMSE", "PKR 1.21M", "Test Data")

with perf_col4:
    st.metric("CV Score", "63.99%", "Stratified 5-Fold")

# Summary
st.divider()
st.subheader("🔍 Input Summary")

summary_df = pd.DataFrame({
    'Feature': ['Area', 'Bedrooms', 'Bathrooms', 'Stories', 'Parking', 
                'Main Road', 'Guest Room', 'Basement', 'Hot Water Heating',
                'Air Conditioning', 'Preferred Area', 'Furnishing'],
    'Value': [f'{area} Sq Ft', bedrooms, bathrooms, stories, parking,
              'Yes' if mainroad else 'No', 'Yes' if guestroom else 'No',
              'Yes' if basement else 'No', 'Yes' if hotwaterheating else 'No',
              'Yes' if airconditioning else 'No', 'Yes' if prefarea else 'No',
              furnishing.title()]
})

st.table(summary_df)

# Footer
st.divider()
st.markdown("""
<div style='text-align: center; color: #888; font-size: 0.9em;'>
    <p>🏠 Housing Price Prediction Model</p>
    <p>Trained on Pakistan Housing Dataset | Model Accuracy: 67.32%</p>
</div>
""", unsafe_allow_html=True)
