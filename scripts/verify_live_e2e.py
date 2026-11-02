import sys
import json
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000/api"

def api_call(endpoint, method="GET", data=None, headers=None):
    url = f"{BASE_URL}{endpoint}"
    req_headers = headers or {}
    body = None
    if data is not None:
        if isinstance(data, dict):
            body = json.dumps(data).encode("utf-8")
            req_headers["Content-Type"] = "application/json"
        elif isinstance(data, bytes):
            body = data

    req = urllib.request.Request(url, data=body, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return resp.getcode(), json.loads(content) if "application/json" in resp.headers.get("Content-Type", "") else content
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        try:
            parsed = json.loads(content)
        except Exception:
            parsed = content
        return e.code, parsed

def run_tests():
    results = {}
    print("--- 1. Testing Health Endpoint ---")
    code, data = api_call("/health")
    print(f"Health: HTTP {code}, Status: {data.get('status')}")
    assert code == 200 and data.get("status") in ["healthy", "ok"]
    results["health"] = True

    print("\n--- 2. Testing Auth & Login ---")
    code, auth_data = api_call("/auth/login", method="POST", data={
        "email": "analyst@alpha.io",
        "password": "Bayora@Analyst2026!"
    })
    print(f"Login: HTTP {code}, User: {auth_data.get('user', {}).get('email')}, Tenant: {auth_data.get('active_tenant', {}).get('id')}")
    assert code == 200
    token = auth_data["access_token"]
    headers = {"Authorization": f"Bearer {token}", "X-Tenant-ID": "tenant-alpha"}
    results["auth"] = True

    print("\n--- 3. Testing Synthetic 10-Scenario Isolation Matrix ---")
    code, synth_data = api_call("/synthetic/run", method="POST", headers=headers)
    print(f"Synthetic Suite: HTTP {code}, All Enforced: {synth_data.get('all_enforced')}, Passed: {synth_data.get('passed_tests')}/{synth_data.get('total_tests')}")
    assert code == 200
    assert synth_data.get("all_enforced") is True
    assert synth_data.get("passed_tests") == 10
    results["synthetic_suite"] = True

    print("\n--- 4. Testing Audit Trail & Chain Verification ---")
    code, audit_verify = api_call("/audit-events/verify-chain", headers=headers)
    print(f"Audit Verify: HTTP {code}, Valid: {audit_verify.get('valid')}, Total: {audit_verify.get('total_verified')}")
    assert code == 200
    assert audit_verify.get("valid") is True
    results["audit_chain_valid"] = True

    print("\n--- 5. Testing Audit Tampering Simulation & Detection ---")
    code, tamper_res = api_call("/audit-events/simulate-tamper?tamper_type=payload", method="POST", headers=headers)
    print(f"Tamper Injection: HTTP {code}, Message: {tamper_res.get('message')}")
    assert code == 200

    code, tampered_verify = api_call("/audit-events/verify-chain", headers=headers)
    print(f"Verify After Tampering: HTTP {code}, Valid: {tampered_verify.get('valid')}, Break Detected: {tampered_verify.get('break_detected')}, Category: {tampered_verify.get('failure_category')}")
    assert code == 200
    assert tampered_verify.get("valid") is False
    assert tampered_verify.get("break_detected") is True
    results["audit_tamper_detected"] = True

    print("\n--- 6. Restoring Audit Chain ---")
    code, restore_res = api_call("/audit-events/restore-chain", method="POST", headers=headers)
    print(f"Restore Chain: HTTP {code}, Restored: {restore_res.get('restored_records')}")
    assert code == 200

    code, restored_verify = api_call("/audit-events/verify-chain", headers=headers)
    print(f"Verify After Restore: HTTP {code}, Valid: {restored_verify.get('valid')}")
    assert code == 200
    assert restored_verify.get("valid") is True
    results["audit_restored"] = True

    print("\n--- 7. Testing Tenant Boundary Enforcement (Cross-Tenant Access Denial) ---")
    # Beta user credentials
    code, beta_auth = api_call("/auth/login", method="POST", data={
        "email": "admin@beta.io",
        "password": "Bayora@Admin2026!"
    })
    assert code == 200
    beta_token = beta_auth["access_token"]
    beta_headers = {"Authorization": f"Bearer {beta_token}", "X-Tenant-ID": "tenant-beta"}
    print(f"Beta Login: HTTP {code}, Tenant: {beta_auth.get('active_tenant', {}).get('id')}")

    # Beta user attempts to query Alpha's experiments
    # First create an experiment in Alpha
    boundary = "----BayoraBoundary123456"
    multipart_body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="name"\r\n\r\n'
        f"Alpha Private Test\r\n"
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="operation"\r\n\r\n'
        f"isolation_access\r\n"
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="alpha_policy.json"\r\n'
        f"Content-Type: application/json\r\n\r\n"
        f'{{"tenant_id": "tenant-alpha", "isolate_sessions": true}}\r\n'
        f"--{boundary}--\r\n"
    ).encode("utf-8")

    alpha_upload_headers = {
        "Authorization": f"Bearer {token}",
        "X-Tenant-ID": "tenant-alpha",
        "Content-Type": f"multipart/form-data; boundary={boundary}"
    }

    code, exp_created = api_call("/experiments", method="POST", data=multipart_body, headers=alpha_upload_headers)
    print(f"Alpha Experiment Created: HTTP {code}, ID: {exp_created.get('id')}, Risk: {exp_created.get('risk_level')}")
    assert code in [200, 201]
    exp_id = exp_created["id"]

    # Beta attempts to read Alpha's experiment
    code, beta_read = api_call(f"/experiments/{exp_id}", headers=beta_headers)
    print(f"Beta Access to Alpha Experiment: HTTP {code} (Expected 404/403: Cross-tenant denied)")
    assert code in [403, 404]
    results["cross_tenant_denied"] = True

    print("\n--- 8. Testing Report Generation & Export ---")
    code, report_data = api_call(f"/experiments/{exp_id}/report", headers=headers)
    print(f"Report Generated: HTTP {code}, Experiment: {report_data.get('experiment', {}).get('id')}, Status: {report_data.get('verification_status')}")
    assert code == 200
    assert report_data.get("experiment", {}).get("id") == exp_id
    results["report_generated"] = True

    print("\n=== ALL 8 E2E LIVE VERIFICATION CHECKS PASSED SUCCESSFULLY ===")
    return results

if __name__ == "__main__":
    run_tests()
