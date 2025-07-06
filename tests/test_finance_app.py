import unittest
import requests
import json
from datetime import datetime, timedelta
import random

class TestFinanceApp(unittest.TestCase):
    BASE_URL = "http://localhost:3000/api"
    
    def setUp(self):
        """Set up test data"""
        self.transaction_data = {
            "amount": 1000,
            "description": "Test Transaction",
            "date": datetime.now().strftime("%Y-%m-%d"),
            "category": "Food & Dining",
            "type": "expense"
        }
        
        self.budget_data = {
            "category": "Food & Dining",
            "amount": 5000,
            "month": datetime.now().month,
            "year": datetime.now().year
        }
        
        # Clean up any test data from previous runs
        self.cleanup_test_data()

    def cleanup_test_data(self):
        """Clean up test data after tests"""
        try:
            # Get all transactions and delete test ones
            response = requests.get(f"{self.BASE_URL}/transactions")
            if response.ok:
                transactions = response.json().get("transactions", [])
                for transaction in transactions:
                    if "Test" in transaction.get("description", ""):
                        requests.delete(f"{self.BASE_URL}/transactions?id={transaction['_id']}")
            
            # Get all budgets and delete test ones
            response = requests.get(f"{self.BASE_URL}/budgets")
            if response.ok:
                budgets = response.json().get("budgets", [])
                for budget in budgets:
                    if budget["category"] == "Food & Dining":
                        requests.delete(f"{self.BASE_URL}/budgets?id={budget['_id']}")
        except Exception as e:
            print(f"Cleanup error: {e}")

    def test_1_transaction_crud(self):
        """Test Transaction CRUD operations"""
        # Create Transaction
        response = requests.post(
            f"{self.BASE_URL}/transactions",
            json=self.transaction_data
        )
        self.assertEqual(response.status_code, 200)
        transaction_id = response.json()["transaction"]["_id"]
        
        # Read Transaction
        response = requests.get(f"{self.BASE_URL}/transactions")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(any(t["_id"] == transaction_id for t in response.json()["transactions"]))
        
        # Update Transaction
        update_data = {**self.transaction_data, "amount": 1500}
        response = requests.put(
            f"{self.BASE_URL}/transactions?id={transaction_id}",
            json=update_data
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["amount"], 1500)
        
        # Delete Transaction
        response = requests.delete(f"{self.BASE_URL}/transactions?id={transaction_id}")
        self.assertEqual(response.status_code, 200)

    def test_2_budget_crud(self):
        """Test Budget CRUD operations"""
        # Create Budget
        response = requests.post(
            f"{self.BASE_URL}/budgets",
            json=self.budget_data
        )
        self.assertEqual(response.status_code, 200)
        budget_id = response.json()["_id"]
        
        # Read Budget
        response = requests.get(f"{self.BASE_URL}/budgets")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(any(b["_id"] == budget_id for b in response.json()["budgets"]))
        
        # Update Budget
        update_data = {**self.budget_data, "amount": 6000}
        response = requests.put(
            f"{self.BASE_URL}/budgets?id={budget_id}",
            json=update_data
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["amount"], 6000)
        
        # Delete Budget
        response = requests.delete(f"{self.BASE_URL}/budgets?id={budget_id}")
        self.assertEqual(response.status_code, 200)

    def test_3_statistics(self):
        """Test Statistics endpoints"""
        # Create test transactions with specific dates
        test_date = datetime.now().strftime("%Y-%m-%d")
        test_transactions = [
            {**self.transaction_data, "amount": -1000, "date": test_date, "category": "Food & Dining"},
            {**self.transaction_data, "amount": -500, "date": test_date, "category": "Transportation"},
            {**self.transaction_data, "amount": -2000, "date": test_date, "category": "Food & Dining"},
            {**self.transaction_data, "amount": -1500, "date": test_date, "category": "Entertainment"}
        ]
        
        # Add test transactions
        for transaction in test_transactions:
            response = requests.post(f"{self.BASE_URL}/transactions", json=transaction)
            self.assertEqual(response.status_code, 200, "Failed to create test transaction")
        
        # Test monthly statistics
        start_date = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        end_date = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        
        response = requests.get(
            f"{self.BASE_URL}/statistics?start={start_date}&end={end_date}"
        )
        self.assertEqual(response.status_code, 200, "Statistics endpoint failed")
        stats = response.json()
        
        # Verify statistics data
        self.assertTrue(isinstance(stats, list), "Statistics should return a list")
        self.assertTrue(len(stats) > 0, "Statistics should not be empty")
        
        # Verify monthly totals
        monthly_data = stats[0]
        self.assertIn('expenses', monthly_data, "Monthly data should include expenses")
        self.assertIn('income', monthly_data, "Monthly data should include income")
        self.assertEqual(monthly_data['expenses'], 5000, "Total expenses should be 5000")
        
        # Test category statistics
        response = requests.get(
            f"{self.BASE_URL}/statistics/categories?start={start_date}&end={end_date}"
        )
        self.assertEqual(response.status_code, 200, "Category statistics endpoint failed")
        categories = response.json()
        
        # Verify category data
        self.assertTrue(isinstance(categories, list), "Categories should return a list")
        self.assertTrue(len(categories) > 0, "Categories should not be empty")
        
        # Verify specific category totals
        food_dining = next((cat for cat in categories if cat["category"] == "Food & Dining"), None)
        self.assertIsNotNone(food_dining, "Food & Dining category should exist")
        self.assertEqual(food_dining["amount"], 3000, "Food & Dining expenses should be 3000")

    def test_4_validation(self):
        """Test input validation"""
        # Test invalid transaction amount
        invalid_data = {**self.transaction_data, "amount": "invalid"}
        response = requests.post(f"{self.BASE_URL}/transactions", json=invalid_data)
        self.assertNotEqual(response.status_code, 200)
        
        # Test invalid date
        invalid_data = {**self.transaction_data, "date": "invalid-date"}
        response = requests.post(f"{self.BASE_URL}/transactions", json=invalid_data)
        self.assertNotEqual(response.status_code, 200)
        
        # Test invalid category
        invalid_data = {**self.transaction_data, "category": "Invalid Category"}
        response = requests.post(f"{self.BASE_URL}/transactions", json=invalid_data)
        self.assertNotEqual(response.status_code, 200)
        
        # Test invalid budget month
        invalid_data = {**self.budget_data, "month": 13}
        response = requests.post(f"{self.BASE_URL}/budgets", json=invalid_data)
        self.assertNotEqual(response.status_code, 200)

    def test_5_bulk_operations(self):
        """Test bulk operations and performance"""
        # Create multiple transactions
        transaction_ids = []
        for i in range(10):
            data = {
                **self.transaction_data,
                "description": f"Bulk Test {i}",
                "amount": random.randint(100, 1000)
            }
            response = requests.post(f"{self.BASE_URL}/transactions", json=data)
            self.assertEqual(response.status_code, 200)
            transaction_ids.append(response.json()["transaction"]["_id"])
        
        # Test statistics calculation with bulk data
        start_date = (datetime.now() - timedelta(days=30)).isoformat()
        end_date = datetime.now().isoformat()
        response = requests.get(
            f"{self.BASE_URL}/statistics?start={start_date}&end={end_date}"
        )
        self.assertEqual(response.status_code, 200)
        
        # Cleanup bulk test data
        for transaction_id in transaction_ids:
            response = requests.delete(f"{self.BASE_URL}/transactions?id={transaction_id}")
            self.assertEqual(response.status_code, 200)

    def tearDown(self):
        """Clean up after tests"""
        self.cleanup_test_data()

if __name__ == "__main__":
    unittest.main(verbosity=2) 