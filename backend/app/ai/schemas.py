from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import date


class ActionItem(BaseModel):
    """Individual action item extracted from meeting"""
    task: str = Field(..., description="Brief title of the action item")
    description: str = Field(..., description="Detailed description of what needs to be done")
    responsible: str = Field(..., description="Person responsible for this action")
    deadline: Optional[date] = Field(None, description="Deadline for completion")


class MeetingDetails(BaseModel):
    """Basic meeting metadata"""
    meeting_title: str
    date: str
    mentor: str
    mentee: str


class StructuredReport(BaseModel):
    """Complete structured report output schema for LLM"""
    meeting_details: MeetingDetails
    meeting_summary: str = Field(..., description="2-3 sentence summary of the meeting")
    discussion_points: List[str] = Field(..., description="Key topics discussed during the meeting")
    academic_performance: str = Field(..., description="Assessment of mentee's academic performance")
    strengths: List[str] = Field(default_factory=list, description="Identified strengths of the mentee")
    weaknesses_or_improvements: List[str] = Field(default_factory=list, description="Areas needing improvement")
    challenges_faced: List[str] = Field(default_factory=list, description="Challenges discussed by mentee")
    mentor_observations: str = Field(..., description="Mentor's professional observations and guidance")
    action_items: List[ActionItem] = Field(default_factory=list, description="Specific actionable items with owners and deadlines")
    follow_up_recommendations: str = Field(..., description="Recommendations for future sessions")
    overall_progress: Literal["On Track", "Needs Attention", "At Risk"] = Field(..., description="Overall progress assessment")


def get_report_schema() -> dict:
    """Get JSON schema for LLM structured output"""
    return StructuredReport.model_json_schema()