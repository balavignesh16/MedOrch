import json
import re
from openai import OpenAI
from apps.ai_engine.tools.sql_executor import execute_sql, get_database_schema

# Initialize DeepSeek Client
client = OpenAI(
  base_url = "https://integrate.api.nvidia.com/v1",
  api_key = "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",
  timeout=180.0
)

def _base_specialist(state: dict, role: str) -> dict:
    """
    Uses the DeepSeek LLM to generate SQL based on the prompt, executes it, and summarizes the results.
    """
    prompt = state.get("original_prompt", "")
    
    # 1. Ask LLM to generate SQL
    schema = get_database_schema()
    system_prompt_sql = f"""You are a PostgreSQL expert acting as a {role} specialist in a healthcare system.
Your job is to generate a SQL query to answer the user's question.
Here is the database schema:
{schema}

IMPORTANT RULES:
- ONLY return the raw SQL query. Do not use markdown blocks (```sql ... ```).
- Just output the SELECT statement directly.
- The query must be safe (read-only SELECT).
"""
    
    print("Starting LLM SQL generation...")
    try:
        completion = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {"role": "system", "content": system_prompt_sql},
                {"role": "user", "content": prompt}
            ],
            temperature=1,
            top_p=1,
            max_tokens=4096,
            stream=False
        )
        print("Received LLM response for SQL.")
        reasoning = getattr(completion.choices[0].message, "reasoning_content", None)
        if reasoning:
            print("Reasoning for SQL:", reasoning)
        content = completion.choices[0].message.content
        sql = content.strip() if content else ""
        
        # Clean up markdown if the LLM still used it
        if sql.startswith("```sql"):
            sql = sql[6:]
        if sql.startswith("```"):
            sql = sql[3:]
        if sql.endswith("```"):
            sql = sql[:-3]
        sql = sql.strip()
        
    except Exception as e:
        sql = "SELECT 1 as error, 'Failed to generate SQL from LLM' as message;"
        print(f"LLM SQL Generation Error: {e}")

    # 2. Execute SQL
    print(f"Executing SQL: {sql}")
    results = execute_sql(sql)
    print("SQL execution complete.")
    
    # 3. Ask LLM to summarize results
    print("Starting LLM Summary generation...")
    results_json = json.dumps(results, default=str)
    system_prompt_summary = f"""You are a {role} specialist in a healthcare system.
You received a question from the user: "{prompt}"
The database returned the following results:
{results_json}

Please provide a short, concise, and professional textual summary of these results to present to a hospital administrator. Do not include internal details like the SQL query or database schema. Just give the answer.
"""
    
    try:
        completion_summary = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {"role": "system", "content": system_prompt_summary}
            ],
            temperature=1,
            top_p=1,
            max_tokens=4096,
            stream=False
        )
        reasoning = getattr(completion_summary.choices[0].message, "reasoning_content", None)
        if reasoning:
            print("Reasoning for Summary:", reasoning)
        content = completion_summary.choices[0].message.content
        textual_summary = content.strip() if content else ""
    except Exception as e:
        textual_summary = f"{role.capitalize()} Agent processed the query. Found {len(results)} records (Summary Generation Failed)."
        print(f"LLM Summary Generation Error: {e}")
    
    return {
        "sql_query_drafts": [sql],
        "raw_db_results": results,
        "textual_summary": textual_summary,
        "reasoning": reasoning,
        "chart_data": results
    }

def predictive_node(state: dict) -> dict:
    return _base_specialist(state, "predictive")

def resource_node(state: dict) -> dict:
    return _base_specialist(state, "resource")

def health_econ_node(state: dict) -> dict:
    return _base_specialist(state, "health_econ")
