#!/bin/bash
# Simple verification script using curl

BASE_URL="http://localhost:8000/api/v1"

echo "============================================================"
echo "TEST: LOGIN"
echo "============================================================"

MENTOR_TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"mentor.demo@example.com","password":"Mentor@123"}' | \
  grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

MENTEE_TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"mentee.demo@example.com","password":"Mentee@123"}' | \
  grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

echo "Mentor token: ${MENTOR_TOKEN:0:30}..."
echo "Mentee token: ${MENTEE_TOKEN:0:30}..."

echo ""
echo "============================================================"
echo "TEST: REGISTRATION"
echo "============================================================"

curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Test User","email":"test.reg@example.com","password":"Test@123","role":"mentor"}'

echo ""
echo "============================================================"
echo "TEST: INVITATION CODE GENERATION"
echo "============================================================"

INVITE_RESPONSE=$(curl -s -X POST "$BASE_URL/assignments/generate-code" \
  -H "Authorization: Bearer $MENTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}')

INVITE_CODE=$(echo "$INVITE_RESPONSE" | grep -o '"code":"[^"]*"' | cut -d'"' -f4)
echo "Invitation code: $INVITE_CODE"

echo ""
echo "============================================================"
echo "TEST: MENTEE JOIN"
echo "============================================================"

curl -s -X POST "$BASE_URL/assignments/join" \
  -H "Authorization: Bearer $MENTEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"$INVITE_CODE\"}"

echo ""
echo "============================================================"
echo "TEST: MENTOR MY-MENTEES"
echo "============================================================"

curl -s -X GET "$BASE_URL/assignments/my-mentees" \
  -H "Authorization: Bearer $MENTOR_TOKEN"

echo ""
echo "============================================================"
echo "TEST: REPORT REQUEST CREATION"
echo "============================================================"

REQUEST_RESPONSE=$(curl -s -X POST "$BASE_URL/report-requests" \
  -H "Authorization: Bearer $MENTEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mentor_id":1,"meeting_title":"Weekly Progress Review","meeting_date":"2026-11-15T10:00:00Z","description":"Review of project milestones"}')

REQUEST_ID=$(echo "$REQUEST_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "Request ID: $REQUEST_ID"

echo ""
echo "============================================================"
echo "TEST: MENTOR LIST REQUESTS"
echo "============================================================"

curl -s -X GET "$BASE_URL/report-requests" \
  -H "Authorization: Bearer $MENTOR_TOKEN"

echo ""
echo "============================================================"
echo "TEST: MENTOR ACCEPT REQUEST"
echo "============================================================"

curl -s -X POST "$BASE_URL/report-requests/$REQUEST_ID/action" \
  -H "Authorization: Bearer $MENTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"accept"}'

echo ""
echo "============================================================"
echo "TEST: NOTIFICATIONS"
echo "============================================================"

curl -s -X GET "$BASE_URL/notifications" \
  -H "Authorization: Bearer $MENTOR_TOKEN"

curl -s -X GET "$BASE_URL/notifications" \
  -H "Authorization: Bearer $MENTEE_TOKEN"

echo ""
echo "============================================================"
echo "TEST: MEETING CREATION WITH TEXT FILE"
echo "============================================================"

cat > /tmp/test_meeting.txt << 'EOF'
Meeting Notes - Weekly Progress Review

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

Next Meeting: November 22, 2026
EOF

MEETING_RESPONSE=$(curl -s -X POST "$BASE_URL/meetings/create-meeting" \
  -H "Authorization: Bearer $MENTOR_TOKEN" \
  -F "mentee_id=2" \
  -F "meeting_title=Weekly Progress Review - Nov 15" \
  -F "meeting_date=2026-11-15T10:00:00Z" \
  -F "description=Progress review and blocker discussion" \
  -F "files=@/tmp/test_meeting.txt")

MEETING_ID=$(echo "$MEETING_RESPONSE" | grep -o '"meeting_id":[0-9]*' | cut -d':' -f2)
echo "Meeting ID: $MEETING_ID"
echo "$MEETING_RESPONSE" | grep -o '"extracted_text_preview":"[^"]*"' | cut -d'"' -f4 | head -c 300
echo "..."

echo ""
echo "============================================================"
echo "TEST: AI REPORT GENERATION"
echo "============================================================"

REPORT_RESPONSE=$(curl -s -X POST "$BASE_URL/meetings/generate-report/$MEETING_ID" \
  -H "Authorization: Bearer $MENTOR_TOKEN")

REPORT_ID=$(echo "$REPORT_RESPONSE" | grep -o '"report_id":[0-9]*' | cut -d':' -f2)
echo "Report ID: $REPORT_ID"

# Check report structure
echo "$REPORT_RESPONSE" | grep -o '"report_content":{[^}]*}' | head -c 500
echo "..."

echo ""
echo "============================================================"
echo "TEST: REPORT MANAGEMENT (GET, EDIT, APPROVE, SHARE)"
echo "============================================================"

curl -s -X GET "$BASE_URL/reports/$REPORT_ID" \
  -H "Authorization: Bearer $MENTOR_TOKEN"

# Edit report
curl -s -X PUT "$BASE_URL/reports/$REPORT_ID" \
  -H "Authorization: Bearer $MENTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"report_content": {"meeting_summary": "UPDATED SUMMARY", "overall_progress": "On Track"}}'

# Approve
curl -s -X POST "$BASE_URL/reports/$REPORT_ID/approve" \
  -H "Authorization: Bearer $MENTOR_TOKEN"

# Share
curl -s -X POST "$BASE_URL/reports/$REPORT_ID/share" \
  -H "Authorization: Bearer $MENTOR_TOKEN"

# Mentee sees shared report
curl -s -X GET "$BASE_URL/reports" \
  -H "Authorization: Bearer $MENTEE_TOKEN"

echo ""
echo "============================================================"
echo "TEST: PDF DOWNLOAD"
echo "============================================================"

curl -s -X POST "$BASE_URL/reports/$REPORT_ID/download-pdf" \
  -H "Authorization: Bearer $MENTOR_TOKEN" \
  -o /tmp/downloaded_report.pdf

if [ -f /tmp/downloaded_report.pdf ] && [ -s /tmp/downloaded_report.pdf ]; then
  echo "PDF downloaded successfully: $(wc -c < /tmp/downloaded_report.pdf) bytes"
else
  echo "PDF download failed"
fi

echo ""
echo "============================================================"
echo "TEST: DOCX DOWNLOAD"
echo "============================================================"

curl -s -X POST "$BASE_URL/reports/$REPORT_ID/download-docx" \
  -H "Authorization: Bearer $MENTOR_TOKEN" \
  -o /tmp/downloaded_report.docx

if [ -f /tmp/downloaded_report.docx ] && [ -s /tmp/downloaded_report.docx ]; then
  echo "DOCX downloaded successfully: $(wc -c < /tmp/downloaded_report.docx) bytes"
else
  echo "DOCX download failed"
fi

echo ""
echo "============================================================"
echo "TEST: UNAUTHORIZED ACCESS"
echo "============================================================"

# Mentee tries mentor endpoint
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/assignments/generate-code" \
  -H "Authorization: Bearer $MENTEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}')
echo "Mentee -> mentor endpoint: $STATUS (expected 403)"

# Mentee tries to approve
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/reports/$REPORT_ID/approve" \
  -H "Authorization: Bearer $MENTEE_TOKEN")
echo "Mentee -> approve report: $STATUS (expected 403)"

echo ""
echo "============================================================"
echo "TEST: DASHBOARD METRICS"
echo "============================================================"

MENTEE_COUNT=$(curl -s -X GET "$BASE_URL/assignments/my-mentees" \
  -H "Authorization: Bearer $MENTOR_TOKEN" | grep -o '"id":[0-9]*' | wc -l)
echo "Mentor mentee count: $MENTEE_COUNT"

REQUESTS_COUNT=$(curl -s -X GET "$BASE_URL/report-requests" \
  -H "Authorization: Bearer $MENTOR_TOKEN" | grep -o '"id":[0-9]*' | wc -l)
echo "Mentor requests count: $REQUESTS_COUNT"

MEETINGS_COUNT=$(curl -s -X GET "$BASE_URL/meetings/meetings" \
  -H "Authorization: Bearer $MENTOR_TOKEN" | grep -o '"id":[0-9]*' | wc -l)
echo "Mentor meetings count: $MEETINGS_COUNT"

REPORTS_COUNT=$(curl -s -X GET "$BASE_URL/reports" \
  -H "Authorization: Bearer $MENTOR_TOKEN" | grep -o '"id":[0-9]*' | wc -l)
echo "Mentor reports count: $REPORTS_COUNT"

echo ""
echo "============================================================"
echo "VERIFICATION COMPLETE"
echo "============================================================"

# Cleanup
rm -f /tmp/test_meeting.txt /tmp/downloaded_report.pdf /tmp/downloaded_report.docx