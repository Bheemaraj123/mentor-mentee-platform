import io
from docx import Document
from docx.shared import Inches, Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.style import WD_STYLE_TYPE
from typing import Dict, Any

def generate_report_docx(report_data: Dict[str, Any]) -> bytes:
    doc = Document()

    # Set default font
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Calibri'
    font.size = Pt(11)
    font.color.rgb = RGBColor(0x33, 0x33, 0x33)

    # Title
    title = doc.add_heading('MENTOR-MENTEE MEETING REPORT', level=0)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for run in title.runs:
        run.font.color.rgb = RGBColor(0x1a, 0x1a, 0x2e)
        run.font.size = Pt(24)

    # Meeting Title
    meeting_details = report_data.get('meeting_details', {})
    subtitle = doc.add_paragraph(meeting_details.get('meeting_title', 'Meeting Report'))
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for run in subtitle.runs:
        run.font.size = Pt(14)
        run.font.color.rgb = RGBColor(0x66, 0x66, 0x66)

    doc.add_paragraph()  # Spacer

    # Meeting Details Table
    details_table = doc.add_table(rows=7, cols=2)
    details_table.style = 'Light Shading Accent 1'
    details_table.alignment = WD_TABLE_ALIGNMENT.CENTER

    details = [
        ('Meeting Title', meeting_details.get('meeting_title', 'N/A')),
        ('Date', meeting_details.get('date', 'N/A')),
        ('Mentor', meeting_details.get('mentor', 'N/A')),
        ('Mentee', meeting_details.get('mentee', 'N/A')),
        ('Report Status', report_data.get('status', 'draft').replace('_', ' ').title()),
        ('Version', str(report_data.get('version', 1))),
        ('Generated On', datetime.now().strftime('%Y-%m-%d %H:%M')),
    ]

    for i, (field, value) in enumerate(details):
        row = details_table.rows[i]
        row.cells[0].text = field
        row.cells[1].text = value
        for cell in row.cells:
            for paragraph in cell.paragraphs:
                for run in paragraph.runs:
                    run.font.size = Pt(10)
        # Bold the field name
        for paragraph in row.cells[0].paragraphs:
            for run in paragraph.runs:
                run.bold = True

    doc.add_paragraph()  # Spacer

    # Report Sections
    sections = [
        ('Meeting Summary', 'meeting_summary'),
        ('Discussion Points', 'discussion_points'),
        ('Academic Performance', 'academic_performance'),
        ('Strengths', 'strengths'),
        ('Weaknesses / Areas for Improvement', 'weaknesses_or_improvements'),
        ('Challenges Faced', 'challenges_faced'),
        ('Mentor Observations', 'mentor_observations'),
        ('Follow-up Recommendations', 'follow_up_recommendations'),
        ('Overall Progress', 'overall_progress'),
    ]

    for section_title, section_key in sections:
        content = report_data.get(section_key)
        if content:
            heading = doc.add_heading(section_title, level=2)
            for run in heading.runs:
                run.font.color.rgb = RGBColor(0x25, 0x63, 0xeb)

            if isinstance(content, list):
                for item in content:
                    p = doc.add_paragraph(item, style='List Bullet')
                    for run in p.runs:
                        run.font.size = Pt(11)
            else:
                p = doc.add_paragraph(str(content))
                for run in p.runs:
                    run.font.size = Pt(11)

    # Action Items Table
    action_items = report_data.get('action_items', [])
    if action_items:
        heading = doc.add_heading('Action Items', level=2)
        for run in heading.runs:
            run.font.color.rgb = RGBColor(0x25, 0x63, 0xeb)

        table = doc.add_table(rows=1, cols=5)
        table.style = 'Light Shading Accent 1'
        table.alignment = WD_TABLE_ALIGNMENT.CENTER

        # Header
        headers = ['Task', 'Description', 'Responsible', 'Deadline', 'Priority']
        hdr_cells = table.rows[0].cells
        for i, header in enumerate(headers):
            hdr_cells[i].text = header
            for paragraph in hdr_cells[i].paragraphs:
                for run in paragraph.runs:
                    run.bold = True
                    run.font.size = Pt(9)
                    run.font.color.rgb = RGBColor(0xff, 0xff, 0xff)

        # Data rows
        for item in action_items:
            row_cells = table.add_row().cells
            row_cells[0].text = item.get('task', '')
            row_cells[1].text = item.get('description', '')
            row_cells[2].text = item.get('responsible', '')
            row_cells[3].text = item.get('deadline', '')
            row_cells[4].text = item.get('priority', '').title()
            for cell in row_cells:
                for paragraph in cell.paragraphs:
                    for run in paragraph.runs:
                        run.font.size = Pt(9)

    doc.add_paragraph()  # Spacer

    # Footer
    footer_para = doc.add_paragraph()
    footer_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer_run = footer_para.add_run(f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M')} | Mentor-Mentee AI Platform")
    footer_run.font.size = Pt(8)
    footer_run.font.color.rgb = RGBColor(0x99, 0x99, 0x99)

    # Save to bytes
    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer.read()

from datetime import datetime