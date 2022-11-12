from typing import Union

from fastapi import FastAPI, Request, HTTPException

from autocorrect import autocorrect

app = FastAPI()


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/test_mask")
async def test_mask():
    text = "if (x is not None) or (x > 0)"
    line = 0
    return {"suggestions": autocorrect(text, line)}

@app.post("/mask")
async def mask(request: Request):
    body = await request.json()
    if "text" not in body:
        raise HTTPException(status_code=400, detail="Missing text")
    text = body["text"]
    if "line" not in body:
        raise HTTPException(status_code=400, detail="Missing line")
    line = body["line"]
    return {"suggestions": autocorrect(text, line)}