import requests

BASE_URL = 'http://localhost:8000/api/v1'

# Get mentor token
r = requests.post(f'{BASE_URL}/auth/login', json={'email': 'mentor.demo@example.com', 'password': 'Mentor@123'})
token = r.json()['access_token']
headers = {'Authorization': 'Bearer ' + token}

# Test report generation
r = requests.post(f'{BASE_URL}/meetings/generate-report/1', headers=headers)
print('Report generation status:', r.status_code)
if r.status_code == 200:
    report = r.json()
    print('Report ID:', report['report_id'])
    print('Report status:', report['status'])
    content = report['report_content']
    print('Has meeting_details:', 'meeting_details' in content)
    print('Has discussion_points:', 'discussion_points' in content)
    print('Has strengths:', 'strengths' in content)
    print('Has action_items:', 'action_items' in content)
    print('Has overall_progress:', 'overall_progress' in content)
    if 'action_items' in content:
        print('Action items:', content['action_items'])
    print('Has weaknesses:', 'weaknesses_or_improvements' in content)
else:
    print('Error:', r.text[:500])