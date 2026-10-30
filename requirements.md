# MiniDash — Scheduled Orders: Requirements

## 1. Overview

This feature lets a customer schedule an order for a future delivery time
instead of ordering for immediate delivery. Scheduled orders are held, released
to the restaurant 30 minutes before delivery, and can be cancelled by the
customer until they are released. All time-dependent behaviour uses an
injected clock so it can be tested without depending on the real time.

## 3. User Stories and Acceptance Criteria

### US-1 Schedule an order for later

**As a** customer, **I want** to choose a future delivery time when I place an
order **so that** my food arrives when I need it.

- **AC-1.1** WHEN a customer places an order with a valid scheduled time,
  THE SYSTEM SHALL create the order with status SCHEDULED and return the
  scheduled time.
- **AC-1.2** WHEN a customer places an order without a scheduled time,
  THE SYSTEM SHALL create it as an immediate order with status PLACED.
- **AC-1.3** IF the scheduled time is not a valid date and time,
  THEN THE SYSTEM SHALL reject the order with `400` and the error
  "scheduledFor must be a valid date/time".
- **AC-1.4** WHEN a customer places an order with a scheduled time less than
  45 minutes ahead, THE SYSTEM SHALL reject it with `400` and the error
  "Scheduled orders must be at least 45 minutes from now".
- **AC-1.5** WHEN a customer places an order with a scheduled time more than
  7 days ahead, THE SYSTEM SHALL reject it with `400` and the error
  "Orders can only be scheduled up to 7 days ahead".
- **AC-1.6** WHEN a customer places an order with a scheduled time exactly
  45 minutes or exactly 7 days ahead, THE SYSTEM SHALL accept it.
- **AC-1.7** IF the restaurant is closed at the requested time,
  THEN THE SYSTEM SHALL reject the order with `400` and an error stating the
  restaurant's opening hours (for example "Bella Napoli is only open
  11:00–22:00").
- **AC-1.8** IF an order is rejected,
  THEN THE SYSTEM SHALL NOT create the order.

### US-2 Release scheduled orders to the restaurant

**As a** restaurant, **I want** scheduled orders to reach me 30 minutes before
delivery **so that** I prepare them at the right time.

- **AC-2.1** WHILE an order is SCHEDULED, THE SYSTEM SHALL hold it and not
  release it to the restaurant.
- **AC-2.2** WHEN a scheduled order is 30 minutes from its delivery time,
  THE SYSTEM SHALL release it to the restaurant by changing its status from
  SCHEDULED to PLACED exactly once.
- **AC-2.3** WHEN a scheduled order is released, THE SYSTEM SHALL record the
  release time and add a single PLACED entry to the order's status history.
- **AC-2.4** IF a restaurant or driver tries to change a SCHEDULED order to
  PLACED manually, THEN THE SYSTEM SHALL reject the change with `409` and the
  error "Cannot change status from 'scheduled' to 'placed'", and leave the
  order SCHEDULED.

### US-3 Cancel a scheduled order

**As a** customer, **I want** to cancel a scheduled order before it is sent to
the restaurant **so that** it is not prepared if I no longer want it.

- **AC-3.1** WHEN a customer cancels a scheduled order that has not been
  released, THE SYSTEM SHALL mark it CANCELLED and never release it.
- **AC-3.2** IF a customer tries to cancel an order that has already been
  released, THEN THE SYSTEM SHALL reject the request with `409` and the error
  "This order has already been released to the restaurant and can no longer
  be cancelled".
- **AC-3.3** IF a customer tries to cancel an order that is already CANCELLED,
  THEN THE SYSTEM SHALL reject the request with `409` and the error
  "This order is already cancelled".
- **AC-3.4** IF a customer tries to cancel an order that does not exist,
  THEN THE SYSTEM SHALL reject the request with `404` and the error
  "Order not found".
- **AC-3.5** WHERE the web frontend is used, THE SYSTEM SHALL show a
  "Cancel Scheduled Order" button only WHILE the order is SCHEDULED.

### US-4 Testable time-based behaviour

**As a** developer, **I want** all time-dependent logic to use an injected
clock **so that** tests are fast, repeatable and do not depend on the real
time.

- **AC-4.1** THE SYSTEM SHALL read the current time only from an injected
  clock for scheduling checks, release timing and timestamps.
- **AC-4.2** THE SYSTEM SHALL start and stop release timers only through the
  injected clock.
- **AC-4.3** WHEN the application runs normally, THE SYSTEM SHALL use a clock
  based on the real system time.
- **AC-4.4** WHERE a test supplies a fake clock, THE SYSTEM SHALL use it, so
  the test can move time forward and trigger releases without waiting.
- **AC-4.5** WHEN a new application instance is created, THE SYSTEM SHALL
  start with no orders, so tests do not affect each other.

## 4. Out of Scope

- Changing the delivery time or items of a scheduled order.
- Customer cancellation after an order has been released.
- Refunds, payments or charges for cancelled orders.
- Notifications when an order is scheduled, released or
  cancelled.
- Opening hours that cross midnight or differ by day of the week.
- Restaurant capacity limits for orders scheduled at the same time.
- Recurring scheduled orders.
- Authentication; the cancel endpoint does not check which customer owns the
  order.