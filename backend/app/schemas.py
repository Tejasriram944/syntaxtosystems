import base64
import binascii
from datetime import datetime
from io import BytesIO
from typing import Literal
from uuid import UUID

from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

MAX_VISUAL_FLOW_BYTES = 5 * 1024 * 1024
MAX_VISUAL_FLOW_DIMENSION = 4096


class ConceptSection(BaseModel):
    title: str = Field(min_length=1, max_length=32)
    icon: Literal["grid", "braces", "layers", "network", "database"] = "grid"
    description: str = Field(min_length=1, max_length=140)


class CoreBullet(BaseModel):
    text: str = Field(min_length=1, max_length=100)
    highlight: str = Field(default="", max_length=32)
    accent: Literal["lime", "pink"] = "lime"


class CoreSection(BaseModel):
    bullets: list[CoreBullet] = Field(min_length=2, max_length=4)
    keywords: list[str] = Field(min_length=1, max_length=5)

    @model_validator(mode="before")
    @classmethod
    def normalize_legacy_core(cls, value):
        if not isinstance(value, dict):
            return value
        data = dict(value)
        bullets = data.get("bullets", [])
        if bullets and isinstance(bullets[0], str):
            data["bullets"] = [
                {"text": bullet, "highlight": "", "accent": "lime"}
                for bullet in bullets
            ]
        if "keywords" not in data:
            nodes = data.get("visual_nodes", [])
            visual_title = str(data.get("visual_title", ""))
            details = [str(node.get("detail", "")) for node in nodes if isinstance(node, dict)]
            candidates = [
                *(str(node.get("label", "")) for node in nodes if isinstance(node, dict)),
                visual_title,
                *details,
            ]
            keywords: list[str] = []
            seen: set[str] = set()
            for candidate in candidates:
                keyword = candidate.strip()[:18]
                normalized = keyword.lower()
                if keyword and normalized not in seen:
                    keywords.append(keyword)
                    seen.add(normalized)
                if len(keywords) == 5:
                    break
            data["keywords"] = keywords or [""]
        return data

    @field_validator("bullets")
    @classmethod
    def validate_bullets(cls, values: list[CoreBullet]) -> list[CoreBullet]:
        validate_unique_strings([bullet.text for bullet in values], 100)
        return values

    @field_validator("keywords")
    @classmethod
    def validate_keywords(cls, values: list[str]) -> list[str]:
        nonempty = [value for value in values if value.strip()]
        validate_unique_strings(nonempty, 18)
        return values


class ProofSection(BaseModel):
    code: str = Field(min_length=1, max_length=500)

    @field_validator("code")
    @classmethod
    def validate_code(cls, value: str) -> str:
        if len(value.splitlines()) > 12:
            raise ValueError("Code proof must be 12 lines or fewer")
        return value


class VisualFlowImage(BaseModel):
    filename: str = Field(min_length=1, max_length=160)
    media_type: Literal["image/png", "image/jpeg", "image/webp"]
    data_url: str = Field(min_length=32, max_length=7_000_000)
    width: int = Field(ge=1, le=MAX_VISUAL_FLOW_DIMENSION)
    height: int = Field(ge=1, le=MAX_VISUAL_FLOW_DIMENSION)

    @field_validator("filename")
    @classmethod
    def validate_filename(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Image filename cannot be blank")
        return value

    @model_validator(mode="after")
    def validate_image_data(self):
        expected_prefix = f"data:{self.media_type};base64,"
        if not self.data_url.startswith(expected_prefix):
            raise ValueError("Image data URL does not match its media type")
        try:
            raw = base64.b64decode(self.data_url[len(expected_prefix):], validate=True)
        except (binascii.Error, ValueError) as exc:
            raise ValueError("Visual Flow image contains invalid base64 data") from exc
        if len(raw) > MAX_VISUAL_FLOW_BYTES:
            raise ValueError("Visual Flow image must be 5 MB or smaller")
        expected_format = {"image/png": "PNG", "image/jpeg": "JPEG", "image/webp": "WEBP"}[self.media_type]
        try:
            with Image.open(BytesIO(raw)) as image:
                actual_size = image.size
                actual_format = image.format
                image.verify()
        except (UnidentifiedImageError, OSError, ValueError) as exc:
            raise ValueError("Visual Flow image is corrupted or unsupported") from exc
        if actual_format != expected_format:
            raise ValueError("Visual Flow image bytes do not match the selected format")
        if actual_size != (self.width, self.height):
            raise ValueError("Visual Flow image dimensions do not match the file")
        if max(actual_size) > MAX_VISUAL_FLOW_DIMENSION:
            raise ValueError("Visual Flow image dimensions cannot exceed 4096 pixels")
        return self


class VisualFlowSection(BaseModel):
    image: VisualFlowImage | None = None


class SectionHeights(BaseModel):
    concept: int = Field(ge=180)
    core: int = Field(ge=280)
    proof: int = Field(ge=260)
    flow: int = Field(ge=300)

    @model_validator(mode="after")
    def validate_budget(self):
        if self.concept + self.core + self.proof + self.flow != 1635:
            raise ValueError("Section heights must total 1635 pixels")
        return self

class PosterContent(BaseModel):
    level: str = Field(min_length=1, max_length=18)
    eyebrow: str = Field(min_length=1, max_length=32)
    section_heights: SectionHeights = Field(
        default_factory=lambda: SectionHeights(concept=235, core=390, proof=610, flow=400)
    )
    concept: ConceptSection
    core: CoreSection
    proof: ProofSection
    visual_flow: VisualFlowSection = Field(default_factory=VisualFlowSection)

    @model_validator(mode="before")
    @classmethod
    def normalize_legacy_visual_flow(cls, value):
        if not isinstance(value, dict):
            return value
        data = dict(value)
        data.setdefault("visual_flow", {"image": None})
        return data

    @model_validator(mode="after")
    def reject_repeated_explanations(self):
        prose = [
            *(bullet.text for bullet in self.core.bullets),
        ]
        normalized = [" ".join(value.lower().split()).rstrip(".!?") for value in prose]
        if len(normalized) != len(set(normalized)):
            raise ValueError("Repeated bullets or flow details are not allowed")
        return self


def validate_unique_strings(values: list[str], max_length: int) -> list[str]:
    normalized: set[str] = set()
    for value in values:
        if not value.strip():
            raise ValueError("Items cannot be blank")
        if len(value) > max_length:
            raise ValueError(f"Items must be {max_length} characters or fewer")
        key = " ".join(value.lower().split()).rstrip(".!?")
        if key in normalized:
            raise ValueError("Duplicate items are not allowed")
        normalized.add(key)
    return values


class PosterCreate(BaseModel):
    title: str = Field(min_length=1, max_length=80)
    content: PosterContent

    @model_validator(mode="after")
    def validate_complete_core(self):
        ensure_core_is_complete(self.content.core)
        return self


class PosterUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=80)
    content: PosterContent
    revision: int = Field(ge=1)

    @model_validator(mode="after")
    def validate_complete_core(self):
        ensure_core_is_complete(self.content.core)
        return self


def ensure_core_is_complete(core: CoreSection) -> None:
    if any(not keyword.strip() for keyword in core.keywords):
        raise ValueError("Core Idea keywords cannot be blank")


class PosterResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    content: PosterContent
    revision: int
    created_at: datetime
    updated_at: datetime


class PosterListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    revision: int
    created_at: datetime
    updated_at: datetime


class VideoExportJob(BaseModel):
    job_id: UUID
    status: Literal["queued", "rendering", "complete", "failed"]
    progress: float = Field(ge=0, le=1)
    error: str | None = None
    download_url: str | None = None


class VideoExportCreate(BaseModel):
    image_data_url: str = Field(min_length=100, max_length=15_000_000)

    @field_validator("image_data_url")
    @classmethod
    def validate_png(cls, value: str) -> str:
        if not value.startswith("data:image/png;base64,"):
            raise ValueError("A PNG data URL is required")
        return value
