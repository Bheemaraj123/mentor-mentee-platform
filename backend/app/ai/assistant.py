"""AI Assistant service for chat-based mentorship guidance.

Reuses the existing configured Groq provider and service
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
    """Check if a key is a placeholder/default value."""
    return not key or key.strip().lower() in (
        "", "your_openai_api_key_here", "sk-your-key-here",
        "your_groq_api_key_here", "gsk_your_key_here"
    )


def _get_groq_client():
    """Return a configured Groq OpenAI-compatible client."""
    return OpenAI(
        api_key=settings.GROQ_API_KEY,
        base_url="https://api.groq.com/openai/v1"
    )


def _build_context_summary(context: Dict[str, Any]) -> str:
    """Build a compact summary of available application data.

    The summary is intentionally brief and factual: it is supporting
    information for the conversation, not content that must always be
    displayed. The model decides whether to use it based on the user's
    actual question.
    """
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


def _build_system_prompt(context_summary: str) -> str:
    """Build the system prompt that defines conversational chatbot behaviour."""
    return (
        "You are the Men.AI Assistant, a natural, intelligent conversational "
        "chatbot for a mentor-mentee platform. You talk to the user like a "
        "helpful colleague: warm, clear, and direct.\n\n"
        "HOW TO RESPOND:\n"
        "- Answer the user's LATEST message. That is your only job.\n"
        "- Keep replies short and conversational by default. A few sentences "
        "is usually enough.\n"
        "- Use the conversation history to understand follow-up questions, "
        "but do not repeat it back unless asked.\n"
        "- Greet naturally on first contact (e.g. \"Hey! How can I help you today?\").\n"
        "- If the user's request is unclear, ask a short clarifying question "
        "instead of guessing or inventing information.\n"
        "- Only mention meetings, reports, tasks, or mentees when they are "
        "directly relevant to what the user asked. Do not list them "
        "unsolicited.\n"
        "- When the user explicitly asks for a summary, list, report, "
        "recommendation, or comparison, you may give a fuller answer using "
        "the available data.\n"
        "- Never fabricate meetings, reports, tasks, mentee activity, or any "
        "other application data. If the data is not in the context, say so "
        "rather than making something up.\n\n"
        "CONTEXT AVALIABLE TO YOU:\n"
        f"{context_summary}"
    )


def generate_assistant_response(
    user_message: str,
    context: Dict[str, Any],
    conversation_history: Optional[List[Dict[str, str]]] = None
) -> Dict[str, Any]:
    """Generate an AI assistant response using the Groq LLM provider.

    Raises RuntimeError if Groq is not properly configured.
    """
    if not OPENAI_AVAILABLE:
        raise RuntimeError(
            "OpenAI Python package is not installed. Cannot initialize Groq client."
        )

    api_key = settings.GROQ_API_KEY or ""
    if not api_key or _is_placeholder(api_key):
        raise RuntimeError(
            "AI assistant is not configured. Set a valid GROQ_API_KEY "
            "in the backend environment. LLM_PROVIDER should be 'groq'. "
            "No simulated responses are generated."
        )

    client = _get_groq_client()

    # Build a compact context summary for the assistant.
    context_summary = _build_context_summary(context)

    system_prompt = _build_system_prompt(context_summary)

    # The user's latest message is the primary instruction. Context is
    # supporting information, not content to be dumped into every reply.
    user_prompt = user_message

    messages = [{"role": "system", "content": system_prompt}]
    if conversation_history:
        for turn in conversation_history[-10:]:
            messages.append({"role": turn.get("role", "user"), "content": turn.get("content", "")})
    messages.append({"role": "user", "content": user_prompt})

    model = settings.LLM_MODEL or "llama-3.3-70b-versatile"

    try:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.4,
            max_tokens=2000,
        )

        content = response.choices[0].message.content or ""
        return {
            "response": content,
            "model": model,
            "usage": response.usage.model_dump() if response.usage else None,
        }

    except Exception as e:
        raise RuntimeError(f"AI assistant request failed: {e}") from e