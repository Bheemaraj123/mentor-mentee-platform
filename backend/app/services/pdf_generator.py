import io
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from typing import Dict, Any
from xml.sax.saxutils import escape

def generate_report_pdf(report_data: Dict[str, Any]) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.75*inch, bottomMargin=0.75*inch)
    styles = getSampleStyleSheet()
    story = []

    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=22,
        spaceAfter=6,
        textColor=HexColor('#1a1a2e'),
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )

    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=4,
        textColor=HexColor('#666666'),
        alignment=TA_CENTER,
    )

    section_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=14,
        spaceBefore=16,
        spaceAfter=8,
        textColor=HexColor('#2563eb'),
        fontName='Helvetica-Bold',
        borderWidth=0,
        borderPadding=0,
        borderColor=HexColor('#2563eb'),
    )

    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=6,
        alignment=TA_JUSTIFY,
        leading=14,
    )

    bullet_style = ParagraphStyle(
        'BulletItem',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=4,
        leftIndent=20,
        bulletIndent=8,
        leading=14,
    )

    # Title
    meeting_details = report_data.get('meeting_details', {})
    story.append(Paragraph("MENTOR-MENTEE MEETING REPORT", title_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph(meeting_details.get('meeting_title', 'Meeting Report'), subtitle_style))
    story.append(Spacer(1, 12))

    # Meeting Details Table
    details_data = [
        ['Field', 'Details'],
        ['Meeting Title', meeting_details.get('meeting_title', 'N/A')],
        ['Date', meeting_details.get('date', 'N/A')],
        ['Mentor', meeting_details.get('mentor', 'N/A')],
        ['Mentee', meeting_details.get('mentee', 'N/A')],
        ['Report Status', report_data.get('status', 'draft').replace('_', ' ').title()],
        ['Version', str(report_data.get('version', 1))],
    ]

    details_table = Table(details_data, colWidths=[1.5*inch, 4.5*inch])
    details_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HexColor('#2563eb')),
        ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#ffffff')),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (0, 1), (-1, -1), HexColor('#f8fafc')),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e2e8f0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(details_table)
    story.append(Spacer(1, 16))

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
            story.append(Paragraph(section_title, section_style))

            if isinstance(content, list):
                for item in content:
                    story.append(Paragraph(f"• {item}", bullet_style))
            else:
                story.append(Paragraph(str(content), body_style))
            story.append(Spacer(1, 4))

# Action Items Table
    action_items = report_data.get('action_items', [])

    if action_items:
        story.append(Paragraph('Action Items', section_style))

        # Styles for wrapped table content
        action_cell_style = ParagraphStyle(
            'ActionCell',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8,
            leading=11,
            spaceAfter=0,
            wordWrap='CJK',
        )

        action_header_style = ParagraphStyle(
            'ActionHeader',
            parent=action_cell_style,
            fontName='Helvetica-Bold',
            textColor=HexColor('#ffffff'),
            fontSize=8,
            leading=10,
        )

        def make_cell(value, cell_style):
            text = str(value).strip() if value is not None else ''
            return Paragraph(escape(text) if text else '—', cell_style)

        action_data = [[
            make_cell('Task', action_header_style),
            make_cell('Description', action_header_style),
            make_cell('Responsible', action_header_style),
            make_cell('Deadline', action_header_style),
            make_cell('Priority', action_header_style),
        ]]

        for item in action_items:
            action_data.append([
                make_cell(item.get('task', ''), action_cell_style),
                make_cell(item.get('description', ''), action_cell_style),
                make_cell(item.get('responsible', ''), action_cell_style),
                make_cell(item.get('deadline', ''), action_cell_style),
                make_cell(item.get('priority', ''), action_cell_style),
            ])

        action_table = Table(
            action_data,
            colWidths=[
                1.05 * inch,
                2.25 * inch,
                1.05 * inch,
                1.15 * inch,
                1.25 * inch,
            ],
            repeatRows=1,
            hAlign='LEFT',
        )

        action_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), HexColor('#059669')),
            ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#ffffff')),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('BACKGROUND', (0, 1), (-1, -1), HexColor('#f0fdf4')),
            ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#d1d5db')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ]))

        story.append(action_table)
        story.append(Spacer(1, 16))


    # Footer
    story.append(Spacer(1, 30))
    footer_style = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=HexColor('#999999'), alignment=TA_CENTER)
    story.append(Paragraph(f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M')} | Mentor-Mentee AI Platform", footer_style))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()

from datetime import datetime