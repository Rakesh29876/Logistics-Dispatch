# Logistics & Dispatch Agent — Product and Agent Specification

## Mission
Provide one operations workspace to understand shipment execution, delivery commitment risk, carrier outcomes, proof-of-delivery exceptions, customer order fulfillment, and finished-goods inventory position.

## Personas
- Dispatch coordinator: needs to find a shipment, carrier, planned ETA, delivery status and POD state.
- Logistics manager: needs delayed-shipment trends, carrier comparisons, freight spend and vehicle utilization.
- Customer service / order desk: needs order quantity, shipped quantity, open quantity and requested delivery date.
- Plant / warehouse operations: needs the latest FG warehouse inventory estimate by plant/material.

## Agent workflow
1. User asks a question in the React chat.
2. FastAPI loads recent conversation context from Neon.
3. LangChain sends a logistics-specific instruction prompt to the Domo Text Generation endpoint.
4. The model requests `get_schema` before SQL and then calls `run_sql` for factual analysis.
5. The backend runs the query using the configured read-only connection, read-only transaction, statement timeout and row limit.
6. Tool observations are added to the agent scratchpad. The model produces a final answer.
7. User question, answer and tool trace are persisted in Neon and rendered in the chat.

## Supported user journeys
- Shipment lookup: exact shipment ID / customer order ID, status, carrier, plant, vehicle type, dispatch date, planned ETA, actual delivery timestamp, quantity, freight cost and POD state.
- Delay monitoring: list records marked DELAYED; compare planned ETA to actual delivery timestamp; distinguish source status from timestamp-based lateness.
- Carrier scorecard: shipment count, delayed count, average vehicle utilization, freight total and freight average.
- Fulfillment: order quantity, shipped quantity, open quantity, requested delivery date, priority, channel and order status.
- Inventory readiness: latest snapshot date, plant, material, warehouse, on-hand, allocated, blocked, quality hold, in-transit, safety stock and estimated net available quantity.
- Dispatch overview: total, delivered, delayed, in-transit, on-time %, POD outstanding, freight and average utilization.

## Controls
- SQL tool only accepts one SELECT/WITH statement.
- Mutating SQL keywords are rejected.
- Queries are run in a read-only transaction, with a 10-second statement timeout and a 100-row response cap.
- Analytics schema discovery is limited to the three supplied fact tables.
- Domo token and database connection strings stay on the backend.
- A separate Neon read-only role is recommended for production.

## Definitions
| Metric | Definition |
|---|---|
| Delivered | Count where `shipment_status = 'DELIVERED'` |
| Delayed | Count where `shipment_status = 'DELAYED'` |
| In transit | Count where `shipment_status = 'IN_TRANSIT'` |
| On-time delivery % | `actual_delivery_ts <= planned_eta` divided by records with an actual delivery timestamp |
| POD outstanding | `pod_status` is `PENDING` or `EXCEPTION` |
| Open order quantity | `GREATEST(order_qty - shipped_qty, 0)` |
| Estimated net available inventory | `GREATEST(on_hand_qty - allocated_qty - blocked_qty - quality_hold_qty, 0)` |

## Explicit exclusions in this MVP
No live GPS/telematics, route optimization, vehicle assignment recommendation, dock appointment calendar, carrier booking integration, production completion feed, quality release event, customer address/contact, customer-specific delivery time window, or proof-of-delivery document/image is present in the supplied files. The agent must not imply these capabilities are connected.

## Suggested next iteration
Add ERP production order completion and quality-release events, WMS pick/pack/staging events, TMS booking and carrier milestone APIs, GPS/telematics feed, customer master/address and delivery-slot commitments, and POD document links. With those sources, extend from retrospective shipment visibility to proactive dispatch readiness and ETA risk prediction.
