#!/bin/bash

BASE_URL="http://localhost:8000/api/v1"

# Get tokens
MENTOR_TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"mentor.demo@example.com","password":"Mentor@123"}' | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

MENTEE_TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"mentee.demo@example.com","password":"Mentee@123"}' | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

echo "=== Mentor Token: ${MENTOR_TOKEN:0:20}... ==="
echo "=== Mentee Token: ${MENTEE_TOKEN:0:20}... ==="

# 1. Test registration
echo "\n--- Testing Registration ---"
curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Test User","email":"test.user@example.com","password":"Test@123","role":"mentor"}'

# 2. Generate invitation code
echo "\n--- Generating Invitation Code ---"
INVITE_RESPONSE=$(curl -s -X POST "$BASE_URL/assignments/generate-code" \
  -H "Authorization: Bearer $MENTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}')

INVITE_CODE=$(echo "$INVITE_RESPONSE" | grep -o '"code":"[^"]*"' | cut -d'"' -f4)
echo "Generated Code: $INVITE_CODE"

# 3. Join with code
echo "\n--- Testing Mentee Join ---"
curl -s -X POST "$BASE_URL/assignments/join" \
  -H "Authorization: Bearer $MENTEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"$INVITE_CODE\"}"

# 4. List mentees
echo "\n--- Testing Mentor Mentees List ---"
curl -s -X GET "$BASE_URL/assignments/my-mentees" \
  -H "Authorization: Bearer $MENTOR_TOKEN"

# 5. Create report request
echo "\n--- Testing Report Request Creation ---"
REQUEST_RESPONSE=$(curl -s -X POST "$BASE_URL/report-requests" \
  -H "Authorization: Bearer $MENTEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mentor_id":1,"meeting_title":"Weekly Progress Review","meeting_date":"2026-11-15T10:00:00Z","description":"Review of project milestones"}')

REQUEST_ID=$(echo "$REQUEST_RESPONSE" | grep -o '"id":[0-9]*' | cut -d':' -f2)
echo "Created Request ID: $REQUEST_ID"

# 6. List report requests
echo "\n--- Testing Mentor Report Requests List ---"
curl -s -X GET "$BASE_URL/report-requests" \
  -H "Authorization: Bearer $MENTOR_TOKEN"

# 7. Accept request
echo "\n--- Testing Request Acceptance ---"
curl -s -X POST "$BASE_URL/report-requests/$REQUEST_ID/action" \
  -H "Authorization: Bearer $MENTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"accept"}'

# 8. List notifications
echo "\n--- Testing Notifications ---"
curl -s -X GET "$BASE_URL/notifications" \
  -H "Authorization: Bearer $MENTOR_TOKEN"

curl -s -X GET "$BASE_URL/notifications" \
  -H "Authorization: Bearer $MENTEE_TOKEN"

# 9. Create meeting
echo "\n--- Testing Meeting Creation ---"
cat > /tmp/test_meeting.txt << 'EOF'
Meeting Notes Test

Date: Test
Discussion: Testing the system integration
Action Items:
1. Test backend API
2. Verify frontend connectivity
EOF

MEETING_RESPONSE=$(curl -s -X POST "$BASE_URL/meetings/create-meeting" \
  -H "Authorization: Bearer $MENTOR_TOKEN" \
  -F "mentee_id=2" \
  -F "meeting_title=Test Meeting" \
  -F "meeting_date=2026- BSE 15T10:00:00Z" \
  -F "description=Test meeting" \
  -F "files=@/tmp/test_meeting.txt")

echo "Meeting Response: $MEETING_RESPONSE"

# 10. Generate report
echo "\n--- Testing AI Report Generation ---"
REPORT_RESPONSE=$(curl -s -X POST "$BASE_URL/meetings/generate-report/$MEETING_ID" \
  -H "Authorization: Bearer $MENTOR_TOKEN")

echo "Report Response: $REPORT_RESPONSE"

# 11. Approve report
echo "\n--- Testing Report Approval ---"
curl -s -X POST "$BASE_URL/reports/$REPORT_ID/approve" \
  -H "Authorization: Bearer $MENTOR_TOKEN"

# 12. Share report
echo "\n--- Testing Report Sharing ---"
curl -s -X POST "$BASE_URL/reports/$REPORT_ID/share" \
  -H "Authorization: Bearer $MENTOR_TOKEN"

# 13. Download PDF
echo "\n--- Testing PDF Download ---"
curl -s -X POST "$BASE_URL/reports/$REPORT_ID/download-pdf" \
  -H "Authorization: Bearer $MENTOR_TOKEN" \
  -o /tmp/test_report.pdf

if [ -f /tmp/test_report.pdf ] && [ -s /tmp/test_report.pdf ]; then
  echo "✓ PDF downloaded successfully"
else
  echo "✗ PDF download failed"
fi

# 14. Test unauthorized access
echo "\n--- Testing Unauthorized Access ---"
curl -s -o /dev/null -w "Mentee trying mentor endpoint: %{http_code}" -X POST "$BASE_URL/assignments/generate-code" \
  -H "Authorization: Bearer $MENTEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

echo "✓ Verification complete (manual review needed)"