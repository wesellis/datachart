"""
Advanced Analytics Engine for DataChart
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Union
from datetime import datetime, timedelta
from scipy import stats
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import IsolationForest
import json
import logging

logger = logging.getLogger(__name__)

class AnalyticsEngine:
    """Advanced analytics processing engine"""
    
    def __init__(self):
        self.cache = {}
        self.models = {}
        
    async def analyze_data(
        self, 
        data: Union[pd.DataFrame, List[Dict], Dict],
        analysis_type: str,
        config: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Main entry point for data analysis
        
        Args:
            data: Input data (DataFrame, list of dicts, or dict)
            analysis_type: Type of analysis to perform
            config: Additional configuration parameters
        """
        # Convert data to DataFrame if necessary
        if isinstance(data, list):
            df = pd.DataFrame(data)
        elif isinstance(data, dict):
            df = pd.DataFrame([data])
        else:
            df = data
            
        config = config or {}
        
        # Route to appropriate analysis method
        if analysis_type == "statistical":
            return await self.statistical_analysis(df, config)
        elif analysis_type == "trend":
            return await self.trend_analysis(df, config)
        elif analysis_type == "anomaly":
            return await self.anomaly_detection(df, config)
        elif analysis_type == "forecast":
            return await self.time_series_forecast(df, config)
        elif analysis_type == "correlation":
            return await self.correlation_analysis(df, config)
        elif analysis_type == "clustering":
            return await self.clustering_analysis(df, config)
        elif analysis_type == "dimension_reduction":
            return await self.dimension_reduction(df, config)
        elif analysis_type == "pattern":
            return await self.pattern_recognition(df, config)
        elif analysis_type == "sentiment":
            return await self.sentiment_analysis(df, config)
        elif analysis_type == "predictive":
            return await self.predictive_modeling(df, config)
        else:
            raise ValueError(f"Unknown analysis type: {analysis_type}")
            
    async def statistical_analysis(self, df: pd.DataFrame, config: Dict) -> Dict[str, Any]:
        """Perform comprehensive statistical analysis"""
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        
        results = {
            "summary_statistics": {},
            "distributions": {},
            "outliers": {},
            "normality_tests": {}
        }
        
        for col in numeric_cols:
            data = df[col].dropna()
            
            # Summary statistics
            results["summary_statistics"][col] = {
                "mean": float(data.mean()),
                "median": float(data.median()),
                "std": float(data.std()),
                "min": float(data.min()),
                "max": float(data.max()),
                "q1": float(data.quantile(0.25)),
                "q3": float(data.quantile(0.75)),
                "iqr": float(data.quantile(0.75) - data.quantile(0.25)),
                "skewness": float(data.skew()),
                "kurtosis": float(data.kurtosis()),
                "count": int(len(data)),
                "missing": int(df[col].isna().sum())
            }
            
            # Distribution analysis
            hist, bins = np.histogram(data, bins='auto')
            results["distributions"][col] = {
                "histogram": hist.tolist(),
                "bins": bins.tolist()
            }
            
            # Outlier detection using IQR method
            Q1 = data.quantile(0.25)
            Q3 = data.quantile(0.75)
            IQR = Q3 - Q1
            outliers = data[(data < Q1 - 1.5 * IQR) | (data > Q3 + 1.5 * IQR)]
            results["outliers"][col] = {
                "count": len(outliers),
                "values": outliers.tolist()[:10],  # Limit to first 10
                "percentage": float(len(outliers) / len(data) * 100)
            }
            
            # Normality test (Shapiro-Wilk)
            if len(data) >= 3 and len(data) <= 5000:
                statistic, p_value = stats.shapiro(data)
                results["normality_tests"][col] = {
                    "shapiro_statistic": float(statistic),
                    "p_value": float(p_value),
                    "is_normal": p_value > 0.05
                }
                
        return results
        
    async def trend_analysis(self, df: pd.DataFrame, config: Dict) -> Dict[str, Any]:
        """Analyze trends in time series data"""
        time_col = config.get("time_column", df.columns[0])
        value_cols = config.get("value_columns", df.select_dtypes(include=[np.number]).columns.tolist())
        
        results = {
            "trends": {},
            "seasonality": {},
            "change_points": {}
        }
        
        for col in value_cols:
            if col == time_col:
                continue
                
            data = df[[time_col, col]].dropna()
            
            # Calculate moving averages
            ma_7 = data[col].rolling(window=7, min_periods=1).mean()
            ma_30 = data[col].rolling(window=30, min_periods=1).mean()
            
            # Trend direction
            recent_trend = "increasing" if ma_7.iloc[-1] > ma_7.iloc[-min(7, len(ma_7)-1)] else "decreasing"
            
            # Linear regression for overall trend
            X = np.arange(len(data)).reshape(-1, 1)
            y = data[col].values
            model = LinearRegression()
            model.fit(X, y)
            trend_slope = float(model.coef_[0])
            
            results["trends"][col] = {
                "current_value": float(data[col].iloc[-1]),
                "ma_7": float(ma_7.iloc[-1]),
                "ma_30": float(ma_30.iloc[-1]) if len(ma_30) >= 30 else None,
                "trend_direction": recent_trend,
                "trend_slope": trend_slope,
                "trend_strength": abs(trend_slope) / data[col].std() if data[col].std() > 0 else 0
            }
            
            # Detect change points (simplified)
            rolling_mean = data[col].rolling(window=5, min_periods=1).mean()
            rolling_std = data[col].rolling(window=5, min_periods=1).std()
            z_scores = np.abs((data[col] - rolling_mean) / rolling_std)
            change_points = data.index[z_scores > 3].tolist()
            
            results["change_points"][col] = {
                "detected_points": change_points[:10],  # Limit to first 10
                "count": len(change_points)
            }
            
        return results
        
    async def anomaly_detection(self, df: pd.DataFrame, config: Dict) -> Dict[str, Any]:
        """Detect anomalies in the data"""
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        contamination = config.get("contamination", 0.1)
        
        results = {
            "anomalies": {},
            "anomaly_scores": {},
            "summary": {}
        }
        
        if len(numeric_cols) == 0:
            return results
            
        # Prepare data
        X = df[numeric_cols].fillna(df[numeric_cols].mean())
        
        # Isolation Forest for anomaly detection
        iso_forest = IsolationForest(contamination=contamination, random_state=42)
        anomaly_labels = iso_forest.fit_predict(X)
        anomaly_scores = iso_forest.score_samples(X)
        
        # Get anomaly indices
        anomaly_indices = np.where(anomaly_labels == -1)[0]
        
        results["anomalies"] = {
            "indices": anomaly_indices.tolist()[:100],  # Limit to first 100
            "count": len(anomaly_indices),
            "percentage": float(len(anomaly_indices) / len(df) * 100)
        }
        
        results["anomaly_scores"] = {
            "mean_score": float(np.mean(anomaly_scores)),
            "std_score": float(np.std(anomaly_scores)),
            "min_score": float(np.min(anomaly_scores)),
            "max_score": float(np.max(anomaly_scores))
        }
        
        # Analyze anomalies by column
        for col in numeric_cols:
            anomaly_values = X.iloc[anomaly_indices][col]
            normal_values = X[anomaly_labels == 1][col]
            
            results["summary"][col] = {
                "anomaly_mean": float(anomaly_values.mean()),
                "normal_mean": float(normal_values.mean()),
                "anomaly_std": float(anomaly_values.std()),
                "normal_std": float(normal_values.std())
            }
            
        return results
        
    async def time_series_forecast(self, df: pd.DataFrame, config: Dict) -> Dict[str, Any]:
        """Perform time series forecasting"""
        time_col = config.get("time_column", df.columns[0])
        value_col = config.get("value_column", df.columns[1])
        horizon = config.get("horizon", 10)
        
        data = df[[time_col, value_col]].dropna()
        
        # Simple moving average forecast
        ma_window = min(7, len(data) // 3)
        ma = data[value_col].rolling(window=ma_window, min_periods=1).mean()
        
        # Linear trend extrapolation
        X = np.arange(len(data)).reshape(-1, 1)
        y = data[value_col].values
        model = LinearRegression()
        model.fit(X, y)
        
        # Generate forecast
        future_X = np.arange(len(data), len(data) + horizon).reshape(-1, 1)
        forecast = model.predict(future_X)
        
        # Calculate confidence intervals (simplified)
        residuals = y - model.predict(X)
        std_error = np.std(residuals)
        confidence_interval = 1.96 * std_error
        
        return {
            "forecast": {
                "values": forecast.tolist(),
                "horizon": horizon,
                "method": "linear_trend",
                "confidence_interval": float(confidence_interval)
            },
            "model_metrics": {
                "r_squared": float(model.score(X, y)),
                "slope": float(model.coef_[0]),
                "intercept": float(model.intercept_),
                "std_error": float(std_error)
            },
            "historical_stats": {
                "last_value": float(data[value_col].iloc[-1]),
                "mean": float(data[value_col].mean()),
                "std": float(data[value_col].std()),
                "trend": "increasing" if model.coef_[0] > 0 else "decreasing"
            }
        }
        
    async def correlation_analysis(self, df: pd.DataFrame, config: Dict) -> Dict[str, Any]:
        """Analyze correlations between variables"""
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        method = config.get("method", "pearson")
        
        if len(numeric_cols) < 2:
            return {"error": "Need at least 2 numeric columns for correlation analysis"}
            
        # Calculate correlation matrix
        corr_matrix = df[numeric_cols].corr(method=method)
        
        # Find strong correlations
        strong_correlations = []
        for i in range(len(numeric_cols)):
            for j in range(i + 1, len(numeric_cols)):
                corr_value = corr_matrix.iloc[i, j]
                if abs(corr_value) > 0.7:  # Strong correlation threshold
                    strong_correlations.append({
                        "var1": numeric_cols[i],
                        "var2": numeric_cols[j],
                        "correlation": float(corr_value),
                        "strength": "strong" if abs(corr_value) > 0.9 else "moderate"
                    })
                    
        # Calculate p-values for correlations
        p_values = {}
        for col1 in numeric_cols:
            p_values[col1] = {}
            for col2 in numeric_cols:
                if col1 != col2:
                    data1 = df[col1].dropna()
                    data2 = df[col2].dropna()
                    if len(data1) > 2 and len(data2) > 2:
                        _, p_value = stats.pearsonr(data1[:min(len(data1), len(data2))], 
                                                   data2[:min(len(data1), len(data2))])
                        p_values[col1][col2] = float(p_value)
                        
        return {
            "correlation_matrix": corr_matrix.to_dict(),
            "strong_correlations": strong_correlations,
            "p_values": p_values,
            "summary": {
                "num_variables": len(numeric_cols),
                "num_strong_correlations": len(strong_correlations),
                "method": method
            }
        }
        
    async def clustering_analysis(self, df: pd.DataFrame, config: Dict) -> Dict[str, Any]:
        """Perform clustering analysis"""
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        n_clusters = config.get("n_clusters", 3)
        
        if len(numeric_cols) == 0:
            return {"error": "No numeric columns for clustering"}
            
        # Prepare and scale data
        X = df[numeric_cols].fillna(df[numeric_cols].mean())
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # K-means clustering
        kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        cluster_labels = kmeans.fit_predict(X_scaled)
        
        # Calculate cluster statistics
        cluster_stats = {}
        for i in range(n_clusters):
            cluster_mask = cluster_labels == i
            cluster_data = X[cluster_mask]
            
            cluster_stats[f"cluster_{i}"] = {
                "size": int(np.sum(cluster_mask)),
                "percentage": float(np.sum(cluster_mask) / len(X) * 100),
                "centroid": {col: float(val) for col, val in 
                           zip(numeric_cols, scaler.inverse_transform([kmeans.cluster_centers_[i]])[0])},
                "mean_values": cluster_data.mean().to_dict(),
                "std_values": cluster_data.std().to_dict()
            }
            
        # Calculate silhouette score if more than 1 cluster
        from sklearn.metrics import silhouette_score
        if n_clusters > 1:
            silhouette = float(silhouette_score(X_scaled, cluster_labels))
        else:
            silhouette = None
            
        return {
            "clusters": cluster_stats,
            "model_metrics": {
                "inertia": float(kmeans.inertia_),
                "silhouette_score": silhouette,
                "n_clusters": n_clusters
            },
            "cluster_assignments": cluster_labels.tolist()[:100]  # Limit to first 100
        }
        
    async def dimension_reduction(self, df: pd.DataFrame, config: Dict) -> Dict[str, Any]:
        """Perform dimensionality reduction"""
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        n_components = config.get("n_components", 2)
        
        if len(numeric_cols) < n_components:
            return {"error": f"Need at least {n_components} numeric columns"}
            
        # Prepare and scale data
        X = df[numeric_cols].fillna(df[numeric_cols].mean())
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # PCA
        pca = PCA(n_components=n_components)
        X_reduced = pca.fit_transform(X_scaled)
        
        return {
            "reduced_dimensions": {
                f"component_{i}": X_reduced[:, i].tolist()[:100]  # Limit to first 100
                for i in range(n_components)
            },
            "pca_metrics": {
                "explained_variance": pca.explained_variance_.tolist(),
                "explained_variance_ratio": pca.explained_variance_ratio_.tolist(),
                "cumulative_variance_ratio": np.cumsum(pca.explained_variance_ratio_).tolist()
            },
            "component_loadings": {
                f"component_{i}": {
                    col: float(val) 
                    for col, val in zip(numeric_cols, pca.components_[i])
                }
                for i in range(n_components)
            }
        }
        
    async def pattern_recognition(self, df: pd.DataFrame, config: Dict) -> Dict[str, Any]:
        """Recognize patterns in the data"""
        # Simplified pattern recognition
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        
        patterns = {
            "cyclic_patterns": {},
            "trending_patterns": {},
            "recurring_values": {}
        }
        
        for col in numeric_cols:
            data = df[col].dropna()
            
            # Check for cyclic patterns (simplified)
            if len(data) > 10:
                # Autocorrelation
                autocorr = [data.autocorr(lag=i) for i in range(1, min(11, len(data) // 2))]
                max_autocorr = max(autocorr) if autocorr else 0
                patterns["cyclic_patterns"][col] = {
                    "has_cycle": max_autocorr > 0.7,
                    "max_autocorrelation": float(max_autocorr),
                    "lag": autocorr.index(max_autocorr) + 1 if autocorr and max_autocorr > 0.7 else None
                }
                
            # Check for trends
            X = np.arange(len(data)).reshape(-1, 1)
            y = data.values
            model = LinearRegression()
            model.fit(X, y)
            r_squared = model.score(X, y)
            
            patterns["trending_patterns"][col] = {
                "has_trend": r_squared > 0.5,
                "trend_strength": float(r_squared),
                "direction": "increasing" if model.coef_[0] > 0 else "decreasing"
            }
            
            # Find recurring values
            value_counts = data.value_counts()
            recurring = value_counts[value_counts > len(data) * 0.05]  # Values occurring > 5%
            
            patterns["recurring_values"][col] = {
                "has_recurring": len(recurring) > 0,
                "top_values": recurring.head(5).to_dict() if len(recurring) > 0 else {}
            }
            
        return patterns
        
    async def sentiment_analysis(self, df: pd.DataFrame, config: Dict) -> Dict[str, Any]:
        """Analyze sentiment in text data (simplified)"""
        text_cols = df.select_dtypes(include=['object']).columns.tolist()
        
        if not text_cols:
            return {"error": "No text columns found"}
            
        # Simplified sentiment using keyword matching
        positive_words = ['good', 'great', 'excellent', 'positive', 'success', 'increase', 'growth']
        negative_words = ['bad', 'poor', 'negative', 'failure', 'decrease', 'decline', 'loss']
        
        results = {}
        for col in text_cols:
            texts = df[col].dropna().astype(str)
            
            sentiments = []
            for text in texts:
                text_lower = text.lower()
                pos_count = sum(word in text_lower for word in positive_words)
                neg_count = sum(word in text_lower for word in negative_words)
                
                if pos_count > neg_count:
                    sentiments.append('positive')
                elif neg_count > pos_count:
                    sentiments.append('negative')
                else:
                    sentiments.append('neutral')
                    
            sentiment_counts = pd.Series(sentiments).value_counts()
            
            results[col] = {
                "sentiment_distribution": sentiment_counts.to_dict(),
                "dominant_sentiment": sentiment_counts.index[0] if len(sentiment_counts) > 0 else 'neutral',
                "positivity_score": float(sentiment_counts.get('positive', 0) / len(sentiments) * 100) if sentiments else 0
            }
            
        return results
        
    async def predictive_modeling(self, df: pd.DataFrame, config: Dict) -> Dict[str, Any]:
        """Build predictive models"""
        target_col = config.get("target_column")
        feature_cols = config.get("feature_columns", [])
        
        if not target_col or not feature_cols:
            # Auto-detect if not specified
            numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
            if len(numeric_cols) < 2:
                return {"error": "Need at least 2 numeric columns for predictive modeling"}
            target_col = target_col or numeric_cols[-1]
            feature_cols = feature_cols or numeric_cols[:-1]
            
        # Prepare data
        X = df[feature_cols].fillna(df[feature_cols].mean())
        y = df[target_col].fillna(df[target_col].mean())
        
        # Train simple linear regression
        model = LinearRegression()
        model.fit(X, y)
        
        # Make predictions
        predictions = model.predict(X)
        
        # Calculate metrics
        from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
        mse = mean_squared_error(y, predictions)
        mae = mean_absolute_error(y, predictions)
        r2 = r2_score(y, predictions)
        
        # Feature importance (coefficients)
        feature_importance = {
            col: float(coef) 
            for col, coef in zip(feature_cols, model.coef_)
        }
        
        return {
            "model_type": "linear_regression",
            "target": target_col,
            "features": feature_cols,
            "metrics": {
                "r2_score": float(r2),
                "mse": float(mse),
                "mae": float(mae),
                "rmse": float(np.sqrt(mse))
            },
            "feature_importance": feature_importance,
            "model_parameters": {
                "intercept": float(model.intercept_),
                "coefficients": model.coef_.tolist()
            },
            "predictions": {
                "sample_predictions": predictions[:10].tolist(),
                "actual_values": y.iloc[:10].tolist()
            }
        }

# Global analytics engine instance
analytics_engine = AnalyticsEngine()