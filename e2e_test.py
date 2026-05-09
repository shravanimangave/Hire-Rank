"""
End-to-end smoke test: signup → upload → analyze → poll → results
Run with: .\backend\venv\Scripts\python.exe e2e_test.py
"""
import urllib.request, urllib.error, json, time

base = "http://localhost:8000"


def req(url, data=None, headers=None, method=None):
    if headers is None:
        headers = {}
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(r)
        return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())


# 1. Health
status, body = req(f"{base}/health")
assert status == 200 and body["status"] == "ok", f"Health failed: {body}"
print("✓ HEALTH OK")

# 2. Auth
status, body = req(
    f"{base}/auth/signup",
    data=json.dumps({"name": "E2E User", "email": "e2e@hirerank.io", "password": "Test1234"}).encode(),
    headers={"Content-Type": "application/json"},
    method="POST",
)
if status == 400 and "already registered" in body.get("detail", ""):
    status, body = req(
        f"{base}/auth/login",
        data=json.dumps({"email": "e2e@hirerank.io", "password": "Test1234"}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
assert status in (200, 201), f"Auth failed ({status}): {body}"
token = body["access_token"]
print("✓ AUTH OK")

# 3. Upload a minimal but valid PDF
def make_pdf(text):
    stream = b"BT /F1 12 Tf 50 700 Td (" + text.encode("latin-1", errors="replace") + b") Tj ET"
    objects = (
        b"%PDF-1.4\n"
        b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
        b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
        b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]"
        b"/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n"
        b"4 0 obj<</Length " + str(len(stream)).encode() + b">>\nstream\n"
        + stream + b"\nendstream\nendobj\n"
        b"5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n"
    )
    trailer = (
        b"xref\n0 6\n0000000000 65535 f \n"
        + b"0000000009 00000 n \n" * 5
        + b"trailer<</Size 6/Root 1 0 R>>\nstartxref\n"
        + str(len(objects)).encode() + b"\n%%EOF"
    )
    return objects + trailer

pdf = make_pdf(
    "Jane Doe  jane@example.com  Senior Python Developer "
    "5 years experience  Python FastAPI Docker AWS React "
    "led team of 8 engineers  built scalable microservices "
    "reduced latency by 40 percent  deployed CI/CD pipelines"
)

boundary = b"HireRankBoundary"
body_parts = (
    b"--" + boundary + b"\r\n"
    b'Content-Disposition: form-data; name="job_description"\r\n\r\n'
    b"Senior Python backend developer with FastAPI, Docker, AWS experience.\r\n"
    b"--" + boundary + b"\r\n"
    b'Content-Disposition: form-data; name="job_title"\r\n\r\n'
    b"Senior Backend Engineer\r\n"
    b"--" + boundary + b"\r\n"
    b'Content-Disposition: form-data; name="files"; filename="jane_doe.pdf"\r\n'
    b"Content-Type: application/pdf\r\n\r\n"
    + pdf + b"\r\n"
    b"--" + boundary + b"--\r\n"
)

status, body = req(
    f"{base}/upload/resumes",
    data=body_parts,
    headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": f"multipart/form-data; boundary={boundary.decode()}",
    },
    method="POST",
)
assert status == 200, f"Upload failed ({status}): {body}"
session_id = body["session_id"]
print(f"✓ UPLOAD OK  session_id={session_id}")

# 4. Trigger analysis
status, body = req(
    f"{base}/analyze",
    data=json.dumps({"session_id": session_id, "job_description": "Python FastAPI Docker AWS"}).encode(),
    headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"},
    method="POST",
)
assert status == 200, f"Analyze trigger failed ({status}): {body}"
print("✓ ANALYZE triggered")

# 5. Poll
final_status = None
for attempt in range(45):
    time.sleep(2)
    status, body = req(
        f"{base}/analyze/status/{session_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    print(f"  poll {attempt+1}: status={body.get('status')}  candidates={body.get('candidate_count')}")
    if body.get("status") == "done":
        final_status = "done"
        break
    if body.get("status") == "error":
        final_status = "error"
        break

assert final_status == "done", f"Pipeline ended with status: {final_status}"
print("✓ PIPELINE COMPLETED")

# 6. Results
status, body = req(
    f"{base}/results/{session_id}",
    headers={"Authorization": f"Bearer {token}"},
)
assert status == 200, f"Results fetch failed ({status}): {body}"
candidates = body.get("candidates", [])
assert len(candidates) > 0, "No candidates in results!"
c = candidates[0]
print(f"✓ RESULTS OK — top candidate: {c['name']}  score={c['score']}  rec={c['recommendation']}")

# 7. Candidate detail (tests the re-ordered wildcard fix)
status, body = req(
    f"{base}/results/candidate/{c['id']}",
    headers={"Authorization": f"Bearer {token}"},
)
assert status == 200, f"Candidate detail failed ({status}): {body}"
print(f"✓ CANDIDATE DETAIL OK — {body['name']}")

# 8. Sessions/mine (tests the re-ordered wildcard fix)
status, body = req(
    f"{base}/results/sessions/mine",
    headers={"Authorization": f"Bearer {token}"},
)
assert status == 200 and "sessions" in body, f"Sessions/mine failed ({status}): {body}"
print(f"✓ SESSIONS/MINE OK — {len(body['sessions'])} session(s)")

print("\n🎉 ALL FIXES VERIFIED — full pipeline working end-to-end")
