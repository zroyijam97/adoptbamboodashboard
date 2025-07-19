#!/bin/bash
curl -X POST http://localhost:3000/api/payment/callback \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "billcode=n11h1khv&status_id=1&amount=3500&transaction_id=TP2507180284141836&order_id=BAMBOO1752801165438352"