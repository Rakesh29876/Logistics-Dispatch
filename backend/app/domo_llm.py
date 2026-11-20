import httpx
from langchain_core.language_models.llms import LLM
from .config import settings

class DomoTextLLM(LLM):
    temperature: float = 0.1
    max_tokens: int = 3000

    @property
    def _llm_type(self) -> str:
        return "domo-text-generation"

    def _call(self, prompt: str, stop=None, run_manager=None, **kwargs) -> str:
        if not settings.domo_token:
            raise RuntimeError("DOMO_TOKEN is missing. Add your Domo developer token to backend/.env.")
        url = f"https://{settings.domo_subdomain}.domo.com/api/ai/v1/text/generation"
        payload = {"input": prompt, "temperature": self.temperature, "maxTokens": self.max_tokens}
        if settings.domo_model:
            payload["model"] = settings.domo_model
        response = httpx.post(url, json=payload, timeout=90,
            headers={"X-DOMO-Developer-Token": settings.domo_token,
                     "Content-Type": "application/json"})
        response.raise_for_status()
        output = response.json().get("output", "")
        for token in stop or []:
            output = output.split(token)[0]
        return output
