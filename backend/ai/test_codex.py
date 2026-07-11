from ai_client import AIClient

profile = {
    "dataset": {
        "rows": 1000,
        "columns": 5
    }
}

client = AIClient()

answer = client.ask(profile)

print(answer)
