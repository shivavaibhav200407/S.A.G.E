import sys
from typing import Dict, Any, List, Optional
from tools import search_web
from llm_client import call_llm

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

class ResearchAgent:
    """
    Research Agent for SAGE:
    Autonomous agent that searches the web for official documentation, specifications,
    and cutting-edge examples, synthesizing them into verified, cited learning materials.
    """

    def __init__(self, max_results: int = 3):
        self.max_results = max_results

    def research(self, topic_or_query: str, domain: Optional[str] = None) -> Dict[str, Any]:
        """
        Executes a targeted search query and synthesizes authoritative findings.
        """
        # Optimize query for technical documentation
        search_term = topic_or_query
        if domain:
            search_term = f"{domain} {topic_or_query} documentation official"

        results = search_web(search_term, max_results=self.max_results)

        # Format retrieved snippets for LLM synthesis
        snippets_text = ""
        citations = []
        for idx, res in enumerate(results, 1):
            title = res.get("title", "Reference")
            href = res.get("href", "")
            snippet = res.get("snippet", "")
            if href:
                citations.append({"title": title, "url": href})
            snippets_text += f"\n[{idx}] {title} ({href}):\n{snippet}\n"

        system_prompt = (
            "You are the SAGE External Research Agent.\n"
            "Your job is to analyze real-time search results, extract key technical definitions, "
            "best practices, and authoritative specifications, and synthesize a concise, structured research briefing.\n"
            "Guidelines:\n"
            "- Be technically precise and factual.\n"
            "- Include exact class names, methods, or syntax if applicable.\n"
            "- Reference source numbers like [1], [2] when stating facts.\n"
            "- If search results are empty or offline, provide a well-structured foundational overview."
        )

        user_prompt = (
            f"Target Topic / Query: {topic_or_query}\n"
            f"Domain: {domain or 'General Programming'}\n\n"
            f"Retrieved Web Documentation:\n{snippets_text}\n\n"
            "Please synthesize this into a structured, pedagogical research briefing with key takeaways."
        )

        try:
            summary = call_llm(prompt=user_prompt, system_prompt=system_prompt)
        except Exception as e:
            summary = f"Research synthesis could not be completed via LLM: {e}"

        return {
            "query": topic_or_query,
            "domain": domain,
            "raw_results": results,
            "citations": citations,
            "synthesized_summary": summary
        }

def run_research_agent(query: str, domain: Optional[str] = None) -> Dict[str, Any]:
    """Helper functional wrapper for the Research Agent."""
    agent = ResearchAgent()
    return agent.research(query, domain=domain)
