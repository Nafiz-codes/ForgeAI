from fastapi import FastAPI

# Create the FastAPI application
app = FastAPI()

# This is the home route
@app.get("/")
def home():
    return {
        "status": "running"
    }