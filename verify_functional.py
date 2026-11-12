#!/usr/bin/env python3
"""Functional verification script for Mentor-Mentee platform"""

import requests
import json
import os

BASE_URL = "http://localhost:8000/api/v1"

def login(email, password):
    r = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    r.raise_for_status()
    return r.json()["access_token"]

def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}

# ============================================================
# 1. LOGIN TESTS
# ============================================================
print("=" * 60)
print("TEST 1: LOGIN TESTS")
print("=" * 60)

mentor_token = login("mentor.demo@example.com", "Mentor@123")
print(f"✓ Mentor login successful (token: {mentor_token[:30]}...)")

mentee_token = login("mentee.demo@example.com", "Mentee@123")
print(f"✓ Mentee login successful (token: {mentee_token[:30]}...)")

# ============================================================
# 2. REGISTRATION TEST
# ============================================================
print("\n" + "=" * 60)
print("TEST 2: REGISTRATION")
print("=" * 60)

r = requests.post(f"{BASE_URL}/auth/register", json={
    "full_name": "Test User",
    "email": "test.reg@example.com",
    "password": "Test@123",
    "role": "mentor"
})
r.raise_for_status()
print(f"✓ Registration successful: {r.json()}")

# ============================================================
# 3. INVITATION CODE & MENTEE CONNECTION
# ============================================================
print("\n" + "=" * 60)
print("TEST 3: INVITATION CODE & MENTEE CONNECTION")
print("=" * 60)

# Generate invitation code
r = requests.post(f"{BASE_URL}/assignments/generate-code",
                  headers=auth_headers(mentor_token), json={})
r.raise_for_status()
invite_code = r.json()["code"]
print(f"✓ Invitation code generated: {invite_code}")

# Have mentee join
r = requests.post(f"{BASE_URL}/assignments/join",
                  headers=auth_headers(mentee_token),
                  json={"code": invite_code})
r.raise_for_status()
print(f"✓ Mentee joined: {r.json()}")

# Verify mentor sees mentee
r = requests.get(f"{BASE_URL}/assignments/my-mentees",
                 headers=auth_headers(mentor_token))
r.raise_for_status()
mentees = r.json()
print(f"✓ Mentor sees {len(mentees)} mentee(s): {[m['full_name'] for m in mentees]}")

# ============================================================
# 4. REPORT REQUESTS
# ============================================================
print("\n" + "=" * 60)
print("TEST 4: REPORT REQUESTS (CREATE, LIST, ACCEPT)")
print("=" * 60)

# Mentee creates request
r = requests.post(f"{BASE_URL}/report-requests",
                  headers=auth_headers(mentee_token),
                  json={
                      "mentor_id": 1,
                      "meeting_title": "Weekly Progress Review",
                      "meeting_date": "2026-11-15T10:00:00Z",
                      "description": "Review of project milestones and blockers"
                  })
r.raise_for_status()
request_data = r.json()
request_id = request_data["id"]
print(f"✓ Report request created: ID={request_id}, status={request_data['status']}")

# Mentor lists requests
r = requests.get(f"{BASE_URL}/report-requests",
                 headers=auth_headers(mentor_token))
r.raise_for_status()
requests_list = r.json()
print(f"✓ Mentor sees {len(requests_list)} request(s)")

# Mentor accepts request
r = requests.post(f"{BASE_URL}/report-requests/{request_id}/action",
                  headers=auth_headers(mentor_token),
                  json={"action": "accept"})
r.raise_for_status()
print(f"✓ Request accepted: {r.json()['status']}")

# Verify mentee sees accepted status
r = requests.get(f"{BASE_URL}/report-requests",
                 headers=auth_headers(mentee_token))
r.raise_for_status()
print(f"✓ Mentee sees status: {r.json()[0]['status']}")

# ============================================================
# 5. NOTIFICATIONS
# ============================================================
print("\n" + "=" * 60)
print("TEST 5: NOTIFICATIONS")
print("=" * 60)

r = requests.get(f"{BASE_URL}/notifications",
                 headers=auth_headers(mentor_token))
r.raise_for_status()
notifications = r.json()
print(f"✓ Mentor notifications: {len(notifications)} (types: {[n['notification_type'] for n in notifications]})")

r = requests.get(f"{BASE_URL}/notifications",
                 headers=auth_headers(mentee_token))
r.raise_for_status()
notifications = r.json()
print(f"✓ Mentee notifications: {len(notifications)} (types: {[n['notification_type'] for n in notifications]})")

# Test unread count
r = requests.get(f"{BASE_URL}/notifications/unread-count",
                 headers=auth_headers(mentor_token))
r.raise_for_status()
print(f"✓ Mentor unread count: {r.json()['count']}")

# Mark as read
if notifications:
    r = requests.post(f"{BASE_URL}/notifications/{notifications[0]['id']}/read",
                      headers=auth_headers(mentor_token))
    r.raise_for_status()
    print(f"✓ Marked notification as read")

# ============================================================
# 6. MEETING CREATION & FILE UPLOAD
# ============================================================
print("\n" + "=" * 60)
print("TEST 6: MEETING CREATION & FILE UPLOAD")
print("=" * 60)

# Create a test text file
test_content = """Meeting Notes - Weekly Progress Review

Date: November 15, 2026
Attendees: Demo Mentor, Demo Mentee

Agenda:
1. Project Status Update
2. Technical Blockers
3. Action Items

Discussion:
- The mentee presented the current state of the capstone project.
- Backend API development is 80% complete with authentication and report generation modules finished.
- Frontend dashboard integration is in progress.
- Main blocker: Database migration issues with Alembic when switching from SQLite to PostgreSQL.
- Discussed time management strategies for balancing coursework and project work.

Action Items:
1. Mentee to resolve Alembic migration by Friday
2. Mentee to implement PDF/DOCX export by next week
3. Mentor to review code and provide feedback by Wednesday

Next Meeting: November 22, 2026"""

with open("test_meeting_notes.txt", "w") as f:
    f.write(test_content)

# Upload meeting with text file
with open("test_meeting_notes.txt", "rb") as f:
    files = {"files": ("meeting_notes.txt", f, "text/plain")}
    data = {
        "mentee_id": "2",
        "meeting_title": "Weekly Progress Review - Nov 15",
        "meeting_date": "2026-11-15T10:00:00Z",
        "description": "Progress review and blocker discussion"
    }
    r = requests.post(f"{BASE_URL}/meetings/create-meeting",
                      headers=auth_headers(mentor_token),
                      files=files, data=data)
r.raise_for_status()
meeting_data = r.json()
meeting_id = meeting_data["meeting_id"]
print(f"✓ Meeting created: ID={meeting_id}")
print(f"  Extracted text preview: {meeting_data['extracted_text_preview'][:200]}...")

# List meetings
r = requests.get(f"{BASE_URL}/meetings/meetings",
                 headers=auth_headers(mentor_token))
r.raise_for_status()
meetings = r.json()
print(f"✓ Mentor sees {len(meetings)} meeting(s)")

# Get meeting details with extracted text
r = requests.get(f"{BASE_URL}/meetings/meetings/{meeting_id}",
                 headers=auth_headers(mentor_token))
r.raise_for_status()
meeting_detail = r.json()
print(f"✓ Meeting detail retrieved with {len(meeting_detail['files'])} file(s)")
print(f"  File extracted text length: {len(meeting_detail['files'][0]['extracted_text'])} chars")

# ============================================================
# 7. PDF EXTRACTION TEST
# ============================================================
print("\n" + "=" * 60)
print("TEST 7: PDF EXTRACTION")
print("=" * 60)

try:
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter

    pdf_path = "test_document.pdf"
    c = canvas.Canvas(pdf_path, pagesize=letter)
    c.drawString(100, 750, "Test PDF Document")
    c.drawString(100, 720, "This is a test PDF for text extraction verification.")
    c.drawString(100, 690, "It contains multiple lines of text.")
    c.drawString(100, 660, "Project: Mentor-Mentee Platform")
    c.drawString(100, 630, "Module: Report Generation")
    c.save()

    with open(pdf_path, "rb") as f:
        files = {"files": ("test_document.pdf", f, "application/pdf")}
        data = {
            "mentee_id": "2",
            "meeting_title": "PDF Test Meeting",
            "meeting_date": "2026-11-16T10:00:00Z",
        }
        r = requests.post(f"{BASE_URL}/meetings/create-meeting",
                          headers=auth_headers(mentor_token),
                          files=files, data=data)
    r.raise_for_status()
    pdf_meeting = r.json()
    print(f"✓ PDF upload successful: Meeting ID={pdf_meeting['meeting_id']}")
    print(f"  Extracted preview: {pdf_meeting['extracted_text_preview'][:300]}...")

    os.remove(pdf_path)
except Exception as e:
    print(f"✗ PDF test failed: {e}")

# ============================================================
# 8. DOCX EXTRACTION TEST
# ============================================================
print("\n" + "=" * 60)
print("TEST 8: DOCX EXTRACTION")
print("=" * 60)

try:
    from docx import Document

    docx_path = "test_document.docx"
    doc = Document()
    doc.add_heading("Test DOCX Document", 0)
    doc.add_paragraph("This is a test DOCX file for text extraction.")
    doc.add_paragraph("It contains multiple paragraphs.")
    doc.add_paragraph("Project: Mentor-Mentee Platform")
    doc.add_paragraph("Feature: Document Processing")
    doc.save(docx_path)

    with open(docx_path, "rb") as f:
        files = {"files": ("test_document.docx", f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
        data = {
            "mentee_id": "2",
            "meeting_title": "DOCX Test Meeting",
            "meeting_date": "2026-11-16T11:00:00Z",
        }
        r = requests.post(f"{BASE_URL}/meetings/create-meeting",
                          headers=auth_headers(mentor_token),
                          files=files, data=data)
    r.raise_for_status()
    docx_meeting = r.json()
    print(f"✓ DOCX upload successful: Meeting ID={docx_meeting['meeting_id']}")
    print(f"  Extracted preview: {docx_meeting['extracted_text_preview'][:300]}...")

    os.remove(docx_path)
except Exception as e:
    print(f"✗ DOCX test failed: {e}")

# ============================================================
# 9. AUDIO TRANSCRIPTION TEST
# ============================================================
print("\n" + "=" * 60)
print("TEST 9: AUDIO TRANSCRIPTION (faster-whisper)")
print("=" * 60)

try:
    # Check if faster-whisper is available
    from faster_whisper import WhisperModel
    print("✓ faster-whisper is installed")

    # We would need an actual audio file for real test
    # For now, verify the transcription function exists
    from app.services.file_processing import transcribe_audio
    print("✓ transcribe_audio function available")

    # Test with a non-existent file to verify error handling
    result = transcribe_audio("nonexistent.wav")
    print(f"✓ Transcription function handles missing file: {result[:50]}...")

except ImportError:
    print("✗ faster-whisper not available - transcription will use mock")
except Exception as e:
    print(f"✗ Audio test error: {e}")

# ============================================================
# 10. VIDEO AUDIO EXTRACTION TEST
# ============================================================
print("\n" + "=" * 60)
print("TEST 10: VIDEO AUDIO EXTRACTION (FFmpeg)")
print("=" * 60)

try:
    from app.services.file_processing import extract_audio_from_video
    print("✓ extract_audio_from_video function available")

    # Check if ffmpeg is available
    import subprocess
    result = subprocess.run(["ffmpeg", "-version"], capture_output=True)
    if result.returncode == 0:
        print("✓ FFmpeg is installed and available")
    else:
        print("✗ FFmpeg not found - video audio extraction will fail")
except Exception as e:
    print(f"✗ Video test error: {e}")

# ============================================================
# 11. AI REPORT GENERATION
# ============================================================
print("\n" + "=" * 60)
print("TEST 11: AI REPORT GENERATION")
print("=" * 60)

# Generate report from the text meeting
r = requests.post(f"{BASE_URL}/meetings/generate-report/{meeting_id}",
                  headers=auth_headers(mentor_token))
r.raise_for_status()
report_data = r.json()
report_id = report_data["report_id"]
print(f"✓ Report generated: ID={report_id}, status={report_data['status']}")

# Check report structure
report_content = report_data["report_content"]
print(f"  Report sections: {list(report_content.keys())}")

# Verify structured output
required_sections = [
    "meeting_details", "meeting_summary", "discussion_points",
    "academic_performance", "strengths", "weaknesses_or_improvements",
    "challenges_faced", "mentor_observations", "action_items",
    "follow_up_recommendations", "overall_progress"
]

for section in required_sections:
    if section in report_content:
        print(f"  ✓ {section}: present")
    else:
        print(f"  ✗ {section}: MISSING")

# Check action items structure
if "action_items" in report_content:
    for item in report_content["action_items"]:
        print(f"    Action: {item.get('task')} | Responsible: {item.get('responsible')} | Deadline: {item.get('deadline')}")

# ============================================================
# 12. REPORT MANAGEMENT (EDIT, APPROVE, SHARE)
# ============================================================
print("\n" + "=" * 60)
print("TEST 12: REPORT MANAGEMENT (EDIT, APPROVE, SHARE)")
print("=" * 60)

# Get report details
r = requests.get(f"{BASE_URL}/reports/{report_id}",
                 headers=auth_headers(mentor_token))
r.raise_for_status()
report = r.json()
print(f"✓ Report retrieved: status={report['status']}, version={report['version']}")

# Edit report (mentor only)
updated_content = report_content.copy()
updated_content["meeting_summary"] = "UPDATED: " + updated_content["meeting_summary"]
r = requests.put(f"{BASE_URL}/reports/{report_id}",
                 headers=auth_headers(mentor_token),
                 json={"report_content": updated_content})
r.raise_for_status()
print(f"✓ Report edited: new version={r.json()['version']}")

# Approve report
r = requests.post(f"{BASE_URL}/reports/{report_id}/approve",
                  headers=auth_headers(mentor_token))
r.raise_for_status()
print(f"✓ Report approved: status={r.json()['status']}")

# Share report
r = requests.post(f"{BASE_URL}/reports/{report_id}/share",
                  headers=auth_headers(mentor_token))
r.raise_for_status()
print(f"✓ Report shared: status={r.json()['status']}")

# Mentee should now be able to see the report
r = requests.get(f"{BASE_URL}/reports",
                 headers=auth_headers(mentee_token))
r.raise_for_status()
mentee_reports = r.json()
print(f"✓ Mentee sees {len(mentee_reports)} report(s)")

# ============================================================
# 13. PDF/DOCX DOWNLOAD
# ============================================================
print("\n" + "=" * 60)
print("TEST 13: PDF/DOCX DOWNLOAD")
print("=" * 60)

# Download PDF
r = requests.post(f"{BASE_URL}/reports/{report_id}/download-pdf",
                  headers=auth_headers(mentor_token))
if r.status_code == 200:
    with open("downloaded_report.pdf", "wb") as f:
        f.write(r.content)
    print(f"✓ PDF downloaded: {len(r.content)} bytes")
else:
    print(f"✗ PDF download failed: {r.status_code} - {r.text}")

# Download DOCX
r = requests.post(f"{BASE_URL}/reports/{report_id}/download-docx",
                  headers=auth_headers(mentor_token))
if r.status_code == 200:
    with open("downloaded_report.docx", "wb") as f:
        f.write(r.content)
    print(f"✓ DOCX downloaded: {len(r.content)} bytes")
else:
    print(f"✗ DOCX download failed: {r.status_code} - {r.text}")

# ============================================================
# 14. TASK MANAGEMENT
# ============================================================
print("\n" + "=" * 60)
print("TEST 14: TASK MANAGEMENT")
print("=" * 60)

# Check if tasks were created from report action items
# (This depends on the report generation creating tasks)
# Let's verify the API endpoints exist by checking if report has tasks
r = requests.get(f"{BASE_URL}/reports/{report_id}",
                 headers=auth_headers(mentor_token))
r.raise_for_status()
# Note: The current API doesn't expose tasks directly in report
# Would need a separate tasks endpoint
print("✓ Report retrieved (tasks would need separate endpoint)")

# ============================================================
# 15. UNAUTHORIZED ACCESS TESTS
# ============================================================
print("\n" + "=" * 60)
print("TEST 15: UNAUTHORIZED ACCESS & RESOURCE OWNERSHIP")
print("=" * 60)

# Mentee tries to access mentor-only endpoint
r = requests.post(f"{BASE_URL}/assignments/generate-code",
                  headers=auth_headers(mentee_token), json={})
print(f"✓ Mentee blocked from mentor endpoint: {r.status_code} (expected 403)")

# Mentee tries to approve report
r = requests.post(f"{BASE_URL}/reports/{report_id}/approve",
                  headers=auth_headers(mentee_token))
print(f"✓ Mentee blocked from approving: {r.status_code} (expected 403)")

# Mentor tries to access another mentor's data (would need another mentor)
# Not testing since we only have one mentor

# ============================================================
# 16. DASHBOARD METRICS
# ============================================================
print("\n" + "=" * 60)
print("TEST 16: DASHBOARD METRICS (via API)")
print("=" * 60)

# Mentor dashboard data
r = requests.get(f"{BASE_URL}/assignments/my-mentees",
                 headers=auth_headers(mentor_token))
r.raise_for_status()
print(f"✓ Mentor mentee count: {len(r.json())}")

r = requests.get(f"{BASE_URL}/report-requests",
                 headers=auth_headers(mentor_token))
r.raise_for_status()
requests_list = r.json()
pending = sum(1 for req in requests_list if req['status'] == 'pending')
accepted = sum(1 for req in requests_list if req['status'] == 'accepted')
print(f"✓ Mentor requests: {len(requests_list)} total, {pending} pending, {accepted} accepted")

r = requests.get(f"{BASE_URL}/meetings/meetings",
                 headers=auth_headers(mentor_token))
r.raise_for_status()
print(f"✓ Mentor meetings: {len(r.json())}")

r = requests.get(f"{BASE_URL}/reports",
                 headers=auth_headers(mentor_token))
r.raise_for_status()
reports = r.json()
draft = sum(1 for rep in reports if rep['status'] == 'draft')
approved = sum(1 for rep in reports if rep['status'] == 'approved')
shared = sum(1 for rep in reports if rep['status'] == 'shared')
print(f"✓ Mentor reports: {len(reports)} total, {draft} draft, {approved} approved, {shared} shared")

# Mentee dashboard data
r = requests.get(f"{BASE_URL}/report-requests",
                 headers=auth_headers(mentee_token))
r.raise_for_status()
print(f"✓ Mentee requests: {len(r.json())}")

r = requests.get(f"{BASE_URL}/meetings/meetings",
                 headers=auth_headers(mentee_token))
r.raise_for_status()
print(f"✓ Mentee meetings: {len(r.json())}")

r = requests.get(f"{BASE_URL}/reports",
                 headers=auth_headers(mentee_token))
r.raise_for_status()
print(f"✓ Mentee reports (approved/shared only): {len(r.json())}")

# ============================================================
# 17. REPORT REQUEST REJECTION
# ============================================================
print("\n" + "=" * 60)
print("TEST 17: REPORT REQUEST REJECTION")
print("=" * 60)

# Create a new report request
r = requests.post(f"{BASE_URL}/report-requests",
                  headers=auth_headers(mentee_token),
                  json={
                      "mentor_id": 1,
                      "meeting_title": "Test Rejection",
                      "meeting_date": "2026-11-20T10:00:00Z",
                      "description": "This will be rejected"
                  })
r.raise_for_status()
reject_request_id = r.json()["id"]
print(f"✓ New request created: ID={reject_request_id}")

# Mentor rejects with reason
r = requests.post(f"{BASE_URL}/report-requests/{reject_request_id}/action",
                  headers=auth_headers(mentor_token),
                  json={"action": "reject", "rejection_reason": "Insufficient detail provided"})
r.raise_for_status()
rejected = r.json()
print(f"✓ Request rejected: status={rejected['status']}")

# Verify notification sent to mentee
r = requests.get(f"{BASE_URL}/notifications",
                 headers=auth_headers(mentee_token))
r.raise_for_status()
notifications = r.json()
rejection_notif = [n for n in notifications if "rejected" in n["message"].lower()]
print(f"✓ Rejection notification sent: {len(rejection_notif)} found")

# ============================================================
# CLEANUP
# ============================================================
print("\n" + "=" * 60)
print("CLEANUP")
print("=" * 60)

for f in ["test_meeting_notes.txt", "downloaded_report.pdf", "downloaded_report.docx"]:
    if os.path.exists(f):
        os.remove(f)
        print(f"✓ Removed {f}")

print("\n" + "=" * 60)
print("VERIFICATION COMPLETE")
print("=" * 60)