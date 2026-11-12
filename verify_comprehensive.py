import requests

BASE_URL = 'http://localhost:8000/api/v1'

# Get both tokens
r = requests.post(f'{BASE_URL}/auth/login', json={'email': 'mentor.demo@example.com', 'password': 'Mentor@123'})
mentor_token = r.json()['access_token']

r = requests.post(f'{BASE_URL}/auth/login', json={'email': 'mentee.demo@example.com', 'password': 'Mentee@123'})
mentee_token = r.json()['access_token']

headers_m = {'Authorization': 'Bearer ' + mentor_token}
headers_me = {'Authorization': 'Bearer ' + mentee_token}

print('=== COMPREHENSIVE VERIFICATION ===')
print()

# 1. Auth
print('1. AUTHENTICATION')
print(f'   Mentor login: {r.status_code}')
print(f'   Mentee login: OK')

# 2. Mentee connection
print()
print('2. MENTEE CONNECTION')
invite_r = requests.post(f'{BASE_URL}/assignments/generate-code', headers=headers_m, json={})
print(f'   Generate code: {invite_r.status_code}')
if invite_r.status_code == 200:
    code = invite_r.json()['code']
    join_r = requests.post(f'{BASE_URL}/assignments/join', headers=headers_me, json={'code': code})
    print(f'   Mentee join: {join_r.status_code}')

# 3. Report requests
print()
print('3. REPORT REQUESTS')
req_r = requests.post(f'{BASE_URL}/report-requests', headers=headers_me, json={
    'mentor_id': 1,
    'meeting_title': 'Progress Review',
    'meeting_date': '2026-11-20T10:00:00Z',
    'description': 'Review progress'
})
print(f'   Create request: {req_r.status_code}')
if req_r.status_code == 200:
    req_id = req_r.json()['id']
    accept_r = requests.post(f'{BASE_URL}/report-requests/{req_id}/action', headers=headers_m, json={'action': 'accept'})
    print(f'   Accept request: {accept_r.status_code}')

# 4. Meeting creation
print()
print('4. MEETING CREATION')
meeting_r = requests.post(f'{BASE_URL}/meetings/create-meeting', headers=headers_m, data={
    'mentee_id': '2',
    'meeting_title': 'Test Meeting',
    'meeting_date': '2026-11-25T10:00:00Z'
}, files={'files': ('test.txt', 'Test content', 'text/plain')})
print(f'   Create meeting: {meeting_r.status_code}')

# 5. Report generation
print()
print('5. REPORT GENERATION')
if meeting_r.status_code == 200:
    meeting_id = meeting_r.json()['meeting_id']
    report_r = requests.post(f'{BASE_URL}/meetings/generate-report/{meeting_id}', headers=headers_m)
    print(f'   Generate report: {report_r.status_code}')
    if report_r.status_code == 200:
        report = report_r.json()
        print(f'   Report ID: {report["report_id"]}')
        print(f'   Has meeting_details: {"meeting_details" in report["report_content"]}')
        print(f'   Has action_items: {"action_items" in report["report_content"]}')
        print(f'   Has overall_progress: {"overall_progress" in report["report_content"]}')

# 6. Report management
print()
print('6. REPORT MANAGEMENT')
if report_r.status_code == 200:
    rid = report_r.json()['report_id']
    get_r = requests.get(f'{BASE_URL}/reports/{rid}', headers=headers_m)
    print(f'   Get report: {get_r.status_code}')
    if get_r.status_code == 200:
        print(f'   Report status: {get_r.json()["status"]}')

    # Approve
    app_r = requests.post(f'{BASE_URL}/reports/{rid}/approve', headers=headers_m)
    print(f'   Approve report: {app_r.status_code}')

    # Share
    share_r = requests.post(f'{BASE_URL}/reports/{rid}/share', headers=headers_m)
    print(f'   Share report: {share_r.status_code}')

# 7. Notifications
print()
print('7. NOTIFICATIONS')
notif_r = requests.get(f'{BASE_URL}/notifications', headers=headers_m)
print(f'   Mentor notifications: {notif_r.status_code}')
if notif_r.status_code == 200:
    print(f'   Count: {len(notif_r.json())}')

notif_me_r = requests.get(f'{BASE_URL}/notifications', headers=headers_me)
print(f'   Mentee notifications: {notif_me_r.status_code}')
if notif_me_r.status_code == 200:
    print(f'   Count: {len(notif_me_r.json())}')

# 8. Tasks
print()
print('8. TASKS')
create_task_r = requests.post(f'{BASE_URL}/tasks/', headers=headers_m, json={
    'title': 'Test Task from Verification',
    'description': 'Verifying task module works',
    'priority': 'high'
})
print(f'   Create task: {create_task_r.status_code}')
if create_task_r.status_code == 200:
    task_id = create_task_r.json()['id']
    list_r = requests.get(f'{BASE_URL}/tasks/', headers=headers_m)
    print(f'   List tasks: {list_r.status_code}')
    if list_r.status_code == 200:
        print(f'   Tasks count: {len(list_r.json())}')

    # Update status
    if task_id:
        update_r = requests.put(f'{BASE_URL}/tasks/{task_id}', headers=headers_m, json={'status': 'in_progress'})
        print(f'   Update task: {update_r.status_code}')

# 9. Downloads
print()
print('9. DOWNLOADS')
if report_r.status_code == 200:
    rid = report_r.json()['report_id']
    pdf_r = requests.post(f'{BASE_URL}/reports/{rid}/download-pdf', headers=headers_m)
    print(f'   PDF download: {pdf_r.status_code}')
    docx_r = requests.post(f'{BASE_URL}/reports/{rid}/download-docx', headers=headers_m)
    print(f'   DOCX download: {docx_r.status_code}')

print()
print('=== VERIFICATION COMPLETE ===')