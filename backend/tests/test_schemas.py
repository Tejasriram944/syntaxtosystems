import pytest
from pydantic import ValidationError

from app.schemas import PosterContent
from app.seed_data import HASH_TABLE_CONTENT


def test_seed_content_is_valid():
    parsed = PosterContent.model_validate(HASH_TABLE_CONTENT)
    assert parsed.concept.title == "Hash Table"
    assert parsed.core.keywords == ["KEY", "HASH", "INDEX", "LOOKUP"]
    assert len(parsed.flow) == 4


def test_duplicate_bullets_are_rejected():
    content = {**HASH_TABLE_CONTENT, "core": {**HASH_TABLE_CONTENT["core"]}}
    content["core"]["bullets"] = ["Same point.", "same point"]
    with pytest.raises(ValidationError):
        PosterContent.model_validate(content)


def test_code_is_limited_to_twelve_lines():
    content = {**HASH_TABLE_CONTENT, "proof": {**HASH_TABLE_CONTENT["proof"]}}
    content["proof"]["code"] = "\n".join(["pass"] * 13)
    with pytest.raises(ValidationError):
        PosterContent.model_validate(content)


def test_legacy_core_content_is_normalized_without_new_claims():
    content = {**HASH_TABLE_CONTENT, "core": {
        "bullets": ["First existing point.", "Second existing point."],
        "visual_title": "OLD VISUAL",
        "visual_nodes": [
            {"label": "First", "detail": "Existing detail"},
            {"label": "Second", "detail": "Other detail"},
        ],
    }}
    parsed = PosterContent.model_validate(content)
    assert parsed.core.bullets[0].text == "First existing point."
    assert parsed.core.bullets[0].highlight == ""
    assert parsed.core.keywords == ["First", "Second", "OLD VISUAL", "Existing detail", "Other detail"]


def test_duplicate_core_keywords_are_rejected():
    content = {**HASH_TABLE_CONTENT, "core": {**HASH_TABLE_CONTENT["core"]}}
    content["core"]["keywords"] = ["KEY", "HASH", "INDEX", "key"]
    with pytest.raises(ValidationError):
        PosterContent.model_validate(content)


@pytest.mark.parametrize("keywords", [["ONE"], ["ONE", "TWO", "THREE", "FOUR", "FIVE"]])
def test_one_to_five_core_keywords_are_valid(keywords):
    content = {**HASH_TABLE_CONTENT, "core": {**HASH_TABLE_CONTENT["core"], "keywords": keywords}}
    assert PosterContent.model_validate(content).core.keywords == keywords


@pytest.mark.parametrize("keywords", [[], ["1", "2", "3", "4", "5", "6"]])
def test_core_keyword_limits_are_enforced(keywords):
    content = {**HASH_TABLE_CONTENT, "core": {**HASH_TABLE_CONTENT["core"], "keywords": keywords}}
    with pytest.raises(ValidationError):
        PosterContent.model_validate(content)


def test_section_height_budget_and_minimums_are_enforced():
    content = {**HASH_TABLE_CONTENT, "section_heights": {"concept": 179, "core": 391, "proof": 610, "flow": 455}}
    with pytest.raises(ValidationError):
        PosterContent.model_validate(content)


def test_legacy_content_receives_default_section_heights():
    content = {key: value for key, value in HASH_TABLE_CONTENT.items() if key != "section_heights"}
    assert PosterContent.model_validate(content).section_heights.model_dump() == {"concept": 235, "core": 390, "proof": 610, "flow": 400}


def test_legacy_proof_visual_fields_are_dropped():
    content = {**HASH_TABLE_CONTENT, "proof": {
        **HASH_TABLE_CONTENT["proof"],
        "visual_title": "Legacy snapshot",
        "visual_nodes": [{"label": "0", "detail": "Old value"}],
    }}
    parsed = PosterContent.model_validate(content)
    proof = parsed.model_dump()["proof"]
    assert "visual_title" not in proof
    assert "visual_nodes" not in proof


def test_removed_core_visual_and_proof_explanation_fields_are_dropped():
    parsed = PosterContent.model_validate(HASH_TABLE_CONTENT | {
        "core": HASH_TABLE_CONTENT["core"] | {
            "visual": {"style": "code", "top_label": "old", "bottom_label": "old"},
        },
        "proof": HASH_TABLE_CONTENT["proof"] | {"bullets": ["Old explanation"]},
    })
    dumped = parsed.model_dump()
    assert "visual" not in dumped["core"]
    assert "bullets" not in dumped["proof"]
