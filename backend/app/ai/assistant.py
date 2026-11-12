"""AI Assistant service for chat-based mentorship guidance.

Reuses the existing configured OpenAI-compatible provider and service
architecture used by the report generator. No mock or simulated
responses are generated.
"""

import os
import json
from typing import Dict, Any, List, Optional
from app.core.config import settings

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False


def _is_placeholder(key: str) -> bool:
    return not key or key.strip().lower() in (
        "", "your_openai_api_key_here", "sk-your-key-here"
    )


def _get_client():
    """Return a configured OpenAI-compatible client."""
    return OpenAI(
        api_key=settings.OPENAI_API_KEY,
        base_url=os.getenv("OPENAI_BASE_URL")
    )


def generate_assistant_response(
    user_message: str,
    context: Dict[str, Any],
    conversation_history: Optional[List[Dict[str, str]]] = None
) -> Dict[str, Any]:
    """Generate an AI assistant response using the configured LLM provider.

    Raises RuntimeError if no real provider is configured.
    """
    api_key = settings.OPENAI_API_KEY or ""
    if not OPENAI_AVAILABLE or not api_key or _is_placeholder(api_key):
        raise RuntimeError(
            "AI assistant is not configured. Set a valid OPENAI_API_KEY "
            "(and optionally OPENAI_BASE_URL, LLM_MODEL) in the backend "
            "environment. No simulated responses are generated."
        )

    client = _get_client()

    # Build context summary for the assistant
    context_summary = _build_context_summary(context)

    system_prompt = (
        "You are the Men.AI Assistant, an expert academic mentor and career "
        "coach. You help mentors understand their mentees' progress, prepare "
        "for sessions, and make data-informed decisions. "
        "Be concise, specific, and actionable. Reference actual data when "
        "provided. Do not invent facts that are not in the context."
    )

    user_prompt = f"""Context about the current user's mentorship practice:
{context_summary}

User question: {user_message}

Provide a helpful, specific response based on the context above."""

    messages = [{"role": "system", "content": system_prompt}]
    if conversation_history:
        for turn in conversation_history[-10:]:
            messages.append({"role": turn.get("role", "user"), "content": turn.get("content", "")})
    messages.append({"role": "user", "content": user_prompt})

    try:
        response = client.chat.completions.create(
            model=os.getenv("LLM_MODEL", "gpt-4o-mini"),
            messages=messages,
            temperature=0.4,
            max_tokens=2000,
        )

        content = response.choices[0].message.content or ""
        return {
            "response": content,
            "model": os.getenv("LLM_MODEL", "gpt-4o-mini"),
            "usage": response.usage.model_dump() if response.usage else None,
        }

    except Exception as e:
        raise RuntimeError(f"AI assistant request failed: {e}") from e


def _build_context_summary(context: Dict[str, Any]) -> str:
    """Build a human-readable summary of available context data."""
    parts = []

    user = context.get("user")
    if user:
        parts.append(
            f"Current user: {user.get('full_name', 'Unknown')} "
            f"({user.get('role', 'unknown')})"
        )

    mentees = context.get("mentees", [])
    if mentees:
        mentee_lines = []
        for m in mentees:
            mentee_lines.append(
                f"  - {m.get('full_name', 'Unknown')} "
                f"(ID: {m.get('id')}, assigned: {m.get('assigned_at', 'N/A')})"
            )
        parts.append("Assigned mentees:\n" + "\n".join(mentee_lines))

    meetings = context.get("meetings", [])
    if meetings:
        meeting_lines = []
        for m in meetings[:10]:
            meeting_lines.append(
                f"  - {m.get('meeting_title', 'Untitled')} "
                f"({m.get('meeting_date', 'N/A')}, status: {m.get('processing_status', 'N/A')})"
            )
        parts.append("Recent meetings:\n" + "\n".join(meeting_lines))

    reports = context.get("reports", [])
    if reports:
        report_lines = []
        for r in reports[:10]:
            report_lines.append(
                f"  - Report #{r.get('id')}: "
                f"{r.get('report_content', {}).get('meeting_details', {}).get('meeting_title', 'Untitled')} "
                f"(status: {r.get('status', 'N/A')})"
            )
        parts.append("Reports:\n" + "\n".join(report_lines))

    tasks = context.get("tasks", [])
    if tasks:
        task_lines = []
        for t in tasks[:10]:
            task_lines.append(
                f"  - {t.get('title', 'Untitled')} "
                f"(status: {t.get('status', 'N/A')}, priority: {t.get('priority', 'N/A')})"
            )
        parts.append("Action items:\n" + "\n".join(task_lines))

    if not parts:
        return "No additional context is available."

    return "\n\n".join(parts)