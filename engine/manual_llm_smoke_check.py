from langchain_openai import ChatOpenAI

try:
    from .config import EngineConfig
except ImportError:
    from config import EngineConfig


def main() -> None:
    """Make one real external request to verify local AI configuration."""
    config = EngineConfig.from_env()
    llm = ChatOpenAI(
        model=config.model,
        base_url=config.base_url,
        api_key=config.api_key,
        temperature=0,
        max_tokens=256,
        max_retries=0,
        timeout=30.0,
    )
    response = llm.invoke(
        "Reply with 'MedOrch AI configuration is valid.' and nothing else."
    )
    print(response.content)


if __name__ == "__main__":
    main()
