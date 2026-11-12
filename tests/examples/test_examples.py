"""One test per code block in the chapters. See harness.py for how blocks are checked.

Run with:  .venv/bin/python -m pytest tests/examples
"""
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent))
import harness  # noqa: E402

CASES = [(c, i) for c in harness.chapter_ids() for i in range(1, len(harness.blocks(c)) + 1)]


@pytest.mark.parametrize("chapter", harness.chapter_ids())
def test_every_code_block_is_accounted_for(chapter):
    assert harness.problems_with_spec(chapter) == []


@pytest.mark.parametrize("chapter,block", CASES, ids=[f"{c}#{i}" for c, i in CASES])
def test_example(chapter, block):
    if harness.problems_with_spec(chapter):
        pytest.fail("examples.yaml does not match the chapter; see test_every_code_block_is_accounted_for")
    result = harness.session(chapter).result(block)
    if isinstance(result, harness.Skip):
        pytest.skip(str(result))
    lang, code = harness.blocks(chapter)[block - 1]
    assert result is None, f"\n{chapter} block {block} ({lang}):\n{code}\n\n{result}"
