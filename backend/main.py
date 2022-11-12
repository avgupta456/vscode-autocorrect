from typing import Union

from fastapi import FastAPI, Request, HTTPException

from autocorrect import autocorrect

app = FastAPI()


@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.post("/mask")
async def mask(request: Request):
    body = await request.json()
    if "text" not in body:
        raise HTTPException(status_code=400, detail="Missing text")
    text = body["text"]
    return {"suggestions": autocorrect(text)}