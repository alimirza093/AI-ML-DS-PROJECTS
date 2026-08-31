# Telco Customer Churn Prediction

A Streamlit dashboard for predicting whether a telecom customer is likely to churn using a trained Gradient Boosting model.

## Project Overview
This project analyzes the Telco customer churn dataset and trains a machine learning model to classify customers as:

- Likely to Stay
- Likely to Churn

The model is saved as `gradient_boosting_model.pkl` and is used in the Streamlit application for real-time predictions.

## Model Details
- **Algorithm:** Gradient Boosting Classifier
- **Target:** Customer churn (`Yes` / `No`)
- **Evaluation Metric:** F1 Score
- **Dataset:** Telco Customer Churn dataset

## Project Structure
```bash
02-telco-customer-churn-prediction/
├── app.py                         # Streamlit web app
├── gradient_boosting_model.pkl   # Trained model
├── README.md                     # Project documentation
├── requirements.txt              # Python dependencies
└── telco-customer-churn-prediction.ipynb  # Notebook with preprocessing and modeling
```

## Features Used in Prediction
The app uses customer information such as:

- Gender
- Senior citizen status
- Partner and dependents
- Tenure
- Phone service
- Internet service
- Contract type
- Monthly charges
- Total charges
- Support, protection, and streaming service preferences
- Payment method
- Paperless billing

## Run the App

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Start the Streamlit app
```bash
streamlit run app.py
```

Then open the local URL shown in the terminal, usually:

```bash
http://localhost:8501
```

## How to Use
1. Open the app in your browser.
2. Fill in the customer details in the sidebar.
3. Click the prediction button.
4. View the churn probability and risk classification.

## Business Use Case
This model helps telecom teams identify customers at risk of leaving and can support:

- retention campaigns
- proactive customer support
- churn prevention strategies
- personalized offers for high-risk clients

## Notes
- The app follows the same preprocessing logic as the notebook to ensure the input format matches the trained model.
- The final prediction is based on the model’s churn probability, where values above 0.5 indicate a likely churn.

## Requirements
- Python 3.9+
- pandas
- numpy
- scikit-learn
- streamlit
- joblib

---
Created for customer churn prediction and business intelligence use.
