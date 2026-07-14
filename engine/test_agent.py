import os
from langchain_openai import ChatOpenAI
from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits import create_sql_agent

os.environ["OPENAI_API_KEY"] = "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"

# NOTE: the user mentioned openai/gpt-oss-20b which is weird, maybe they meant something else, 
# but I'll test with meta/llama-3.1-70b-instruct to see if standard models work.
llm = ChatOpenAI(
    model="meta/llama-3.1-70b-instruct",
    base_url="https://integrate.api.nvidia.com/v1",
    temperature=0,
    max_tokens=1024
)
db = SQLDatabase.from_uri("sqlite:///../database/medorch.db")

try:
    agent_executor = create_sql_agent(llm, db=db, agent_type="openai-tools", verbose=True, return_intermediate_steps=True)
except ValueError:
    agent_executor = create_sql_agent(llm, db=db, verbose=True, return_intermediate_steps=True)

print("Invoking...")
res = agent_executor.invoke({"input": "Cross-reference active medications for contraindications."})
print(res["output"])
