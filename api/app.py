from fastapi import FastAPI
from fastapi.responses import Response
from pydantic import BaseModel
from rembg import remove, new_session
import uvicorn

app = FastAPI()
session = new_session("u2netp")

class ImageReq(BaseModel):
    path: str

@app.post("/process")
def process_image(req: ImageReq):
    with open(req.path, "rb") as f:
        output_data = remove(f.read(), session=session)
    return Response(content=output_data, media_type="image/png")

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
