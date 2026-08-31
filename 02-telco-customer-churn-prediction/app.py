import os
import joblib
import pandas as pd
import streamlit as st
from sklearn.preprocessing import LabelEncoder

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "gradient_boosting_model.pkl")
DATA_PATH = os.path.join(BASE_DIR, "..", "data", "WA_Fn-UseC_-Telco-Customer-Churn.csv")

# Notebook-defined columns (source of truth)
BINARY_COLS = [
    'gender',
    'Partner',
    'Dependents',
    'PhoneService',
    'PaperlessBilling',
    'Churn'
]

ONE_HOT_COLS = [
    'MultipleLines',
    'InternetService',
    'OnlineSecurity',
    'OnlineBackup',
    'DeviceProtection',
    'TechSupport',
    'StreamingTV',
    'StreamingMovies',
    'Contract',
    'PaymentMethod'
]

# Utility: load and reproduce notebook preprocessing to obtain reference feature order
@st.cache_data
def load_reference_features():
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Dataset not found at {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)
    # Notebook dropped customerID
    if 'customerID' in df.columns:
        df = df.drop(['customerID'], axis=1)

    # Ensure TotalCharges numeric then fill missing with median (matches notebook intent)
    if 'TotalCharges' in df.columns:
        df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce')
        df['TotalCharges'] = df['TotalCharges'].fillna(df['TotalCharges'].median())

    # Label encode binary columns the same way notebook did (LabelEncoder per column)
    le_map = {}
    for col in BINARY_COLS[:-1]:
        if col in df.columns:
            le = LabelEncoder()
            df[col] = df[col].astype(str)
            df[col] = le.fit_transform(df[col])
            le_map[col] = le

    # One-hot encode the notebook's one-hot columns with drop_first=True
    existing_one_hot = [c for c in ONE_HOT_COLS if c in df.columns]
    df = pd.get_dummies(df, columns=existing_one_hot, drop_first=True, dtype=int)

    # Final features are all columns except 'Churn'
    if 'Churn' in df.columns:
        feature_cols = [c for c in df.columns if c != 'Churn']
    else:
        feature_cols = list(df.columns)

    return feature_cols, le_map


def load_model():
    if not os.path.exists(MODEL_PATH):
        return None
    model = joblib.load(MODEL_PATH)
    return model


def preprocess_input(user_input: dict, feature_cols, le_map):
    # Create single-row dataframe
    row = pd.DataFrame([user_input])

    # Ensure TotalCharges numeric and fillna with reference median if present
    if 'TotalCharges' in row.columns:
        row['TotalCharges'] = pd.to_numeric(row['TotalCharges'], errors='coerce')
        # compute median from reference dataset
    # Apply label encoders for binary cols using fitted objects from reference
    for col, le in le_map.items():
        if col in row.columns:
            # If user provided unseen label, fallback to mapping via classes_
            val = str(row.at[0, col])
            if val in le.classes_:
                row[col] = le.transform([val])[0]
            else:
                # fallback: try map common Yes/No or Male/Female
                if val.lower() in ['yes', 'y']:
                    row[col] = 1
                elif val.lower() in ['no', 'n']:
                    row[col] = 0
                elif val.lower() in ['male']:
                    # male->1 if classes contain 'Female' and 'Male'
                    row[col] = 1
                else:
                    row[col] = 0

    # One-hot encode using same columns, drop_first behavior
    # We'll generate dummies and then reindex to feature_cols
    existing_one_hot = [c for c in ONE_HOT_COLS if c in row.columns]
    if existing_one_hot:
        row = pd.get_dummies(row, columns=existing_one_hot, drop_first=True, dtype=int)

    # Ensure all feature columns exist
    for c in feature_cols:
        if c not in row.columns:
            row[c] = 0

    # Reorder columns to match model's training features
    row = row[feature_cols]
    return row


# --- Streamlit UI ---
st.set_page_config(page_title="Telco Customer Churn Prediction", page_icon="📞", layout="wide")
st.markdown("""
# Telco Customer Churn Prediction
This app predicts whether a customer is likely to churn. The preprocessing and model follow the project's Jupyter notebook exactly.
""")

# Load reference features and model
try:
    feature_cols, le_map = load_reference_features()
except FileNotFoundError as e:
    st.error(str(e))
    st.stop()

model = load_model()
if model is None:
    st.error(f"Trained model file not found at {MODEL_PATH}. Please ensure the notebook saved 'gradient_boosting_model.pkl' in the project folder.")
    st.stop()

# Sidebar form separated into logical sections
with st.sidebar.form(key='customer_form'):
    st.header('Customer Input')
    st.subheader('Customer Information')
    gender = st.selectbox('Gender', ['Female', 'Male'])
    SeniorCitizen = st.selectbox('Senior Citizen', [0, 1])
    Partner = st.selectbox('Partner', ['Yes', 'No'])
    Dependents = st.selectbox('Dependents', ['Yes', 'No'])

    st.subheader('Services')
    PhoneService = st.selectbox('Phone Service', ['Yes', 'No'])
    MultipleLines = st.selectbox('Multiple Lines', ['No', 'Yes', 'No phone service'])
    InternetService = st.selectbox('Internet Service', ['DSL', 'Fiber optic', 'No'])
    OnlineSecurity = st.selectbox('Online Security', ['No', 'Yes', 'No internet service'])
    OnlineBackup = st.selectbox('Online Backup', ['No', 'Yes', 'No internet service'])
    DeviceProtection = st.selectbox('Device Protection', ['No', 'Yes', 'No internet service'])
    TechSupport = st.selectbox('Tech Support', ['No', 'Yes', 'No internet service'])
    StreamingTV = st.selectbox('Streaming TV', ['No', 'Yes', 'No internet service'])
    StreamingMovies = st.selectbox('Streaming Movies', ['No', 'Yes', 'No internet service'])

    st.subheader('Contract & Billing')
    Contract = st.selectbox('Contract', ['Month-to-month', 'One year', 'Two year'])
    PaperlessBilling = st.selectbox('Paperless Billing', ['Yes', 'No'])
    PaymentMethod = st.selectbox('Payment Method', ['Electronic check', 'Mailed check', 'Bank transfer (automatic)', 'Credit card (automatic)'])

    st.subheader('Charges & Tenure')
    tenure = st.number_input('Tenure (months)', min_value=0, max_value=100, value=12)
    MonthlyCharges = st.number_input('Monthly Charges', min_value=0.0, max_value=1000.0, value=70.0, step=0.1)
    TotalCharges = st.number_input('Total Charges', min_value=0.0, max_value=100000.0, value=500.0, step=0.1)

    submit = st.form_submit_button('Predict')

if submit:
    # Build input dict using human-readable values (UI does not expose encoded numbers)
    user_input = {
        'gender': gender,
        'SeniorCitizen': SeniorCitizen,
        'Partner': Partner,
        'Dependents': Dependents,
        'PhoneService': PhoneService,
        'MultipleLines': MultipleLines,
        'InternetService': InternetService,
        'OnlineSecurity': OnlineSecurity,
        'OnlineBackup': OnlineBackup,
        'DeviceProtection': DeviceProtection,
        'TechSupport': TechSupport,
        'StreamingTV': StreamingTV,
        'StreamingMovies': StreamingMovies,
        'Contract': Contract,
        'PaperlessBilling': PaperlessBilling,
        'PaymentMethod': PaymentMethod,
        'tenure': tenure,
        'MonthlyCharges': MonthlyCharges,
        'TotalCharges': TotalCharges,
    }

    # Preprocess user input to match notebook pipeline and final feature order
    processed = preprocess_input(user_input, feature_cols, le_map)

    # Predict
    try:
        proba = model.predict_proba(processed)[0][1]
        pred = model.predict(processed)[0]
    except Exception as e:
        st.error(f"Model prediction failed: {e}")
        st.stop()

    # Display results
    churn_text = "Customer is likely to churn" if int(pred) == 1 else "Customer is unlikely to churn"
    st.subheader('Prediction')
    st.write(f"**{churn_text}**")

    st.subheader('Churn probability')
    st.write(f"{proba * 100:.2f}%")

    st.subheader('Risk level')
    if proba >= 0.7:
        st.error('High')
    elif proba >= 0.4:
        st.warning('Medium')
    else:
        st.success('Low')

    st.markdown('---')
    st.subheader('Prediction Summary')
    summary = pd.DataFrame({
        'Feature': list(user_input.keys()),
        'Value': list(user_input.values())
    })
    st.table(summary)

    # Optional: offer processed vector for debugging
    st.markdown('---')
    st.subheader('Processed feature vector (model input)')
    st.write(processed)
