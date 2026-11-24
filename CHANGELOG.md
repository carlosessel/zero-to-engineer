# Changelog

All notable changes to this project are recorded here, newest first.

## Unreleased

### 2026-11-24: Zero to Money and Investing, part 5

Added
- Part 5 of Zero to Money and Investing, "How money changes over time": inflation and real returns (price indices built from a basket, what inflation does to cash, nominal against real, comparing money across years, central banks and the policy rate), the time value of money (future and present value, discounting, NPV, annuity and perpetuity formulas, FV, PV, NPV, PMT and RATE in a spreadsheet), and how financial markets work (the main markets, primary and secondary markets, brokers, exchanges and depositories, the order book, bids, asks and spreads, market and limit orders, market capitalisation and indices, trading costs, what regulators do and do not do).
- Walkthroughs: savings that grow but buy less, a course's payments discounted year by year at two rates, and orders matched in an order book.
- Optional Python checks: savings against inflation year by year, and an NPV function.
- Country notes checked on 24 November 2026: Ghana's and the UK's latest inflation (5.5% and 3.6% in October 2026) and targets; SEC Ghana's register and the GSE's licensed dealing members; the FCA Register and FSCS investment protection.
- 54 glossary terms. "Derivative", "Exchange" and "Nominal" now give their finance meaning alongside their existing meanings in other courses.
- The interest and numbers chapters now link to the new inflation and time value chapters.

### 2026-11-24: Zero to Money and Investing, part 4

Added
- Part 4 of Zero to Money and Investing, "Personal accounting": personal bookkeeping (accounts, transactions, categories, transfers, SUMIF totals, reconciling a statement), household accounts (a year's income statement, balance sheet and cash flow statement for one household, depreciation, why a surplus is not cash, savings rate and other measures), and double-entry bookkeeping (the accounting equation, debits and credits, journal, ledger and T-accounts, accrual accounting, the trial balance, and statements from it).
- Walkthroughs: reconciling a month's record against a bank statement, a balance sheet staying in balance through a year, and eight business transactions posted to the ledger.
- Optional Python checks: the household statements tie together, and a small ledger whose balances sum to zero.
- 30 glossary terms. "Transaction", "Ledger" and "Posting" now give their finance and database meanings separately, and "Debit" and "Credit" include their bookkeeping meanings.

Changed
- Every Zero to Money and Investing chapter is now marked resources-verified. Nine chapters with code were marked code-verified, which told readers their resources had not been checked, though every resource had been opened.

### 2026-11-24: Zero to Money and Investing, part 3

Added
- Part 3 of Zero to Money and Investing, "Interest, debt and credit": simple and compound interest (compounding frequency, nominal and effective rates, APR and AER, the rule of 72, saving regularly), how loans work (repayment formula and schedule, longer terms, paying extra, flat-rate loans and upfront fees, PMT and RATE in a spreadsheet), getting out of debt (debt-to-income ratio, predatory lending, the minimum-payment trap, avalanche and snowball, consolidation, getting help), and credit scores and reports (what bureaus hold, utilisation, how lenders decide, building and protecting a record).
- Walkthroughs: simple against compound interest year by year, a loan's repayment schedule, avalanche and snowball side by side on the same three debts, and a credit application from lender to bureau and back.
- Country notes checked on 24 November 2026: Ghana's licensed credit bureaus (Bank of Ghana list) and digital lender licensing; UK representative APR, the 14-day cooling-off period, statutory credit reports and free debt advice.
- 33 glossary terms. "Principal" and "Term" now have separate definitions for finance and for the courses that already used them, and "Credit" gives both of its finance meanings.

### 2026-11-23: Zero to Money and Investing, part 2

Added
- Part 2 of Zero to Money and Investing, "Your money day to day": income and payslips (income tax in bands, marginal and effective rates, converting pay, irregular income), budgeting (tracking, needs and wants, sinking funds, 50/30/20, zero-based and envelope budgets, budget against actual), saving and emergency funds (goals, standing orders, building a fund in stages, safety, liquidity and return, savings groups and susu), and banks, mobile money and payments (accounts, payment methods, statements, fees, remittances, deposit protection, account safety).
- A walkthrough in each: income filling Ghana's 2026 tax bands, a budget's envelopes through one month, an emergency fund built, used and rebuilt, and a bank statement read line by line.
- Country notes for Ghana and the UK, checked against official sources on 23 November 2026: GRA's monthly PAYE bands from 1 September 2026, SSNIT contribution rates, UK income tax and National Insurance for 2026 to 2027, ISAs, and deposit protection (GDPC limits now and from 1 January 2027; FSCS £120,000).
- 50 glossary terms. "Return" and "Variance" now have separate definitions for finance and for the courses that already used them.

### 2026-11-23: Zero to Money and Investing, part 1

Added
- A new course, Zero to Money and Investing (`finance`), on personal finance, personal accounting and investing, taught from zero. The full outline (38 chapters in 10 parts) is in docs/plans/finance-outline.yaml; this adds part 1, "Start here": what personal finance is (with a plain statement that the course is education, not financial advice, and that rules vary by country), the maths of money (38 graded practice problems), and spreadsheets for money. Examples use fictional people and Ghana cedis; country-specific facts sit in dated country notes for Ghana and the UK.
- Each chapter has a walkthrough: a month's pay split four ways, a price going up 50% and down 50%, and a formula copied down a growth table.
- A gold line colour for the course on the map (#9C6B00 light, 4.3:1 against the background; #FCC419 dark, 11.2:1).
- 30 glossary terms. "Rate" now has separate definitions for finance and for monitoring.

### 2026-11-23: Every course is now "Zero to …"

Changed
- Software Engineering Mastery is now **Zero to Senior Engineer**, and Mastering Claude and Claude Code is now **Zero to Claude Expert**, so every course is named for where it takes you, from zero. Their project chapters are now "The senior engineer projects" and "The Claude expert projects". Addresses (/mastery/, /claude/) and saved progress are unchanged. Older entries below keep the names used at the time.

### 2026-11-23: A new look: the transit map

Changed
- The site's look is built on one idea: every course is a line on a transit map, and every line leaves the same station, Zero. The home page opens with that map, drawn at build time from the course files. Each course is a coloured line, each part is a stop, and a stop is drawn as an interchange when it shares chapters with another course. Stops fill in as you finish parts. Pointing at a line picks it out, pointing at a stop names that part, and clicking a line opens its course. The map draws itself once per visit (not with reduced motion) and is hidden on phones, where each course in the list shows its own small line instead.
- A course page is that course's line running down the page, with a station for every chapter and "Also in…" on chapters shared with other courses. The chapter sidebar uses the same line, with the current chapter ringed.
- New colours: cool paper or graphite backgrounds, ink text, one blue for actions, and a colour for each course, with separate light and dark values. Body text contrast is at least 6:1, and every course colour is at least 3:1 against the background in both themes.
- Removed the gradient washes, floating orbs, gradient-highlighted headline words, lifting cards with identical shadows, and all-caps labels. Points, streaks, trophies and celebrations are unchanged, restyled to match.
- Followed Anthropic's frontend-design skill (claude-plugins-official): ground the design in the subject, write a token plan, check it against generic defaults, spend boldness in one place.

### 2026-11-23: A walkthrough in every chapter

Added
- Every chapter of every course now has at least one step-by-step walkthrough (245 chapters, 251 walkthroughs, about 2,000 steps). Only the library and glossary pages have none. A test fails if a chapter is added without one.
- Walkthroughs can now be written as data, in a `walkthrough.yaml` next to the chapter, as well as coded lessons that run an algorithm. Each is built from the chapter's own example, names and code.
- Four new kinds of picture: messages passed between actors (requests, logins, queues), boxes and arrows (architecture, Git, trees, pipelines), names pointing at values (variables, memory, settings) and a terminal.
- docs/walkthroughs.md: how to write one, the picture types and how much text fits.

Changed
- Walkthroughs are marked as generated, so the migration check no longer counts their code panels as chapter code blocks. This also fixes the check for the seven chapters that got walkthroughs earlier today.

Checked
- tests/walkthrough.test.ts checks every walkthrough parses, its text fits its boxes, graph nodes do not overlap, messages name real actors, highlighted lines exist, ids are unique and each is used once in its own chapter.
- Every walkthrough was clicked through, every step and every example, in the built site: no script errors.
- Spot checks of the helpers' flagged points against the chapters (figures, SQL results, worked numbers). Where a walkthrough uses an invented example value it says so in its text ("suppose…").

Not checked
- No subject expert has reviewed the walkthroughs, as with the chapters. Numbers were computed and SQL results matched to the chapters, but the ML library steps (PyTorch, NumPy) were not run, because those libraries are not installed where they were written.

### 2026-11-23: Step-by-step visual walkthroughs

Added
- A `<Walkthrough name="…" />` component: a picture that changes with each step, a sentence explaining the step, Back, Next, Play and a step slider (the arrow keys work too), the code with the running line highlighted, and the values of its variables. Items keep their identity between steps, so they slide to their new places rather than jump. It works in light and dark mode, on a phone, with reduced motion, and shows the first step without JavaScript.
- Six walkthroughs, each running the real algorithm and recording what it does: binary search (three targets, one missing), insertion sort (mixed, nearly sorted, backwards), stack versus queue, a chained hash table with collisions and a failed lookup, breadth-first search over the graphs chapter's towns, and LEFT versus INNER JOIN. They appear in Algorithms, Data structures, Sorting and searching, Lists, stacks and queues, Arrays and hash tables, Graphs, and Joins.

Checked
- tests/walkthrough.test.ts runs the Python shown beside each walkthrough (and the join's SQL in SQLite) and checks it gives the same answers as the pictures; it also checks every step renders valid SVG with unique keys. An end-to-end test drives the controls.

### 2026-11-14: Zero to Database Expert, a new course, and more for Zero to Backend Engineer

Added
- Zero to Database Expert: a ten-part course from a first SELECT to running PostgreSQL in production, with 29 new chapters (the map, setup, SELECT, aggregates, joins, subqueries and CTEs, changing data, types and functions, window functions, advanced queries, JSON and full-text search, tables and constraints, modelling, views and functions, indexes, query plans, performance, transactions and locking, security, operations, migrations, other engines, analytics, vectors, interview SQL, projects, careers, a checked library and a glossary) and nine chapters reused from the Mastery and Backend courses. Every example uses one bakery dataset, and almost every query's output in the chapters was produced by running it.
- A `postgres` kind of example check: SQL blocks run in PGlite (PostgreSQL 18 compiled to WebAssembly, with the btree_gist, pg_trgm, pgcrypto, tablefunc, citext and pgvector extensions) by tests/examples/pg_runner.mjs, and their output is compared in psql's format. The CI examples job now installs Node and the npm packages for it.
- Backend: new chapters on Kotlin and Spring Boot in Kotlin, gRPC and GraphQL, Redis from your service, deploying to the cloud end to end, debugging and profiling in each stack, and the back-end interview; Kubernetes and cloud infrastructure chapters added to Shipping and running; and three new parts made mostly of Mastery chapters: Working in a codebase, Computer science fundamentals, and Interview preparation.
- About 110 glossary terms for the new chapters, and the Backend and Databases courses added to the terms their reused chapters use.

Checked
- The Kotlin programs and Spring Boot API are built with Gradle and called with curl; the gRPC and GraphQL services and the Node profiling, Java deadlock and interview programs run in their checks; the Redis examples run against Redis 8 in Docker (only when EXAMPLES_DOCKER=1).

Not checked by running
- The cloud deployment commands, which create billable resources (their flags and the workflow's action inputs were checked against the official references); two-session locking demonstrations, which PGlite's single connection cannot show and are given as timelines; statistics views that need a real server (pg_stat_statements, replication and activity); and the .NET and Java snippets that need a full project (gRPC, GraphQL, Redis caching).

### 2026-11-13: Zero to Backend Engineer, part 14 (Reference): the course is complete

Added
- The library: 39 free (or, where marked, paid) courses, books and documentation sets grouped by part and by track, from Pro Git and the twelve-factor app to the official .NET, Spring and Node learning paths, OWASP's top tens and Google's SRE books, each opened and checked.
- The course glossary page, listing every term the course uses.

Changed
- Chapters written before the chapters they mention now link to them: the Node basics chapter to HTTP and the Node API chapter; the Java build chapter to the Spring API chapter; the API, dependency injection and LINQ chapters to the data, security and background work chapters; and the authentication chapter to integration testing.

### 2026-11-13: Zero to Backend Engineer, part 13 (The job)

Added
- The project ladder: six projects from a validated read-only menu API to orders with a database, accounts and permissions, background work and events with an outbox and an idempotent consumer, a production-ready deployment with telemetry, and a service of the learner's own design, each with a specification, a definition of done and the chapters to revisit. The part also reuses the chapters on Git in a team, teamwork, AI coding tools and careers.
- The course added to the glossary terms the reused chapters use.

### 2026-11-13: Zero to Backend Engineer, part 12 (AI in the back end)

Added
- The AI part, made of four existing chapters from the AI course: calling a language model, tools, structured output, and retrieval-augmented generation.
- The course added to the glossary terms these chapters use.

### 2026-11-13: Zero to Backend Engineer, part 11 (Shipping and running)

Added
- Two chapters. Deploying a service: the twelve-factor rules, configuration and secrets, liveness and readiness checks in each stack (ASP.NET Core health checks, Spring Boot Actuator probes, Node endpoints with a readiness-first shutdown), container images for each stack, Docker Compose with PostgreSQL, migrations as a deployment step with expand and contract, and zero-downtime rolling deployments. Logging, metrics and tracing: structured JSON logs with context (`ILogger` scopes, Spring's ECS format with MDC, pino child loggers), metrics (Micrometer with Prometheus, prom-client, `System.Diagnostics.Metrics`), and OpenTelemetry tracing. The part also reuses seven Mastery chapters on containers, load balancing, delivery, observability, memory, performance and reliability.
- The health checks run in the checks in all three stacks (ready turns 503 when the database check fails, live stays 200); the Compose file is parsed and its structure checked; the log lines, Prometheus metrics and OpenTelemetry spans and metrics (exported to memory) are all compared with the chapter.
- 6 glossary terms, and the course added to the existing terms the chapters use.

Fixed
- The glossary entries "Root" and "Virtual machine" had no meaning for this course; both now do.

Not verified
- No person has reviewed these chapters. The Dockerfiles and the Node OpenTelemetry setup were not run, because Docker and a collector were not available where the checks ran.

### 2026-11-13: Zero to Backend Engineer, part 10 (Design and architecture)

Added
- The design part, made of eight existing Software Engineering Mastery chapters: SOLID, behavioural patterns, domain-driven design, architecture styles, enterprise patterns, distributed systems basics, resilience, and system design.
- The course added to the glossary terms these chapters use.

### 2026-11-13: Zero to Backend Engineer, part 9 (Background work and messaging)

Added
- Two chapters. Background jobs: the same receipt queue, retry with exponential backoff, scheduled report and graceful shutdown built with a .NET `BackgroundService` and `Channel`, with Spring's `@Scheduled` and a virtual-thread worker, and with a Node worker loop; when to move to a durable job queue (Hangfire, Quartz, JobRunr, BullMQ, pg-boss); idempotency, jitter, dead letters and running schedules once. Kafka clients: producer and consumer settings, Confluent.Kafka, Spring for Apache Kafka with a dead-letter error handler, Confluent's JavaScript client, retries and dead-letter topics, idempotent consumers and the transactional outbox. The part also reuses the Mastery chapters on async, messaging and Kafka.
- The background job programs run in the checks and print the same lines in all three stacks. The Kafka client code is compiled (.NET, Spring) or type-checked (Node) against the real libraries, and the outbox program runs on PGlite with a crash injected into the relay, showing the duplicate it causes being ignored by the idempotent consumer.
- 6 glossary terms, and the course added to the existing terms the chapters use.

Not verified
- No person has reviewed these chapters. No Kafka broker was available where the checks ran, so the Kafka producers and consumers were compiled but not run against one; the BullMQ example needs Redis and was not run.

### 2026-11-13: Zero to Backend Engineer, part 8 (Testing services)

Added
- A chapter on integration testing in each stack: test doubles (fakes, stubs and mocks), the same orders API tested through HTTP with ASP.NET Core's WebApplicationFactory and a fake `TimeProvider`, with `@SpringBootTest` on a random port and a fixed `Clock`, and with Supertest and Vitest (including a mock that makes the store fail); Testcontainers for real databases; contract tests; and what makes tests trustworthy. The part also reuses the Mastery testing chapter.
- The checks build and run all three test suites (5, 5 and 6 tests), and the practice test is added to the .NET suite and must pass.
- 3 glossary terms, and the course added to the existing terms the chapter uses.

Not verified
- No person has reviewed this chapter. The Testcontainers examples were not run, because Docker was not running where the checks ran. The other checks download packages, so they run only where network checks are switched on.

### 2026-11-13: Zero to Backend Engineer, part 7 (Security)

Added
- A chapter on authentication and authorisation in each stack: password hashing, sessions versus JWT bearer tokens, identity providers, and the same small API (a token endpoint, an orders endpoint with an ownership check, and a staff-only report) built three times, with ASP.NET Core's JWT bearer handler and policies, Spring Security's resource server and `@PreAuthorize`, and Express with `jose` and Node's scrypt. The part also reuses the Mastery chapters on application security and identity.
- All three implementations run in the checks and must produce the same table of results: 401 with no or a tampered token, 404 for another customer's order, 403 for a customer on the staff report.
- 4 glossary terms, and the course added to the existing terms the chapters use.

Not verified
- No person has reviewed this chapter. The checks download packages, so they run only where network checks are switched on; tokens from a real identity provider were not tested.

### 2026-11-13: Zero to Backend Engineer, part 6 (Data)

Added
- Three chapters on data access in each track: Entity Framework Core 10 (model, LINQ to SQL, change tracking, bulk updates, N+1, migrations, transactions and concurrency tokens); Spring Data JPA with Hibernate 7 and Flyway (entities, derived and JPQL queries, projections, `@Transactional`, N+1, `LazyInitializationException`, optimistic locking); and Node.js with Drizzle ORM on PostgreSQL (schema in TypeScript, generated migrations, typed queries, relational queries, transactions, optimistic concurrency, and a live SQL-injection comparison). The part also reuses the SQL, relational database, schema design, caching and NoSQL chapters.
- The checks run every example against a real database: SQLite for EF Core, H2 for JPA (the Spring project is built with Gradle and run, and its printed output must match the chapter), and PGlite, PostgreSQL 18 compiled to WebAssembly, for Node, where the check also regenerates the migration with drizzle-kit and compares it with the chapter. Each chapter counts SQL statements to show the N+1 problem and its fix.
- 15 glossary terms, and the course added to the existing terms the chapters use.

Fixed
- The glossary entry "Entity" now also gives the ORM meaning.

Not verified
- No person has reviewed these chapters. The checks download packages, so they run only where network checks are switched on; none ran against a PostgreSQL or SQL Server server.

### 2026-11-13: Zero to Backend Engineer, part 5 (HTTP and APIs)

Added
- Five chapters: HTTP for back-end engineers (methods, safety and idempotency, status codes, problem details, caching with ETags, cookies, CORS, input validation); building an API with ASP.NET Core minimal APIs; with Spring Boot 4.1; with Express 5 and Zod 4 (plus a look at Fastify and NestJS); and dependency injection and service structure in all three stacks. The part also reuses the Mastery chapters on API design and real-time communication.
- The examples run in the checks as real servers: each ASP.NET Core and Express example starts, calls itself and stops; the Spring Boot project is built with Gradle, started, and called with the chapter's own `curl` commands, whose output must match the chapter; the Spring configuration example must refuse to start with a bad setting.
- 17 glossary terms, and the course added to the existing terms the chapters use.

Fixed
- The glossary entry "Singleton" now also gives the dependency-injection meaning.

Not verified
- No person has reviewed these chapters. The Spring, Express, OpenAPI and Node setup checks download packages, so they run only where network checks are switched on.

### 2026-11-13: Zero to Backend Engineer, part 4 (Node.js and TypeScript track)

Added
- A chapter on Node.js as a server platform: running TypeScript with type stripping, arguments and environment variables, files and streams, the event loop and how blocking it delays every request, Node's built-in HTTP server, and testing with Vitest. The part also reuses the web course's six JavaScript and TypeScript chapters.
- Every example runs with Node in the example checks (the event-loop ordering, the 200 ms block, and the HTTP server answering `fetch`), and the Vitest files run with Vitest.
- 2 glossary terms, and the course added to the existing terms the reused chapters use.

Fixed
- The glossary entries "Element" and "Key" now also give the meaning the JavaScript chapters use (an item in an array; the name a value is stored under in an object or map), which the web course was missing too; "Chaining" has a meaning for this course.

Not verified
- No person has reviewed this chapter. The checks ran on Node 24, not the Node 26 that the setup chapter recommends.

### 2026-11-13: Zero to Backend Engineer, part 3 (Java track)

Added
- Five chapters teaching Java from zero: values, types, decisions, loops and methods; classes, records, enums, interfaces, sealed types and `Optional`; collections, generics, lambdas and streams; checked and unchecked exceptions, try-with-resources, executors, `CompletableFuture`, virtual threads and thread safety; and Gradle and Maven builds, Maven Central, wrappers and JUnit tests.
- Every Java example runs as a single-file program in the example checks (on Java 21, the oldest version the chapters support). The build chapter's checks build the bakery project with Gradle, run its JUnit tests, and check that the practice test fails before the change and passes after it; the Maven `pom.xml` is checked for well-formed XML.
- 15 glossary terms, and the course added to the existing terms the chapters use.

Fixed
- The glossary entries "Package", "Plugin", "Build tool" and "Stream" now give the meaning each course uses.

Not verified
- No person has reviewed these chapters. The Maven build was not run, because Maven is not installed where the checks ran; the Gradle checks download JUnit, so they run only where network checks are switched on, and they use an installed Gradle (8.14 here) rather than the current release.

### 2026-11-13: Zero to Backend Engineer, part 2 (C# and .NET track)

Added
- Five chapters teaching C# from zero: values, types, decisions, loops and methods; classes, records, enums, interfaces, inheritance and nullable reference types; collections, generics, lambdas and LINQ; exceptions, `using`, async and await, `Task.WhenAll`, cancellation and timeouts; and .NET projects, solutions, NuGet and unit tests with xUnit.
- Every C# example runs as a file-based app in the example checks, and the projects chapter's checks build the whole Bakery solution with `dotnet new`, run its xUnit tests, and check that the practice test fails before the change and passes after it.
- 17 glossary terms, and the course added to the existing terms the chapters use.

Fixed
- The glossary entries "Project", "Namespace" and "Property" now give the meaning each course uses; "Variable" has a meaning for this course.

Not verified
- No person has reviewed these chapters. The projects chapter's checks download NuGet packages, so they run only where network checks are switched on.

### 2026-11-13: Zero to Backend Engineer, part 1 (Start here)

Added
- The Backend course, with its first part: what a back-end engineer does (the journey of a request, a typical week, and how to choose between the C# and .NET, Java and Spring, and Node.js and TypeScript tracks), and setting up your tools (the current LTS toolchains, .NET 10, Java 25 and Node.js 26, checked against each project's release pages; editors; Git; Docker; HTTP clients). The part also reuses four existing chapters: how computers work, the terminal, Git basics and how the internet works.
- The first programs for all three tracks run in the example checks with the installed toolchain (C# as a single file with `dotnet run`, Java as a single source file, TypeScript with Node.js's built-in type stripping), each printing the version that actually ran.
- 6 glossary terms, and the course added to 35 existing terms used in the reused chapters.

Fixed
- Three glossary entries with per-course meanings ("API", "JSON", "PATH") had no meaning for the new course, which would have broken its glossary page; each now has one, and every per-course entry was checked to cover every course that uses it.
- Comparison tables with an empty top-left header cell fail the accessibility check (empty-table-header). The new track table was caught by the test; the same problem in seven published chapters (five Mastery, two Claude) that the test does not visit is fixed too, with a label for each first column.

Not verified
- No person has reviewed these chapters. The Docker check runs only where Docker checks are switched on.

### 2026-11-13: Software Engineering Mastery, part 12 (Reference): the course is complete

Added
- The library: 30 books and courses grouped by part, from Computer Systems: A Programmer's Perspective and Designing Data-Intensive Applications to Google's SRE books and MIT's distributed systems course, each opened and checked.
- The course glossary page, listing all 786 terms the course defines.
- Software Engineering Mastery now has 12 parts and 73 chapters (71 of its own and 2 reused from other courses).

Fixed
- The glossary entry for "API" had per-course definitions without one for this course, which only showed up when the course's glossary page was built; it now has one.

### 2026-11-13: Software Engineering Mastery, part 11 (The engineer)

Added
- Four new chapters: how great engineers work (problems before solutions, slicing work, RICE prioritisation, estimates, communication, writing, working with product and design); growing from junior to senior and beyond (levels and tracks, learning new technology, reading code and its history, deliberate practice, mentoring); privacy, ethics and the law (data protection principles in engineering terms, anonymisation pitfalls, accessibility duties, open-source licences, dark patterns, saying no); and the mastery projects (a key-value store, a message queue, a distributed rate limiter and a production-quality service, each in stages). The part also reuses two existing chapters: Git with other people, and working with AI coding tools. About 8,300 words of new text, 18 practice problems, 24 quiz questions, 20 checked resources.
- Checked examples: RICE scoring, a real Git repository explored with `log`, `blame` and `log -S`, log redaction of emails, phones, cards and secrets, a k-anonymity check that re-identifies 3 of 5 people, and a log-structured key-value store that recovers after a restart and compacts its log.
- Earlier chapters now link to the ethics chapter.
- 15 glossary terms.

Fixed (found while checking)
- The card-number redaction pattern swallowed the following space; it now matches only the digits.
- ACM's code of ethics blocks automated link checks (403), which would fail the outside-link workflow; the chapter links to the joint IEEE Computer Society and ACM software engineering code instead. A moved career-paths article was replaced with Dropbox's public career framework.
- "Effort", "Scope", "Focus" and "Compaction" are no longer glossary links in these chapters, where they have their everyday meanings.

Not verified
- No person has reviewed these chapters, and the legal content describes principles, not legal advice. Problem counts are below the standard's 30 to 50.

### 2026-11-13: Software Engineering Mastery, part 10 (Security)

Added
- Three chapters: application security and the OWASP Top 10 (2025 edition, checked against OWASP's published list), with threat modelling; authentication and authorisation (sessions, JWTs, OAuth 2.0 with PKCE, OpenID Connect, MFA and passkeys, RBAC, ABAC and ReBAC); and cryptography for engineers (hashes, password hashing, HMAC, authenticated encryption, signatures, envelope encryption, TLS, secrets). About 6,900 words, 15 practice problems, 18 quiz questions, 15 checked resources.
- Every example runs and is checked, all in Python against tiny self-contained programs: an access-control flaw and its fix, SQL injection against a parameterised query, HTML escaping, an SSRF address filter, a path-traversal check, a JWT signer and verifier rejecting forgery, `alg: none`, expiry and the wrong audience, the PKCE challenge from RFC 7636's own example, an RBAC and ABAC refund policy, SHA-256's avalanche effect, Argon2id against SHA-256 timing, AES-GCM rejecting tampering, and Ed25519 signatures.
- `cryptography` is added to the example harness's requirements, and the site's Run button now explains that examples importing it need a local install.
- Earlier chapters now link to the security chapters.
- 44 glossary terms.

Fixed (found while checking)
- One exercise line containing ": " was read by YAML as a mapping and broke the page build; it is now plain text.
- "Token" and "Scope" are no longer glossary links in these chapters, where they mean security tokens and OAuth scopes rather than the AI and JavaScript meanings.

Not verified
- No person has reviewed these chapters. Problem counts are below the standard's 30 to 50.

### 2026-11-13: Software Engineering Mastery, part 9 (Infrastructure and operations)

Added
- Seven chapters: Linux for engineers; containers and Docker in depth; Kubernetes; cloud and infrastructure as code (networks, IAM, cost, Terraform); continuous delivery (pipelines, trunk-based development, feature flags, canaries, DORA metrics); observability (structured logs, RED and USE metrics, tracing, OpenTelemetry, alerting); and reliability engineering (SLOs, error budgets, burn-rate alerts, incidents, blameless postmortems, backups). About 14,800 words, 35 practice problems, 42 quiz questions, 35 checked resources.
- Real shell examples, checked in a fresh folder: permissions and the umask, a worker that handles SIGTERM gracefully beside one killed by SIGKILL (exit status 137), and log analysis with awk, grep and sort. A Python example writes structured JSON logs with a request id; another plans subnets with `ipaddress`. TypeScript simulations cover Docker layer caching, the Kubernetes reconciliation loop, rolling updates and the autoscaler formula, IAM policy evaluation, a Terraform-style plan, sticky percentage feature flags, canary analysis, DORA metrics, RED metrics from a histogram, trace context propagation, nines and error budgets, and burn-rate alerts. Kubernetes and GitHub Actions YAML is parsed and its key settings asserted; the Compose file is validated with `docker compose config` when Docker checks are on.
- Earlier chapters now link to the containers, Kubernetes, delivery, observability and reliability chapters.
- 78 glossary terms.

Fixed (found while checking)
- A shell example's fixed half-second wait was too short on a busy machine; it now waits until the worker reports it has started.
- Example names clashing with browser globals (`Window`, `Request`) were renamed.
- Three glossary entries would have linked ordinary words in other courses ("Linux", "Metrics", "Red"); they were renamed or lost the alias. Two resources blocked automated checks or were paid (Netflix's blog, an O'Reilly book) and were replaced with free equivalents from the same authors' sources.

Not verified
- No person has reviewed these chapters. Kubernetes, Terraform, Docker builds and cloud services were not run (no cluster, Terraform or Docker daemon here). Problem counts are below the standard's 30 to 50.

### 2026-11-13: Software Engineering Mastery, part 8 (Distributed systems and messaging)

Added
- Eight chapters: distributed systems fundamentals (partial failure, timeouts, retries, idempotency, clocks, Lamport clocks); load balancers, proxies and CDNs; consistency and consensus (linearizability, CAP and PACELC, Raft, fencing, two-phase commit); messaging and queues (queues versus logs, RabbitMQ, delivery guarantees, dead letters, the transactional outbox); Kafka in depth; resilience patterns (circuit breakers, bulkheads, rate limiting, load shedding, sagas); patterns for services in the cloud (twelve-factor, sidecars, backends for frontends, load levelling, valet keys); and system design, worked through a URL shortener, a feed, chat and payments. About 18,200 words, 39 practice problems, 48 quiz questions, 40 checked resources.
- Simulations that run and are checked: retries with jitter and amplification, idempotent payment handling, last-write-wins losing data to clock skew, Lamport clocks, four load-balancing algorithms under uneven load, a five-node Raft-style election and commit across a network partition, Kafka partitioning, consumer groups, offsets and compaction, a circuit breaker, bulkhead, token bucket and saga, queue-based load levelling, and a double-entry ledger. Python examples run an idempotent consumer and a transactional outbox on SQLite, and verify signed storage URLs. A C# example runs a real Polly retry and circuit breaker pipeline (network checks only).
- Earlier chapters now link to the messaging, Kafka, resilience and consensus chapters.
- 63 glossary terms.

Fixed (found by running the examples)
- My drafts' base62 code for 125,000,000 (`8SUD2`), the field count of the web product page (9), and the wording of the Lamport clock output were wrong until the code ran. Example names that clash with browser and TypeScript built-ins (`Node`, `Pick`) were renamed.
- Two resource links had moved or blocked automated checks (LinkedIn's "The Log" essay, Cloudflare's CDN explainer); the chapters now link to the Kafka introduction and MDN's CDN entry instead.

Not verified
- No person has reviewed these chapters. Kafka, RabbitMQ and Raft behaviour is simulated or described from documentation, not run against real brokers. Problem counts are below the standard's 30 to 50.

### 2026-11-13: Software Engineering Mastery, part 7 (Data)

Added
- Five chapters: relational databases in depth (pages, B-tree indexes, query plans, ACID, the write-ahead log, isolation levels and anomalies, MVCC, connection pools); schema design and migrations (normalisation, keys including UUIDv7, types, constraints, denormalising deliberately, expand-and-contract migrations); NoSQL and search (key-value, document, wide-column and graph stores, inverted indexes and BM25, vector and time-series stores, choosing); caching (HTTP caching, cache-aside and other patterns, TTLs and eviction, invalidation, stampedes); and replication and partitioning (leaders and followers, replication lag and read-your-writes, failover, quorums, range and hash partitioning, consistent hashing). About 11,800 words, 27 practice problems, 30 quiz questions, 25 checked resources.
- Real database behaviour, checked with SQLite through Python's standard library: a 300,000-row table scanned and then searched through an index (asserted at least 100 times faster), composite-index plans for five query shapes, a rolled-back transfer, a lost update and its atomic fix, an MVCC snapshot surviving another connection's commit in WAL mode, constraints rejecting bad rows, and a five-step expand-and-contract migration. TypeScript and Java examples cover key design, cache-aside with a fake clock, an LRU cache, request coalescing, replication lag, quorums, and keys moved by mod-N versus consistent hashing.
- Earlier chapters (performance, patterns, sorting and searching, enterprise patterns) now link to the data chapters.
- 57 glossary terms. "Snapshot" now gives both meanings.

Fixed (found by running the examples)
- My drafted numbers for the BM25 tie without length normalisation (0.88), the jitter example, and the share of keys moved by consistent hashing (25.5% with 100 points per node, above the ideal 20%; the text now explains why) were wrong until the code ran.

Not verified
- No person has reviewed these chapters. PostgreSQL-specific behaviour is described from its documentation, not run (no PostgreSQL server here). Problem counts are below the standard's 30 to 50.

### 2026-11-13: Software Engineering Mastery, part 6 (Concurrency)

Added
- Three chapters: threads, races and locks (read-modify-write and check-then-act races, locks and atomics, memory visibility, deadlock and lock ordering, thread-safe design); asynchronous programming (the event loop, promises and futures, async/await, combinators, cancellation, thread pools and sync-over-async, Java virtual threads); and concurrency patterns (producer-consumer with back-pressure, worker pools and bounded concurrency, actors, immutable snapshots with atomic swaps, lock-free ideas, fan-out and structured concurrency). About 6,100 words, 16 practice problems, 18 quiz questions, 14 checked resources.
- Real concurrency, checked: Java races with synchronized and atomic counters, a deadlock forced every run with a latch and detected with `tryLock`, lock ordering that fixes it, virtual threads against a 100-thread pool, a bounded `BlockingQueue` pipeline, `AtomicReference` with `ConcurrentHashMap.merge` across parallel streams; C# `Interlocked`, `Task.WhenAll` and bounded channels; TypeScript event-loop ordering, a race across `await`, promise combinators, `AbortSignal` cancellation, bounded concurrency and an actor. Results that depend on timing are checked by the relationship the chapter states.
- TypeScript example checks accept `wait_ms`, so examples with timers can finish; the example runner provides `AbortController` and `AbortSignal`.
- Earlier chapters (inside the machine, operating systems, performance) now link to the concurrency chapters.
- 33 glossary terms.

Not verified
- No person has reviewed these chapters. Problem counts are below the standard's 30 to 50.

### 2026-11-13: Software Engineering Mastery, part 5 (Testing and quality)

Added
- Three chapters: testing in depth (the pyramid, test doubles, TDD, Testcontainers, contract, property-based and mutation testing); linters, formatters and static analysis (type checkers, analysers, dependency and secret scanning, hooks and CI quality gates); and performance (percentiles, Little's and Amdahl's laws, profilers and flame graphs, benchmarking pitfalls, load testing and coordinated omission, common anti-patterns). About 6,750 words, 17 practice problems, 18 quiz questions, 14 checked resources.
- The chapters' Vitest test files run for real (three projects, 10 tests). Other checks: a C# build that fails on a nullable warning as intended, a cyclomatic complexity analyser in Python's `ast`, a Java benchmark checked by the relationship it shows (quadratic `+=`, StringBuilder far faster), and TypeScript examples for percentiles, Amdahl's law, property testing, mutation testing and N+1 queries.
- Earlier chapters (clean code, OOP, runtimes, memory, anti-patterns) now link to the new testing, static analysis, performance and domain-driven design chapters instead of saying "later in this course".
- 34 glossary terms. "Mock" and "Type checker" now cover their meaning in this course too.

Fixed (found by running the examples)
- My drafted outputs for the percentile example (mean 95 and p95 236, not 105 and 220) and the property-based test's first counterexample were wrong until the code ran.

Not verified
- No person has reviewed these chapters. Problem counts are below the standard's 30 to 50. The JUnit, Testcontainers and k6 examples are not run: they need JUnit and a build tool, Docker, and the k6 tool.

### 2026-11-13: Software Engineering Mastery, part 4 (Design patterns and software design)

Added
- Ten chapters: creational, structural and behavioural design patterns; anti-patterns and over-engineering; patterns for business applications (repository, unit of work, DTOs, optimistic concurrency); domain-driven design; architecture styles (layered, hexagonal, clean, modular monolith, microservices, event-driven, CQRS, event sourcing); designing APIs (REST, problem details, cursor pagination, idempotency keys, versioning, gRPC, GraphQL, webhooks); real-time communication (polling, server-sent events, WebSockets); and design documents and trade-offs (design docs, ADRs, C4, estimates). About 21,000 words, 54 practice problems, 60 quiz questions, 42 checked resources.
- Every runnable example is checked: 45 TypeScript, 5 Java, 3 C# and 2 Python. The C# examples include a real Entity Framework Core unit of work on in-memory SQLite and the .NET dependency injection lifetimes; they fetch NuGet packages, so they run only with network checks on. The Python examples run a real server-sent events stream end to end and verify HMAC webhook signatures.
- The JavaScript example runner now provides `btoa` and `atob`, as browsers and Node.js do.
- About 95 glossary terms. "Repository", "Proxy" and "Event" now give the meaning for each course that uses them; "hook", "feature", "snapshot", "container" and "component" are no longer glossary links in part 4, where they mean something else.

Fixed (found by running the examples)
- Several printed results in my drafts were wrong until the code ran: the polling waste at one-minute intervals (93%, not 99%), the seeded jitter delays, a weighted decision matrix score (24, not 25), and a three-point estimate (11.3 days, not 10.8).
- Example names that clash with browser globals (`History`, `history`, `status`, `Request`, `Event`) failed the strict type check and were renamed.

Not verified
- No person has reviewed these chapters. Problem counts are below the standard's 30 to 50 (5 or 6 each). The gRPC, WebSocket and browser `EventSource` snippets are not run (they need servers this course does not install). On this machine the type-check tests sometimes exceed their 5-second limit under heavy load from other software; they pass with a longer limit.

### 2026-11-13: Software Engineering Mastery, part 3 (Writing excellent code)

Added
- Ten chapters: clean code; object-oriented programming in depth; handling errors well; debugging systematically; the SOLID principles; design principles beyond SOLID (DRY, KISS, YAGNI, composition, coupling and cohesion, Demeter); type systems and modelling with types; functional programming; refactoring safely; and code review. About 19,000 words, 64 practice problems, 60 quiz questions, 39 checked resources.
- Every example runs with its output checked: 65 TypeScript, 6 Java, 4 C# and 1 JavaScript example (a real Node stack trace, checked frame by frame). Two TypeScript blocks are checked for the exact type error they are meant to show (TS2322 for mixed-up branded ids, TS18048 for a possibly undefined value).
- The dependency injection example in C# uses a `#:package` line and runs only when network checks are on.
- About 60 glossary terms. "Variance", "Assertion" and "Type" now give the meaning for each course that uses them.

Fixed (found by running the examples)
- The SMS example in the composition section cut its text at a different point from the one the prose showed; the prose now matches the output.
- The clean code chapter's money practice prints 3.8000000000000007, not 3.8; the answer now says so and explains why.
- Links to chapters that do not exist yet (part 4's patterns and domain-driven design, part 5's static analysis) are plain text.

Not verified
- No person has reviewed these chapters. Problem counts are below the standard's 30 to 50 for foundational chapters (5 to 8 each).

### 2026-11-13: Software Engineering Mastery, part 2 (Data structures and algorithms)

Added
- Eight chapters: complexity and Big O; arrays, strings and hash tables; linked lists, stacks, queues and deques; trees, heaps and tries; graphs; sorting, searching and core techniques; recursion, backtracking and dynamic programming; and solving problems you have not seen before. About 24,100 words, 80 practice problems, 38 quiz questions, 29 checked resources.
- Every algorithm in the text runs: 65 TypeScript examples (runnable on the page) and 7 Java and C# examples, all with their output checked.
- Platform facts checked against the source rather than memory: the JDK's HashMap (16 buckets, 0.75 load factor, tree bins at 8 entries), ArrayList's growth by half, Java's TimSort and dual-pivot quicksort, TreeMap as a red-black tree, PriorityQueue as a binary heap; .NET's doubling List and its documented unstable sort; V8's TimSort.
- A new test (tests/mdx-braces.test.ts) fails when a chapter has { } in its prose outside code, which MDX would run as JavaScript.
- About 75 glossary terms. "Root", "Children", "PATH" and "Chaining" now give the meaning for each course that uses them.

Fixed (found by running the examples)
- Part 1's discrete maths table showed the sets {1, 2, 3} and so on as "3": MDX evaluated the braces as JavaScript. Caught while building part 2; now in code formatting, and guarded by the new test.
- Three of my own worked answers were wrong until the code was run: the oven-capacity binary search (15, not 20), the knapsack example (57 from butter, sugar and yeast, not 67), and the 80th Fibonacci number, which JavaScript numbers round (the chapter now uses this as a lesson about 2^53).
- A word-ladder answer listed a different, equally short ladder from the one the code finds; the text now matches the code.

Not verified
- No person has reviewed these chapters. Problem counts are below the standard's 30 to 50 for foundational chapters (8 to 13 each, plus 12 in the problem-solving chapter); more practice sets would help.

### 2026-11-13: Software Engineering Mastery, part 1 (How the machine really works)

Added
- The course's first part, eight chapters: inside the machine (CPU, caches, latency numbers); numbers, text and time; operating systems; how code runs (compilers, bytecode, JIT); memory management and garbage collection; networking in depth; the maths engineers use; and what computers cannot do. About 22,700 words, 66 practice problems, 41 quiz questions, 32 checked resources.
- Java and C# examples are now checked automatically: new `java` and `csharp` kinds in the example harness run them as single-file programs (Java 21 here and Java 25 in CI; .NET 10), comparing output. 14 such examples in this part, beside TypeScript ones for the same ideas.
- Experiments whose numbers vary are asserted by the relationship the chapter claims: column-by-column traversal at least three times slower than row by row (about 25 times here), later rounds faster than the first after JIT warm-up, G1 chosen by the JVM, objects promoted through .NET's generations.
- `scripts/ts_output.ts` prints what each TypeScript block outputs, for drafting. The JavaScript example runner now provides `TextEncoder`, `TextDecoder` and `Intl`.
- About 175 glossary terms. "Virtual machine" now gives both meanings (a runtime's virtual machine, and a rented cloud server).

Fixed (found while checking)
- Facts updated from the sources: TLS 1.3 is now specified in RFC 9846 (2026), Unicode 18.0 is current, leap seconds stop from 20 May 2027, G1 is Java's default only on server-class machines, ZGC is generational only since JDK 24, and CPython 3.14.5 went back to its generational collector.
- A practice answer about thread and CPU limits mixed the two up; it now works out both and takes the lower.
- Glossary links that would have used the wrong meaning ("Reference" skills, .NET's "server" GC mode, "Routing" as route planning) are no longer links there.

Not verified
- No person has reviewed these chapters. Timings in the text are from one machine. The curl timing example needs the network and is checked only when network checks are on.

### 2026-11-12: A new look, and points, streaks and trophies

Added
- **A redesign.** A brighter palette in light and dark mode (violet, pink and amber on a soft background), heavier headings, a gradient logo, a home page with a big headline and a "player card", course cards with a coloured band and a picture each, coloured course headers, part cards, and a sticky, translucent header.
- **Points, levels and streaks.** Finishing a chapter (100), getting a whole quiz right (50 bonus), a right quiz answer (20), ticking an exercise (15), a right review answer (10, once a day per question) and running or showing a code example (5) earn points. Each thing earns once, so unticking and ticking again gains nothing. Thirteen levels from Newcomer to Legend; a streak of days in a row with any points; a daily goal (30, 60, 120 or 200 points).
- **Celebrations.** A floating "+20" where points are earned, confetti for finished chapters, perfect quizzes, new badges and the daily goal, messages for streaks and badges, and a level-up window. They respect "reduce motion": with it on, there is no animation.
- **Trophies page** (`/achievements/`): level, streak, best streak, daily goal, an activity grid of the last 18 weeks, and 16 badges with drawn medals.
- The header on every page shows your level, points and streak.
- Progress files are now version 3 (they add points, badges and the goal). Versions 1 and 2 are still read, and chapters and exercises finished before points existed count towards the total, though not towards any day's streak.
- Tests: the points rules (`tests/game.test.ts`), and browser tests for earning, the level-up window, the trophies page and accessibility on it.
- The browser tests can use their own build folder and port (`DIST_DIR`, `E2E_PORT`), so two builds can be tested at once.

### 2026-11-12: Mastering Claude and Claude Code, parts 4 to 6 (the course is complete)

Added
- Part 4, Building on the Claude API: the Messages API in depth, building agents, context engineering for long-running agents, and Managed Agents and Agent Skills, with the AI course's first-call, tool use, structured output and evals chapters reused. Part 5, Mastery: judgement, and five projects with checklists. Part 6: a library of Anthropic's courses, documentation and engineering articles, and the glossary. About 12,800 new words, 29 practice problems, 25 quiz questions. The whole course is 24 new chapters (about 48,000 words) plus 4 reused.
- The stand-in API server used by the example checks now imitates token counting, Message Batches and prompt-caching usage, so those examples run end to end. The API examples (streaming, caching, batches, routing, a hand-written agent loop, compaction, the memory tool, skills) are all run against it and their requests asserted.
- The Agent SDK example runs with a stand-in for its query function, checking its options with the real claude-agent-sdk 0.2.180. Managed Agents and Files API calls are checked against the installed SDK's method signatures.
- Five Claude pages added to the accessibility checks (passing in light and dark mode). The course's glossary, library and projects pages have short addresses (/claude/glossary/ and so on).
- 20 glossary terms; Routing now also used by the Claude course.

Fixed
- "Event" was briefly linked to its web meaning (a click or key press) from the Managed Agents chapter; that word is no longer a glossary link there.

Not verified
- Nothing ran against the live API; no API key is used anywhere. Managed Agents, compaction and context editing were beta features when checked, and the chapters say so.
- The cost arithmetic uses the prices on Anthropic's pages on 12 November 2026.

### 2026-11-12: Mastering Claude and Claude Code, part 3 (Claude Code)

Added
- Ten chapters on Claude Code: from zero, where it runs, context and CLAUDE.md, workflows, settings and permissions, skills, hooks and plugins, MCP, many agents at once, automation, and teams, security and cost. About 20,800 words, 57 practice problems, 46 quiz questions.
- Facts come from the Claude Code documentation, read on 12 November 2026; every linked page was opened.
- Checks: settings files, skills, subagent definitions and the GitHub workflow are parsed and their claims asserted. The hook script is run with the JSON Claude Code sends, to confirm it blocks with exit code 2. The MCP server is loaded with the real `mcp` package and each tool called. Command lines are checked against the installed `claude --help` (a new `needs: claude-cli` option skips these where Claude Code is not installed, such as CI).
- All 16 Claude course chapters are marked resources-verified.
- 22 glossary terms. "Hook" now gives both meanings (a React Hook, and a Claude Code hook).

Fixed (found by the checks)
- The MCP server example was first written for the old `FastMCP` API. Version 2 of the Python SDK (2.3.0) renamed it `MCPServer`, and the old import now fails. The chapter uses the new API and tells readers about the old name they will see in tutorials.
- The site's Python Run button now knows the `mcp` package cannot run in the browser, and says so.
- "Remote" and "Scope" were briefly linked to their Git and variable-scope meanings from the MCP chapter; those words are no longer glossary links there.

Not verified
- Commands that need a Claude Code login, cost tokens or change your machine (installing, `claude -p` runs, adding MCP servers) are not executed; their flags are checked against `claude --help` instead. The installed version (2.1.272) is slightly older than the documentation, and the documentation's `--max-turns` example is not listed by its `--help`.
- Sample prompts are not measured against a live model.

### 2026-11-12: Three new courses planned; Mastering Claude and Claude Code, parts 1 and 2

Added
- Outlines, approved, for three new courses, in docs/plans: Mastering Claude and Claude Code (24 new chapters), Software Engineering Mastery (71 new chapters; examples in TypeScript, with Java and C# where the languages differ) and Zero to Backend Engineer (one course with C#/.NET, Java and Node.js tracks; 30 new chapters, reusing 46, most of them from the Mastery course). They are written in that order, a part at a time.
- Mastering Claude and Claude Code, part 1 (How Claude works: the map, how Claude works, choosing a model) and part 2 (Using Claude well: prompting, the apps in depth, learning and writing with Claude). Six chapters, about 14,700 words, 39 practice problems, 31 quiz questions.
- Every fact about models, prices, effort levels and app features was checked against Anthropic's documentation and help centre on 12 November 2026, and every linked page opened. The API example runs against the stand-in server; the cost and token arithmetic is asserted in the example checks.
- 27 glossary terms for the new course.

Fixed
- The glossary said a token is roughly three-quarters of a word. On Claude's current tokeniser an English word is about 1.8 tokens (Anthropic's figure: about 555,000 words per million tokens), so the entry now says it depends on the tokeniser. "Batch" now gives both meanings (a training batch, and an API batch at half price).

Not verified
- Sample prompts in these chapters were written to Anthropic's guidance but not measured against a live model. No API key is used anywhere.
- Plan limits and menu names in the apps chapter change often; they are dated November 2026.

### 2026-11-12: Zero to Web Developer, part 4 (Front-end applications)

Added
- Six chapters: React components and props; state, events and forms; effects, loading data and routing (React Router 8); TypeScript basics; testing JavaScript and React (Vitest, React Testing Library); web performance. About 29,000 words including code, 77 practice problems (15 in each of the React and TypeScript chapters), 42 quiz questions, 30 exercises, 30 resource records, each opened on 12 November 2026.
- **React and TypeScript examples run on the page.** A React block that is a whole component file gets **Show the result**: Sucrase turns its JSX and types into JavaScript in the browser, and it runs in the sandboxed preview with React, ReactDOM and React Router from a bundle the site builds itself (`npm run vendor`, `public/vendor/react-runtime.js`, not committed). The bundle uses React's development builds on purpose, so warnings such as a missing `key` show under the example. TypeScript blocks get **Run**, with a note that the types are removed, not checked. `<Playground>` groups can mix CSS and JSX.
- **New kinds of check**: `react` (compiled exactly as the preview compiles it, then clicked and typed through in jsdom with user-event: `tests/react-blocks.test.ts`), `ts` (strict type-checking, with deliberate errors listed by code: `tests/ts-blocks.test.ts`), and `vitest-run` (a chapter's test files run with Vitest as a learner would: `tests/vitest-blocks.test.ts`). 139 code blocks in this part: 58 checked as React, 25 as TypeScript, 23 by running their tests with Vitest, 7 as shell commands with the network (creating and building the real Vite React and React-TypeScript starters, installing React Router, Vitest and Testing Library, and checking that the starter's own TypeScript 7 reports the chapter's first error), 2 rendered in real Chrome, and the rest validated or checked by hand-written assertions. One block is a single line repeated from the example before it, and is not run on its own.
- Browser tests for the React and TypeScript buttons on the built site, and the six new pages added to the accessibility (axe) checks.
- 88 glossary terms. Key, Routing and Regression now give both of their meanings (React and Python; web and AI agents; testing and machine learning).

Fixed (found by the checks while writing)
- The testing chapter's sign-up form could never show its own error message: the browser's built-in check for `type="email"` stopped the form first. It now has `noValidate`, and the chapter explains why.
- Testing Library only cleans up between tests when Vitest's `globals` setting is on; without it, the second test found two of everything. The chapter's setup file now calls `cleanup` after each test, and says why.
- The research for the TypeScript chapter assumed the Vite starter's tsconfig sets `"strict": true`. It does not: TypeScript 6 and later are strict by default. The chapter says that instead.
- A phone number in a practice answer was removed: I could not confirm it was in a range set aside for fiction.
- Error line numbers in all previews counted from the top of the hidden preview page (an error on line 2 said "line 130"). They now come from the example's own lines.
- React previews did not load during `npm run dev`: Vite's development server refuses script requests from the sandboxed frame. In development the bundle is now put inline; the built site loads it as a normal script.
- The CSS validator treated `src` and `font-display` inside `@font-face` as unknown properties; it now checks them against the at-rule's own grammar.

Not verified
- Sucrase, which compiles the examples on the page, does not report a closing JSX tag that does not match its opening tag (`<p>hi</b>`), and reports some mistakes less clearly than Vite. The common mistakes sections quote Vite's real messages.
- The type checks use this repository's TypeScript 6 compiler; learners' new projects get TypeScript 7. One network check runs real TypeScript 7 on the chapter's first error.
- No person has read these chapters yet; time estimates are guesses.

### 2026-11-12: Zero to Web Developer, part 3 (JavaScript from zero)

Added
- Seven chapters: values and variables; decisions, loops and functions; arrays and objects; the DOM and events; debugging; promises, async and fetch; modules, npm and Vite. About 17,500 words, 135 practice problems (30 each in the first three chapters), 50 quiz questions, 33 exercises, 24 resource records.
- **Run button for JavaScript.** Examples that are not part of a live preview get Run, Edit and Reset; output appears under the code in the same format the checks use; uncaught errors are reported plainly; a hint appears when nothing is printed. Examples using import or export get a note instead, because they need separate files.
- **JavaScript checks.** `tests/js-blocks.test.ts` runs every `check: js` example in Node and compares its output (`output`, `throws`, `stack_contains`, `expect`), with saved replies for examples that call web APIs. Real-browser checks can also be given saved API replies, so no test depends on the internet. 172 code blocks in this part; 101 run as JavaScript, 10 as shell commands (including creating, installing and building a real Vite project when network checks are on), 10 in a real browser.
- Previews get a temporary stand-in for localStorage (the real one stays out of reach), and leave form submissions alone when the example handles them itself.
- 42 glossary terms. The build now fails if a glossary term used by a course has no wording for that course.

Fixed (found by running the examples before publishing)
- The debugging chapter's worked example gave a wrong printed number (2023360 instead of 202360) and a wrong middle line of output.
- A practice problem said some buggy code "always returns 0"; it actually stops with a ReferenceError. The question and answer now say so and explain why.
- An example printed "1 are left over".
- The value formatter showed errors from the test sandbox as `{}`; it now recognises errors, maps, sets and dates from any frame.
- Frames meant to stay hidden until asked for were showing as empty white boxes (a bug from part 2), and previews could measure their height before layout finished.
- I had named two Eloquent JavaScript chapters from memory with the wrong numbers; corrected from the book's contents page. Two other claims (the size of the npm registry, Vite being "the most popular") were replaced with what the sources actually say.
- Glossary: "parameter", "index", "object" and "method" each have two meanings across the courses; the entries now give both. API and JSON were missing a wording for the web course.

### 2026-11-12: Zero to Web Developer, part 2 (HTML and CSS)

Added
- Eight chapters: HTML from zero; forms and tables; accessibility; CSS from zero; the box model and positioning; layout with Flexbox and Grid; responsive design; design basics. About 17,000 words, 93 practice problems with hidden solutions, 51 quiz questions, 37 exercises, 25 resources opened and recorded (plus one source of a statistic).
- **Live examples.** Every HTML example has "Show the result"; examples wrapped in `<Playground>` combine HTML, CSS and JavaScript into one preview shown straight away. Edit to change the code and watch the result update. Previews run in a sandboxed frame that cannot read the site's storage; console messages and errors appear under the preview; submitting a form shows what it would send instead of sending it; previews grow to fit their content.
- **Two new kinds of example check.** `web`: HTML is validated with html-validate and CSS with css-tree (`tests/web-blocks.test.ts`). `browser`: the example is rendered in real Chrome and the chapter's claims are measured, at several screen widths and in dark mode where the chapter says so (`e2e/examples.e2e.ts`). 64 of part 2's 95 code blocks have browser checks. Examples that are wrong on purpose declare the problem they should trigger, so the check proves it is real.
- 41 glossary terms. `scripts/glossary_update.py` now prints a warning whenever a bold word matches a term from another course.

Fixed (found by the new checks before publishing)
- A centred-column example said "never wider than 400 pixels" but was 432, because its padding was added to the width: the exact mistake the chapter teaches. A practice solution had the same problem at 720 pixels.
- "weight" (font weight) in the design chapter matched the AI glossary's "Parameter (weight)", and "breakpoint" and "inheritance" each have two meanings across the courses. The entries now give both meanings, and the design chapter says "font weight".
- Two example previews contained their own `<main>`, which gave those chapter pages two main landmarks for screen reader users; one now uses a `<div>`. The site's accessibility check now excludes example previews, because examples are the learner's code and some are inaccessible on purpose; they are checked separately.
- A sentence claimed screen readers always announce a styled navigation list as a list; Safari with VoiceOver does not when the bullets are removed. Reworded.
- Two figures I had written without a source were removed or sourced: the share of problems automatic accessibility tools find (removed), and colour-blindness rates (sourced to Colour Blind Awareness).

### 2026-11-12: Zero to Web Developer, part 1

Added
- A third course, **Zero to Web Developer**, for people with no experience. The outline (43 chapters in 8 parts, JavaScript throughout, with a Node and Express back end) was approved and is saved in `docs/plans/web-outline.yaml`. Parts are added one at a time, so only finished chapters appear on the site.
- Part 1, "Start here": three new chapters, "What a web developer actually does", "Set up your tools" and "Git from zero: saving your work", plus three reused chapters (how computers work, the terminal, how the internet works). The new chapters have worked examples, 23 practice problems with hidden solutions, 19 quiz questions, 14 exercises, and 14 linked resources, each opened on 12 November 2026 and recorded in `resources.yaml`.
- 18 glossary terms; `scripts/glossary_update.py` adds terms and marks which courses use each one.
- Every code example in the new chapters is checked: Git commands run in a throwaway folder against a local stand-in for GitHub, and the `git status` output shown in the chapter is compared with what Git really prints.

Fixed
- The glossary's "Prompt" entry gave only the AI meaning, but the terminal chapter links to it for the terminal's prompt. It now gives both meanings (the AI and software engineering glossaries are marked "corrected").
- Chapter status wording no longer claims "every code example runs under test" when some cannot be run; the code line underneath says exactly how they were checked.
- The no-lost-text check counted a term and its definition as one word when their tags touched.

Found while writing
- Advice that is common online ("just run `git pull`") does not fix a first push to a GitHub repository created with a README: the histories are unrelated. The chapter gives the command that works, and a test reproduces the situation.

### 2026-11-12: Adding courses

Added
- **`add-course` skill** (`.claude/skills/add-course/`): when you ask Claude Code in this folder to add a course or chapters, it researches, proposes an outline for approval, creates the files with `scripts/scaffold.py`, writes chapters to the standard in `references/chapter-standard.md`, and runs every check.
- Course files now carry their own `description` and `order`; the home page no longer assumes two courses. A course file with a missing field or a duplicate id stops the build with a plain message.
- `<Solution>` box for practice problems: the answer stays hidden until the learner opens it.

### 2026-11-12: Phase 4, code examples verified

Added
- `tests/examples`: every one of the 93 code blocks in the chapters (108 in the two prototypes, fewer now that shared chapters exist once, plus one new block) has an entry in its chapter's `examples.yaml` saying how it is checked, and a test that reads the code from the chapter and runs it. A code block with no entry, or an entry still marked as a draft, fails.
- The browser runner's Python moved into `src/runner/zte_runner.py`; the website and the tests use the same file.
- A stand-in Anthropic API server for the model API examples (scripted replies, streaming, tool calls). It is not the live API.
- `tests/web-examples.test.ts` for the JavaScript, HTML, CSS and React examples.
- Each chapter page now states how its code was checked.
- CI runs every example on every push (including package installs and the Docker build); a weekly job runs the PyTorch and model-download examples.
- Results on 12 November 2026: 142 checks pass and 24 are skipped on a Mac (Docker, network and heavy examples run separately; examples that are checked by hand or in the JavaScript tests are reported as skipped, not passed). The Docker examples pass. All 16 PyTorch and model-download checks pass in a Linux container.

Found but not changed (for the deepening phases)
- PyTorch could not be installed on this Intel Mac with Python 3.14 ("no matching distribution"). Learners on similar machines will hit the same wall; the deep-learning chapters point to Colab, which avoids it, but the setup chapter should say so.
- In the Python-from-zero chapters, lines that are just a value (`7 + 2  # 9`) show their result in the browser runner and at the `>>>` prompt, but print nothing when saved in a file and run with `python hello.py`, which is how the chapter says real programs are run. A beginner will be confused; the chapter should explain it.

Fixed in the chapters (status changed to "corrected")
- **The model API examples would have failed.** They passed `temperature=0`, which Anthropic's current Python SDK rejects with an error, and read replies as `msg.content[0].text`, which fails when a reply begins with a thinking block, as replies from current models can. Affected: Your first model call, Prompt engineering, Structured output, Tool use, RAG. They now use a small `reply_text` helper, introduced in "Your first model call", and `max_tokens` values with room for the model's thinking.
- The sampling chapter now says, in a note, that Anthropic's current models no longer accept `temperature`, `top_p` and `top_k`.
- Structured output gained a short example of the SDK's built-in schema parsing (`messages.parse`).
- Five examples used a file or a name the chapter never created: `docs.json` (Python habits), `sales.csv` (NumPy and pandas), `y_test`/`preds` (Metrics), `classify` (Evals), the passages list (RAG). The files are now created in the example; the others say in a comment which chapter they continue from.
- The sample traceback in "Python from zero: lists, dictionaries, files and errors" lacked the line of `~` and `^` marks that current Python prints, and the text now explains it. The check produces the traceback for real and compares.

### 2026-11-11: Phase 3, learning system

Added
- **Review** page with spaced repetition (Leitner boxes: 1, 3, 7, 14, 30 days). Quiz questions answered wrongly are scheduled automatically.
- **Study planner**: hours a week and a start date give a week-by-week schedule and a finish date; downloadable as a calendar file; settings remembered.
- **Search** across all chapters and the glossary (Pagefind).
- **Glossary page** for both courses with the chapters that mention each term. Terms are linked from chapters where they are introduced in bold; capital-letter acronyms where they first appear.
- **Runnable Python** in the browser (Pyodide 314.0.7, Python 3.14, in a web worker): Run, Edit, Reset, Stop; `input()`; readable tracebacks; NumPy, pandas and scikit-learn load on demand. Examples that need PyTorch, an API key or a learner's file say so instead of offering Run.
- **Ask a tutor** box: copies a prompt (beginner instructions, the chapter text, the question) for pasting into any AI assistant. No key and no network request.
- Site navigation bar on the non-course pages; links to the tools in each course sidebar; favicon.
- Progress format version 2 (adds the review list and planner settings; version 1 files and stored records are still read).
- Search results are filtered so that a word found nowhere in the course says "Nothing found" instead of listing pages that contain its first letter.
- Unit tests now 94. 16 end-to-end tests (Playwright) for progress, export/import, review, planner, search, glossary links, tutor box, demos, keyboard use, phone menu, Python, and axe accessibility checks on 15 page types in light and dark.

Changed
- Demo and exercise box titles are level-2 headings so heading levels never skip (found by axe). Demo read-outs are announced by screen readers.
- Fonts reduced from six files to four (about 90 KB in total, down from 155 KB).
- Markdown is processed with the unified (remark/rehype) processor rather than Astro 7's new default, because glossary linking is a rehype plugin.
- Home-page wording about resources corrected: links respond, contents not reviewed.

Known limits
- The planner's totals are far too low while chapters are short drafts; the page says so.
- Glossary linking is deliberately narrow (bold terms and acronyms only) to avoid linking ordinary words such as "label" to a technical meaning.
- The in-browser SQL and JavaScript editors proposed in PLAN.md are not built; they belong with the deepening of those chapters.
- New demos proposed in PLAN.md are not built; they belong with the chapters they illustrate.
- No manual screen-reader (VoiceOver) run has been done; only automated checks and keyboard tests.

### 2026-11-11: Phase 1, skeleton and faithful migration

Added
- Astro site with one page per chapter per course, a contents page per course, a home page and a progress page.
- All 77 prototype chapters moved to `content/chapters/<id>/` as MDX, with quizzes (151 questions) and exercise lists as YAML beside them. The words are unchanged.
- The four chapters that were identical in both prototypes (terminal, Python from zero ×3) now exist once and appear in both courses. The one sentence that differed is marked per course.
- Course files (`content/courses/*.yaml`) listing parts and chapters in order.
- Glossary as data (`content/glossary.yaml`, 90 terms). Where the two courses worded a definition differently, both wordings are kept.
- Chapter cross-references by id (`<Ref to="…" />`) instead of hard-coded numbers.
- The 12 interactive demos, ported with their drawing code unchanged.
- Progress stored in the browser, with download, restore from file (validated) and erase. "Mark as not done" added.
- Light, dark and automatic theme with a switch. Self-hosted fonts (no request to Google). Print stylesheet. Skip link. Syntax highlighting.
- Per-chapter status line and estimated time (a formula, not a measurement).
- Unit tests (37) for progress, the course model and inline text.
- `scripts/verify-migration.mjs`: compares every built chapter with the original article text and quiz. `scripts/check-internal-links.mjs`.
- GitHub Actions: CI, weekly outside-link check, deploy to GitHub Pages.
- README, MIT licence for code, CC BY 4.0 for course text.

Changed
- Prototype pages moved to `legacy/`.
- Exercise ticks are now stored per chapter, because both prototypes used the same keys for different exercises.

Known and deliberately not fixed in this phase (words were not to change)
- "Parts 6 and 8 are what employers pay for" and "Parts 2 to 5" on the AI course's first page are plain text and look out of date against the current part order.
- The link to docs.claude.com now redirects to platform.claude.com/docs.
- The "Ask the tutor" box is not carried over; a few chapters still mention it. Its replacement is in phase 3.
- All content problems listed in PLAN.md section 1.


### 2026-11-11: Phase 0, plan

- Started the repository with the two prototype pages (`ai-engineer-course.html`, `software-engineer-course.html`) and `HANDOFF.md`, unchanged.
- Added `PLAN.md`: proposed architecture, content structure, first-pass gap list against public curricula, phases, and the decisions needed before building. Awaiting approval; nothing built yet.
