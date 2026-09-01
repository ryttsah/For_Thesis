import asyncio
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.api.deps import require_role
from app.core.config import get_settings
from app.ml.predictor import get_model_status, predict_upload_file
from app.schemas.predict import PredictBatchItem, PredictBatchResponse, PredictResponse

router = APIRouter(prefix="/predict", tags=["predict"])

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/octet-stream",
}
MAX_BATCH_FILES = 3


def _paths() -> tuple[Path, Path]:
    settings = get_settings()
    return settings.resolved_ml_model_path(), settings.resolved_ml_label_config_path()


def _response_from_result(result) -> PredictResponse:
    return PredictResponse(
        pest=result.pest,
        label=result.label,
        confidence=result.confidence,
        uncertain=result.uncertain,
        predictions=result.predictions,
        thresholded_labels=result.thresholded_labels,
        top_guesses=result.top_guesses,
        message=result.message,
    )


@router.get("/status")
def predict_status() -> dict:
    model_path, config_path = _paths()
    return get_model_status(model_path, config_path)


@router.post("", response_model=PredictResponse)
async def predict_leaf_image(
    file: Annotated[UploadFile, File(description="Coconut leaf photo (JPG/PNG)")],
    _role: Annotated[str, Depends(require_role("farmer", "officer", "admin"))],
) -> PredictResponse:
    settings = get_settings()
    model_path, config_path = _paths()

    if not model_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"ML model not found at {model_path}. Check ML_MODEL_PATH in .env.",
        )

    content_type = (file.content_type or "").lower()
    if content_type and content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Upload a JPG or PNG image.",
        )

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file upload.")

    try:
        result = await asyncio.wait_for(
            asyncio.to_thread(
                predict_upload_file,
                raw,
                model_path=model_path,
                config_path=config_path,
                max_bytes=settings.ml_max_upload_bytes,
            ),
            timeout=settings.ml_predict_timeout_seconds,
        )
    except TimeoutError as exc:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Analysis took too long. Try again with one clear coconut leaf photo.",
        ) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    return _response_from_result(result)


@router.post("/batch", response_model=PredictBatchResponse)
async def predict_leaf_images(
    files: Annotated[list[UploadFile], File(description="Up to 3 coconut leaf photos (JPG/PNG)")],
    _role: Annotated[str, Depends(require_role("farmer", "officer", "admin"))],
) -> PredictBatchResponse:
    settings = get_settings()
    model_path, config_path = _paths()

    if not files:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Upload at least one image.")
    if len(files) > MAX_BATCH_FILES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Upload up to {MAX_BATCH_FILES} photos only.",
        )
    if not model_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"ML model not found at {model_path}. Check ML_MODEL_PATH in .env.",
        )

    items: list[PredictBatchItem] = []
    for file in files:
        content_type = (file.content_type or "").lower()
        if content_type and content_type not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{file.filename or 'Image'} is not a JPG or PNG image.",
            )

        raw = await file.read()
        if not raw:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file upload.")

        try:
            result = await asyncio.wait_for(
                asyncio.to_thread(
                    predict_upload_file,
                    raw,
                    model_path=model_path,
                    config_path=config_path,
                    max_bytes=settings.ml_max_upload_bytes,
                ),
                timeout=settings.ml_predict_timeout_seconds,
            )
        except TimeoutError as exc:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Analysis took too long. Try again with one clear coconut leaf photo.",
            ) from exc
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
        except RuntimeError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=str(exc),
            ) from exc

        items.append(PredictBatchItem(file_name=file.filename or "leaf-photo", result=_response_from_result(result)))

    return PredictBatchResponse(results=items)
