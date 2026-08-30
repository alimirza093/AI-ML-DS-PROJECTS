# 🏠 House Price Prediction

A machine learning model to predict house prices based on property features using Linear Regression.

## 📊 Model Performance
- **Accuracy (R² Score):** 67.32%
- **Mean Absolute Error:** PKR 906,954
- **RMSE:** PKR 1,214,719
- **Cross-Validation Score:** 63.99% (Stratified 5-Fold)

## 📁 Project Structure
```
01-house-price-prediction/
├── house-price-prediction.ipynb    # Jupyter notebook with full analysis
├── app.py                          # Streamlit web application
├── requirements.txt                # Python dependencies
├── models/
│   ├── housing_model.pkl          # Trained model
│   └── scaler.pkl                 # Feature scaler
└── data/
    └── Housing.csv                # Dataset
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the Streamlit App
```bash
streamlit run app.py
```

The app will open in your browser at `http://localhost:8501`

## 📝 Features Used for Prediction

**Property Details:**
- Area (Square Feet)
- Number of Bedrooms
- Number of Bathrooms
- Number of Stories
- Parking Spaces

**Amenities:**
- Main Road Access
- Guest Room
- Basement
- Hot Water Heating
- Air Conditioning
- Preferred Area

**Furnishing Status:**
- Unfurnished
- Semi-Furnished
- Furnished

## 🎯 How to Use the App

1. **Enter Property Details** in the sidebar using sliders
2. **Select Amenities** using checkboxes
3. **Choose Furnishing Status** from the radio buttons
4. **View Predicted Price** instantly
5. **Check Model Performance** metrics

## 📈 Model Information

### Algorithm
- **Type:** Linear Regression
- **Training Samples:** 419
- **Test Samples:** 126
- **Features:** 13

### Data Preprocessing
- ✅ Label Encoding for categorical variables (yes/no)
- ✅ One-Hot Encoding for furnishing status
- ✅ Feature Scaling using StandardScaler
- ✅ Train-Test Split (77/23)

### Accuracy Notes
- **Best Performance:** Budget to mid-range properties (PKR 2M - 6M)
- **Lower Accuracy:** Expensive properties (PKR 8M+)
- **Model Limitation:** Linear relationships only

## 💡 Tips for Better Predictions

- Model works best for houses in **mid-price range**
- Properties with more amenities tend to be more expensive
- Main Road access significantly affects price
- Preferred area properties command premium prices

## 🔄 Model Retraining

To retrain the model with new data:
1. Update `Housing.csv` in the `data/` folder
2. Run the Jupyter notebook: `house-price-prediction.ipynb`
3. Pickle files will be automatically saved

## 📚 Dataset
- **Source:** Pakistan Housing Dataset
- **Total Samples:** 545 houses
- **Features:** 12 property characteristics
- **Target:** Price in PKR

## ⚙️ Requirements
- Python 3.8+
- pandas
- numpy
- scikit-learn
- streamlit
- matplotlib
- seaborn

## 📧 Notes
- Model accuracy: **67.32%** (Good for a linear model)
- Average prediction error: **±1.25 Million PKR**
- Cross-validation ensures model generalization

---
**Created:** August 2026 | **Model Type:** Linear Regression | **Status:** Production Ready ✅
