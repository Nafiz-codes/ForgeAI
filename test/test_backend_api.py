import io
import os
import tempfile
import unittest

from fastapi.testclient import TestClient

from backend_rial.main import app


class BackendApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)

    def test_upload_plan_execute_results_flow(self) -> None:
        csv_bytes = b"CustomerID,Age,Gender,Income,Churn\nC001,34,Male,52000,0\nC002,,Female,71000,1\nC003,45,, ,0\nC004,29,Male,38000,1\nC005,34,Male,52000,0\nC001,34,Male,52000,0\n"
        response = self.client.post(
            "/api/upload",
            files={"file": ("customer_churn.csv", csv_bytes, "text/csv")},
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn("dataset_id", payload)
        self.assertEqual(payload["rows"], 6)
        self.assertGreaterEqual(payload["health_score"], 0)

        dataset_id = payload["dataset_id"]

        plan_response = self.client.get(f"/api/plan/{dataset_id}")
        self.assertEqual(plan_response.status_code, 200)
        plan_payload = plan_response.json()
        self.assertIn("actions", plan_payload)
        self.assertGreater(len(plan_payload["actions"]), 0)

        approved_actions = [
            {"id": action["id"], "column": action["column"], "type": action["type"]}
            for action in plan_payload["actions"][:3]
        ]

        execute_response = self.client.post(
            "/api/execute",
            json={"dataset_id": dataset_id, "approved_actions": approved_actions},
        )
        self.assertEqual(execute_response.status_code, 200)
        execute_payload = execute_response.json()
        self.assertEqual(execute_payload["status"], "complete")
        self.assertGreater(execute_payload["actions_applied"], 0)

        results_response = self.client.get(f"/api/results/{dataset_id}")
        self.assertEqual(results_response.status_code, 200)
        results_payload = results_response.json()
        self.assertGreater(results_payload["health_score_after"], 0)

        pipeline_response = self.client.get(f"/api/artifacts/{dataset_id}/pipeline")
        self.assertEqual(pipeline_response.status_code, 200)
        self.assertIn("def preprocess", pipeline_response.text)


if __name__ == "__main__":
    unittest.main()
