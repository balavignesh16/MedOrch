from openai import OpenAI
import time

client = OpenAI(
  base_url = "https://integrate.api.nvidia.com/v1",
  api_key = "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",
  timeout=15.0
)

try:
    print("Calling NVIDIA API...")
    start = time.time()
    completion = client.chat.completions.create(
        model="deepseek-ai/deepseek-coder-33b-instruct",
        messages=[{"role": "user", "content": "Hello"}],
        max_tokens=10
    )
    print("Response:", completion.choices[0].message.content)
except Exception as e:
    print("Error:", e)
finally:
    print(f"Time taken: {time.time() - start:.2f}s")
