
export const soilDatasetInfo = {
    title: "Model Data Source: Agricultural Datasets",
    description: "The AgriVerseAI model's recommendations are not based on a single, static dataset. Instead, it has been trained on a vast corpus of agricultural data from diverse, publicly available sources, including research papers, governmental reports, and extensive datasets similar to those found on platforms like Kaggle. This ensures our analysis is robust, comprehensive, and reflects a wide range of real-world farming conditions.",
    sampleTitle: "Sample Data Structure",
    sampleDescription: "Below is a simplified example illustrating the type of data the model processes to find correlations between soil parameters and optimal crops.",
    headers: ["Nitrogen", "Phosphorus", "Potassium", "pH", "Temperature", "Humidity", "Rainfall", "Optimal Crop"],
    rows: [
        [90, 42, 43, 6.5, 20.9, 82.0, 202.9, "Rice"],
        [85, 58, 41, 5.5, 22.7, 80.3, 226.7, "Rice"],
        [60, 55, 44, 7.0, 23.0, 92.3, 112.9, "Jute"],
        [74, 35, 40, 6.9, 26.5, 81.4, 150.9, "Cotton"],
        [20, 130, 20, 5.8, 26.6, 52.1, 107.2, "Lentil"],
        [5, 135, 22, 6.0, 24.1, 53.2, 110.8, "Lentil"],
    ]
};