from pydantic import BaseModel, Field


class PredictResponse(BaseModel):
    pest: str = Field(description="Frontend pest key: healthy, yellowing, scale insect, rhino beetle")
    label: str
    confidence: float = Field(description="Max class probability (0-100)")
    uncertain: bool
    predictions: dict[str, float]
    thresholded_labels: list[str]
    top_guesses: list[str]
    message: str | None = None


class PredictBatchItem(BaseModel):
    file_name: str
    result: PredictResponse


class PredictBatchResponse(BaseModel):
    results: list[PredictBatchItem]
