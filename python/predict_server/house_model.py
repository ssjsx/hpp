from __future__ import annotations

from functools import lru_cache
import pickle
from pathlib import Path
from typing import cast

import numpy as np
import pandas as pd
from pydantic import BaseModel, ConfigDict, ValidationError
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

from schemas import (
    HouseFeatures,
    ModelCoefficients,
    ModelInfoResponse,
    ModelMetrics,
    TrainingRow,
)

FEATURE_COLUMNS = [
    "square_footage",
    "bedrooms",
    "bathrooms",
    "year_built",
    "lot_size",
    "distance_to_city_center",
    "school_rating",
]
TARGET_COLUMN = "price"
BASE_DIR = Path(__file__).resolve().parent
DATASET_PATH = BASE_DIR / "dataset" / "House Price Dataset.csv"
MODEL_WEIGHTS_DIR = BASE_DIR / "model_weights"
MODEL_WEIGHTS_PATH = MODEL_WEIGHTS_DIR / "house_model_weights.pkl"
MODEL_DIR = MODEL_WEIGHTS_DIR
MODEL_PATH = MODEL_WEIGHTS_PATH
LEGACY_MODEL_WEIGHTS_DIR = BASE_DIR / "artifacts"
LEGACY_MODEL_PATH = LEGACY_MODEL_WEIGHTS_DIR / "house_model.pkl"


@lru_cache(maxsize=4)
def _load_training_rows_cached(
    dataset_path_str: str,
    dataset_mtime_ns: int,
) -> tuple[TrainingRow, ...]:
    dataset_path = Path(dataset_path_str)
    dataframe = pd.read_csv(dataset_path, encoding="utf-8-sig")
    dataframe.columns = [str(column).strip() for column in dataframe.columns]

    required_columns = [*FEATURE_COLUMNS, TARGET_COLUMN]
    missing_columns = [
        column for column in required_columns if column not in dataframe.columns
    ]
    if missing_columns:
        raise ValueError(f"Dataset is missing required columns: {missing_columns}")

    filtered_dataframe = dataframe.loc[:, required_columns].dropna(subset=required_columns)

    if filtered_dataframe.empty:
        raise ValueError("Training dataset is empty after filtering missing values")

    rows: list[TrainingRow] = []
    invalid_rows: list[int] = []
    for row_number, row in enumerate(
        filtered_dataframe.itertuples(index=False, name=None),
        start=2,
    ):
        try:
            rows.append(HouseModel._tuple_to_training_row(row))
        except ValidationError:
            invalid_rows.append(row_number)

    if not rows:
        raise ValueError("Training dataset is empty")

    if invalid_rows:
        raise ValueError(f"Training dataset contains invalid rows: {invalid_rows}")

    return tuple(rows)


@lru_cache(maxsize=4)
def _load_model_weights_cached(
    model_weights_path_str: str,
    model_weights_mtime_ns: int,
) -> ModelWeights:
    model_weights_path = Path(model_weights_path_str)
    with model_weights_path.open("rb") as file:
        loaded = pickle.load(file)

    if not isinstance(loaded, ModelWeights):
        raise ValueError("Persisted model weights file has invalid format")

    return loaded


class ModelWeights(BaseModel):
    model: LinearRegression
    metrics: ModelMetrics
    coefficients: ModelCoefficients
    intercept: float

    model_config = ConfigDict(arbitrary_types_allowed=True)


class HouseModel:
    def __init__(
        self,
        dataset_path: Path = DATASET_PATH,
        model_weights_path: Path = MODEL_WEIGHTS_PATH,
    ):
        self.dataset_path = dataset_path
        self.model_weights_path = model_weights_path
        self._model_weights: ModelWeights | None = None

    def ensure_loaded(self) -> None:
        if self._model_weights is not None:
            return

        self._migrate_legacy_model_weights()

        if self.model_weights_path.exists():
            self._load_from_disk()
            return

        self.train_and_save()

    def train_and_save(self) -> None:
        rows = self._load_training_rows()
        x = np.array([self._features_to_vector(row) for row in rows], dtype=float)
        y = np.array([row.price for row in rows], dtype=float)

        x_train, x_test, y_train, y_test = train_test_split(
            x, y, test_size=0.2, random_state=42
        )

        model = LinearRegression()
        model.fit(x_train, y_train)
        predictions = model.predict(x_test)

        metrics = ModelMetrics(
            r2=float(r2_score(y_test, predictions)),
            mae=float(mean_absolute_error(y_test, predictions)),
            rmse=float(np.sqrt(mean_squared_error(y_test, predictions))),
        )
        coefficients = ModelCoefficients(
            square_footage=float(model.coef_[0]),
            bedrooms=float(model.coef_[1]),
            bathrooms=float(model.coef_[2]),
            year_built=float(model.coef_[3]),
            lot_size=float(model.coef_[4]),
            distance_to_city_center=float(model.coef_[5]),
            school_rating=float(model.coef_[6]),
        )

        model_weights = ModelWeights(
            model=model,
            metrics=metrics,
            coefficients=coefficients,
            intercept=float(model.intercept_),
        )

        self.model_weights_path.parent.mkdir(parents=True, exist_ok=True)
        with self.model_weights_path.open("wb") as file:
            pickle.dump(model_weights, file)

        _load_model_weights_cached.cache_clear()
        self._model_weights = model_weights

    def _load_from_disk(self) -> None:
        self._model_weights = _load_model_weights_cached(
            str(self.model_weights_path),
            self.model_weights_path.stat().st_mtime_ns,
        )

    def predict_one(self, payload: HouseFeatures) -> float:
        self.ensure_loaded()
        assert self._model_weights is not None

        x = np.array([self._features_to_vector(payload)], dtype=float)
        prediction = self._model_weights.model.predict(x)[0]
        return float(prediction)

    def predict_batch(self, payloads: list[HouseFeatures]) -> list[float]:
        self.ensure_loaded()
        assert self._model_weights is not None

        x = np.array(
            [self._features_to_vector(payload) for payload in payloads],
            dtype=float,
        )
        predictions = self._model_weights.model.predict(x)
        return [float(value) for value in predictions]

    def model_info(self) -> ModelInfoResponse:
        self.ensure_loaded()
        assert self._model_weights is not None

        return ModelInfoResponse(
            model="LinearRegression",
            features=FEATURE_COLUMNS.copy(),
            intercept=self._model_weights.intercept,
            coefficients=self._model_weights.coefficients,
            metrics=self._model_weights.metrics,
            model_weights_file=str(self.model_weights_path),
        )

    def _load_training_rows(self) -> list[TrainingRow]:
        if not self.dataset_path.exists():
            raise FileNotFoundError(f"Dataset file not found: {self.dataset_path}")

        return list(
            _load_training_rows_cached(
                str(self.dataset_path),
                self.dataset_path.stat().st_mtime_ns,
            )
        )

    def _migrate_legacy_model_weights(self) -> None:
        if self.model_weights_path.exists() or not LEGACY_MODEL_WEIGHTS_DIR.exists():
            return

        legacy_weights_path = LEGACY_MODEL_WEIGHTS_DIR / self.model_weights_path.name
        legacy_pickle_path = LEGACY_MODEL_PATH
        source_path = legacy_weights_path if legacy_weights_path.exists() else legacy_pickle_path

        if not source_path.exists():
            return

        self.model_weights_path.parent.mkdir(parents=True, exist_ok=True)
        source_path.replace(self.model_weights_path)

    @staticmethod
    def _tuple_to_training_row(row: tuple[object, ...]) -> TrainingRow:
        numeric_row = cast(tuple[float, float, float, float, float, float, float, float], row)
        return TrainingRow(
            square_footage=float(numeric_row[0]),
            bedrooms=float(numeric_row[1]),
            bathrooms=float(numeric_row[2]),
            year_built=float(numeric_row[3]),
            lot_size=float(numeric_row[4]),
            distance_to_city_center=float(numeric_row[5]),
            school_rating=float(numeric_row[6]),
            price=float(numeric_row[7]),
        )

    @staticmethod
    def _features_to_vector(features: HouseFeatures) -> list[float]:
        return [
            features.square_footage,
            features.bedrooms,
            features.bathrooms,
            features.year_built,
            features.lot_size,
            features.distance_to_city_center,
            features.school_rating,
        ]
