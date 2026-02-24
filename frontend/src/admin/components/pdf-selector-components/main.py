# VERY IMPORTANT NOTE: This project requires Poppler in PATH to work.

from io import BytesIO
from uuid import UUID
from flask import Flask, jsonify, request
import json
import pymupdf
from pydantic import ValidationError, BaseModel
from pdf2image import convert_from_bytes
from PIL import Image

app = Flask(__name__)


def make_thumbnail(file):
    pages = convert_from_bytes(file, dpi=150, first_page=1, last_page=1)

    thumbnail_buffer = BytesIO()
    thumbnail = pages[0]

    thumbnail.save("thumbnail.png", format="PNG")


class BoxModel(BaseModel):
    id: UUID
    page: int
    x: float
    y: float
    width: float
    height: float


@app.route("/api/v1/redact", methods=["POST"])
def redact():
    file = request.files["file"]

    if not file:
        return jsonify({"message": "No file."}), 400

    raw_data = request.form["boxes"]
    if not raw_data:
        return jsonify({"message": "No valid box(es) data."}), 400

    try:
        raw_payload = json.loads(raw_data)
    except json.JSONDecodeError as e:
        return jsonify({"error": "Invalid JSON.", "message": str(e)}), 400

    validated_boxes = []
    try:
        for box in raw_payload:
            validated_boxes.append(BoxModel(**box))
    except ValidationError as e:
        return jsonify({"error": "Invalid JSON.", "details": e.errors()}), 400

    pdf_bytes = file.read()

    make_thumbnail(pdf_bytes)

    try:
        doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    except RuntimeError as e:
        return jsonify({"error": "Cannot open file.", "details": e}), 400

    for page in doc:
        page_width = page.rect.width
        page_height = page.rect.height

        for box in validated_boxes:
            if page.number != box.page - 1:
                continue

            x1 = box.x * page_width
            y1 = box.y * page_height
            x2 = (box.width * page_width) + x1
            y2 = (box.height * page_height) + y1

            redactBox = pymupdf.Rect(x1, y1, x2, y2)
            page.add_redact_annot(redactBox, fill=(0, 1, 0))

        page.apply_redactions(graphics=0)

    doc.save("output.pdf")
    doc.close()

    return jsonify({"message": "Successfully redacted your PDF."})


if __name__ == "__main__":
    app.run(debug=True)