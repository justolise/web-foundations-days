# Reflection

## Most difficult concept and how I overcame it

The hardest concept was concurrency: how a system stays correct when many people act at the same moment. At first, "check the seat is free, then mark it sold" sounded safe to me. It was only when I saw that two users can both pass the check before either writes that I understood why the check and the update must be one atomic step. I overcame it by tracing a two-user race by hand, line by line, and then writing the conditional `UPDATE ... WHERE status = 'available'` and a unique constraint as a safety net. Explaining it in my own words in the TicketHub design made it stick.

## What I would improve in my capstone

Based on the feedback I received, I would improve automated test coverage and edge-case error handling for streaming responses in Baraza (SomoPal). The design course also showed me that I should have written down formal requirements and trade-offs before coding. I would add an "Alternatives considered" section and clearer non-functional targets, such as p95 response time and rate-limit thresholds, so I can measure whether the application meets them.

## What I will learn next

Next I want to learn how to test systems under heavy load, so I can check estimates like the big-sale peak instead of only calculating them. After that I will study caching strategies and message queues in more depth, and practice applying them to a real project through small, deployed experiments.
