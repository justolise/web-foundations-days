# SnapShare: System Scaling & Architecture Plan

A comprehensive scaling plan and system architecture for **SnapShare**, a photo-sharing application where users upload photos and scroll a personalized feed of photos from people they follow.

---

## 1. Assumptions & Traffic Estimation

### Starting Facts
* **Registered Users:** 10 million (10,000,000)
* **Daily Active Ratio:** 10%
* **Photos Uploaded per Active User:** 1 photo/day
* **Feed Views per Active User:** 50 feed pages/day
* **Photo File Size:** Average 2 MB per original photo
* **Thumbnail File Size:** 50 KB (0.05 MB) per thumbnail
* **Peak Traffic Multiplier:** 5× average traffic
* **Seconds per Day:** 86,400 seconds (24 hours × 60 minutes × 60 seconds)
* **Days per Year:** 365 days

### Daily Active Users (DAU)
$$\text{DAU} = 10,000,000 \times 10\% = 1,000,000 \text{ active users/day}$$

SnapShare has **1 million Daily Active Users (DAU)**.

---

### Traffic Calculations

#### A. Uploads per Second
* **Total Uploads per Day:**  
  $$1,000,000 \text{ DAU} \times 1 \text{ upload/user} = 1,000,000 \text{ uploads/day}$$
* **Average Uploads per Second:**  
  $$\frac{1,000,000 \text{ uploads}}{86,400 \text{ seconds}} \approx 11.57 \text{ uploads/second}$$
* **Peak Uploads per Second (5×):**  
  $$11.57 \times 5 \approx 57.87 \text{ uploads/second}$$

> **Summary:** Average ~**12 uploads/sec** | Peak ~**58 uploads/sec**

#### B. Feed Views per Second
* **Total Feed Page Views per Day:**  
  $$1,000,000 \text{ DAU} \times 50 \text{ views/user} = 50,000,000 \text{ feed views/day}$$
* **Average Feed Views per Second:**  
  $$\frac{50,000,000 \text{ views}}{86,400 \text{ seconds}} \approx 578.70 \text{ views/second}$$
* **Peak Feed Views per Second (5×):**  
  $$578.70 \times 5 \approx 2,893.52 \text{ views/second}$$

> **Summary:** Average ~**579 feed views/sec** | Peak ~**2,894 feed views/sec**

---

### Storage Estimation per Year

Each uploaded photo generates two objects:
1. **Original Photo:** 2 MB
2. **Generated Thumbnail:** 50 KB = 0.05 MB
3. **Total Media Storage per Upload:** $2 \text{ MB} + 0.05 \text{ MB} = 2.05 \text{ MB}$

* **Daily Media Storage:**  
  $$1,000,000 \text{ uploads/day} \times 2.05 \text{ MB} = 2,050,000 \text{ MB/day} = 2,050 \text{ GB/day} = 2.05 \text{ TB/day}$$

* **Yearly Media Storage (365 days):**  
  $$2.05 \text{ TB/day} \times 365 \text{ days} = 748.25 \text{ TB/year}$$

* **Storage Breakdown:**
  * **Original Photos:** $1,000,000 \times 2 \text{ MB} \times 365 = 730 \text{ TB/year}$
  * **Thumbnails:** $1,000,000 \times 0.05 \text{ MB} \times 365 = 18.25 \text{ TB/year}$
  * **Combined Media Total:** **748.25 TB/year** (approximately **0.75 PB/year**)

*(Note: Relational database metadata such as user IDs, photo URLs, timestamps, and captions requires an estimated ~0.5 KB per record $\approx 182.5\text{ GB/year}$, which easily fits within standard database storage.)*

---

## 2. Read-Heavy vs. Write-Heavy Analysis

**SnapShare is heavily read-heavy.**

### The Numbers
* **Reads per day:** 50,000,000 feed page views
* **Writes per day:** 1,000,000 photo uploads
* **Read-to-Write Ratio:** **50 : 1**

### What This Means for the System Design
Because the application processes 50 reads for every single write, the design must prioritize read performance, low latency, and high read concurrency:
1. **Aggressive In-Memory Caching:** Frequently accessed data (user feeds, profiles, and following lists) must be cached in memory (e.g., Redis) so that the vast majority of feed requests are served without querying the persistent database.
2. **Global Edge Caching via CDN:** High-bandwidth static assets (photos and thumbnails) must be served from CDN edge points of presence (PoPs) closest to the user, offloading media bandwidth entirely from origin servers.
3. **Database Read Replicas:** Read queries must be routed to read replicas, reserving the primary database exclusively for writes and maintaining fast response times without lock contention.
4. **Asynchronous Background Processing for Writes:** With write traffic being relatively modest (~12 uploads/sec average, ~58 uploads/sec peak), image transformation (thumbnailing) can be queued and processed in the background, keeping the write path fast and non-blocking.

---

## 3. Storage Strategy: Why Photos Should Not Be Stored in the Database

Photos (and binary large objects in general) should **never** be stored directly inside a relational database (e.g., in `BLOB` or `BYTEA` columns). Instead, raw photo files and thumbnails must be stored in **Distributed Object Storage** (such as AWS S3, Google Cloud Storage, or MinIO), while the database stores only the lightweight **metadata and object URLs** (e.g., `photo_id`, `user_id`, `image_url`, `thumbnail_url`, `created_at`, `file_size`).

### Reasons to Keep Photos Out of the Database:
1. **High Cost of Database Storage:** Database storage (high-performance NVMe/SSD attached to database compute instances) is significantly more expensive per gigabyte than object storage. Storing ~748 TB/year in database disks would be cost-prohibitive.
2. **Buffer Pool and Memory Pollution:** Relational databases cache table pages and indices in RAM (e.g., InnoDB Buffer Pool). Storing megabyte-sized binary blobs in table rows evicts useful index and relational data from memory, causing severe database performance degradation.
3. **Impaired Backups, Replication, and Restores:** Backing up, replicating, and restoring a multi-hundred terabyte database takes days and causes massive replication lag over the network.
4. **Connection and Network Bottlenecks:** Streaming multi-megabyte files through database connections monopolizes scarce database connection pools and saturates network bandwidth that should be reserved for fast SQL queries.
5. **Native Cloud and CDN Optimization:** Object storage services scale horizontally without practical limits, provide 99.999999999% (11 9s) durability, support direct pre-signed client uploads, and integrate seamlessly with CDNs.

---

## 4. Architecture Diagram

Below is the text-based architecture diagram illustrating both the photo upload flow and the feed viewing flow:

```text
                        +----------------------------+
                        |   Client (Mobile / Web)   |
                        +--------------+-------------+
                                       |
                +----------------------+----------------------+
                | (1) Read Photos /    | (2) API Requests     | (3) Direct Media
                |     Thumbnails       |     (Uploads/Feeds)  |     Upload (Pre-signed)
                v                      v                      |
      +-------------------+  +-------------------+            |
      |   Content Delivery|  |   Load Balancer   |            |
      |   Network (CDN)   |  |   (Nginx / ALB)   |            |
      +---------+---------+  +---------+---------+            |
                |                      |                      |
                | Cache Miss           +----------+-----------+
                |                                 |
                |                      +----------v----------+
                |                      |  App Servers (API)  |
                |                      |  (Stateless Cluster)|
                |                      +----+-----+----+-----+
                |                           |     |    |
                |            +--------------+     |    +---------------+
                |            | Read/Write         | Read Feeds         | Push Task
                |            v                    v                    v
                |     +-------------+      +-------------+      +--------------+
                |     | Primary DB  |      | Cache       |      | Message Queue|
                |     |  (Writes)   |      | (Redis)     |      | (RabbitMQ /  |
                |     +------+------+      +-------------+      |     SQS)     |
                |            |                                  +-------+------+
                |            | Async                                    |
                |            | Replication                              | Consume Task
                |            v                                          v
                |     +-------------+                           +--------------+
                |     |Read Replica |                           | Thumbnail    |
                |     |   (Reads)   |                           | Worker Pool  |
                |     +-------------+                           +-------+------+
                |                                                       |
                +----------------------------+--------------------------+
                                             | Reads Original / Writes Thumbnail
                                             v
                              +-----------------------------+
                              |        Object Storage       |
                              |   (AWS S3 / GCS / MinIO)    |
                              | - /photos/original/...      |
                              | - /photos/thumbnails/...    |
                              +-----------------------------+
```

---

## 5. Component Explanations (One Sentence Each)

* **CDN (Content Delivery Network):** Caches photos and thumbnails at edge locations close to users worldwide to deliver media with ultra-low latency and shield backend infrastructure from bandwidth saturation.
* **Load Balancer:** Distributes incoming user traffic evenly across available application servers to prevent any single server from becoming overwhelmed and to provide seamless high-availability failover.
* **App Servers:** Executes core application logic, authentication, request validation, feed composition, and orchestration between the cache, database, and background services.
* **Cache (e.g., Redis):** Keeps hot user feeds, follower relationships, and active session tokens in fast in-memory storage to satisfy repetitive read queries without burdening the database.
* **Database (Primary):** Serves as the single authoritative source of truth for all transactional writes, user accounts, relationships, and photo metadata.
* **Read Replica:** Replicates data asynchronously from the primary database to serve read-only queries, horizontally scaling read capacity and preventing feed lookups from impacting write performance.
* **Object Storage:** Stores raw original photos and generated thumbnail files in a durable, cost-effective, and horizontally scalable storage tier built specifically for binary files.
* **Message Queue:** Buffers thumbnail generation jobs asynchronously, decoupling the fast user-facing photo upload API from resource-intensive image processing tasks.
* **Thumbnail Worker:** Consumes thumbnail generation jobs from the message queue in the background, generating 50 KB thumbnails from original 2 MB photos and saving them back to object storage.

---

## 6. Step-by-Step Photo Upload Flow

The following sequence describes how a user uploads a photo, including background thumbnail creation:

1. **Upload Request & Pre-Signed URL:**  
   The user selects a photo on their mobile or web client. The client sends a `POST /api/photos/upload-url` request with photo metadata (filename, size, MIME type) to the **Load Balancer**, which routes it to an **App Server**.
2. **Pre-Signed URL Generation:**  
   The App Server authenticates the user, generates a unique photo ID, and requests a cryptographically signed upload URL from **Object Storage** (e.g., an S3 Pre-signed URL valid for 15 minutes). The App Server returns this URL to the client.
3. **Direct Binary Upload:**  
   The client uploads the 2 MB photo file directly to **Object Storage** via HTTP `PUT` using the pre-signed URL, bypassing the application servers and preventing server network congestion.
4. **Upload Confirmation & Metadata Persistence:**  
   Once the file is successfully uploaded to Object Storage, the client sends a `POST /api/photos/confirm` request to the App Server. The App Server inserts a new row into the **Primary Database** containing the photo ID, user ID, object storage URL, upload timestamp, and sets `thumbnail_status = 'pending'`.
5. **Enqueueing Thumbnail Job:**  
   The App Server publishes a job message to the **Message Queue** containing the photo ID and the object storage path of the original image (e.g., `{"photo_id": "p_987", "original_key": "photos/original/p_987.jpg"}`).
6. **Fast Client Confirmation:**  
   The App Server immediately sends an HTTP `201 Created` response back to the client so the user experiences an instant upload without waiting for image resizing.
7. **Background Thumbnail Processing:**  
   An available **Thumbnail Worker** pulls the message from the Message Queue, fetches the 2 MB original image from **Object Storage**, resizes it down to a 50 KB thumbnail, and uploads the new thumbnail to Object Storage (`photos/thumbnails/p_987.jpg`).
8. **Database & Cache Update:**  
   The worker updates the photo row in the **Primary Database** with the thumbnail URL and marks `thumbnail_status = 'ready'`. The worker then pushes the new post to the creator's followers' cached feeds in the **Cache** (or invalidates stale feed caches).
9. **Display via CDN:**  
   When followers view their feed, their client requests the thumbnail URL, which is fetched from Object Storage on the first request and subsequently served from the **CDN** edge cache for all other followers.

---

## 7. Architectural Trade-Offs

### Trade-Off 1: Fan-Out on Write (Push) vs. Fan-Out on Read (Pull) for Feeds
* **Fan-Out on Write (Push Model):** When a user uploads a photo, the system immediately pushes the post ID into the feed cache of every one of their followers.
  * *Pros:* Feed reads are instantaneous ($O(1)$ lookup from cache), making the 50 million daily feed reads extremely fast.
  * *Cons:* Severe write amplification and delay for users with massive follower counts (e.g., if a celebrity with 1,000,000 followers uploads a photo, the system must perform 1,000,000 write operations).
* **Fan-Out on Read (Pull Model):** Feeds are not precomputed; instead, when a user opens their feed, the system queries the database/cache for the recent photos of all accounts they follow, merges them, and sorts by time.
  * *Pros:* Upload writes are fast and simple ($O(1)$ write); zero wasted work for inactive followers.
  * *Cons:* Feed generation is computationally expensive ($O(N \log N)$ merge) on every read request, creating a major bottleneck at 2,894 peak reads/second.
* **Our Decision / Hybrid Approach:** SnapShare adopts a **hybrid model**:
  * For standard users with under 25,000 followers, we use **Fan-Out on Write** (precomputing follower feeds in Redis for sub-50ms read response).
  * For "celebrity" accounts with large follower counts, we use **Fan-Out on Read** (their posts are dynamically merged into the user's feed when requested), preventing severe write spikes while keeping read latency low.

### Trade-Off 2: Asynchronous vs. Synchronous Thumbnail Generation
* **Synchronous Generation:** The application server receives the uploaded photo, resizes it into a thumbnail immediately during the HTTP request, and returns only when both original and thumbnail are saved.
  * *Pros:* The thumbnail is guaranteed to be available immediately upon request; simpler system architecture without needing message queues or worker pools.
  * *Cons:* Dramatically increases upload request latency and failure rates; heavy CPU-bound image processing blocks web application threads, severely reducing API concurrency.
* **Asynchronous Generation (Our Choice):** The upload endpoint accepts the photo immediately and offloads thumbnail creation to a background message queue and worker pool.
  * *Pros:* Fast, snappy user experience with instant upload confirmations; isolates heavy image processing onto dedicated workers that scale independently; protects the system from crashing under traffic spikes.
  * *Cons:* Introduces eventual consistency: there is a short latency window (typically 500ms–2 seconds) where the thumbnail is not yet available, requiring the client UI to handle a loading state or fallback to a placeholder.

### Trade-Off 3: Direct Client Uploads via Pre-Signed URLs vs. Uploads Through App Servers
* **Proxied Uploads Through App Servers:** The client sends the 2 MB image file directly to the App Server, which then streams it to Object Storage.
  * *Pros:* Centralized server-side validation, authentication, and security inspection before any file hits storage.
  * *Cons:* Severe network bandwidth and memory overhead on the app server cluster. At 58 peak uploads/second of 2 MB images, app servers would have to ingest and transfer ~116 MB/sec of binary data, requiring a much larger and more expensive server fleet.
* **Direct Pre-Signed Uploads (Our Choice):** The App Server issues a temporary cryptographic pre-signed URL allowing the client to upload directly to Object Storage.
  * *Pros:* Offloads 100% of large binary file transfer bandwidth from application servers to Object Storage, allowing app servers to remain lightweight and handle thousands of concurrent requests.
  * *Cons:* Requires two-phase coordination from the client (request URL, upload file, confirm completion) and requires background garbage collection for unconfirmed/abandoned uploads.
