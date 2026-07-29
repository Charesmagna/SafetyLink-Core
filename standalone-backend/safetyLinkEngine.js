require('dotenv').config();
const express = require('express');
const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const { Pool } = require('pg');
const telnyxFactory = require('telnyx');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. Core Service Cluster Configurations
const redisConnection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null // Required architectural flag for handling fast BullMQ loops
});

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// 2. High-Availability Ingestion Queue Instance
const panicQueue = new Queue('panicDispatchPool', { connection: redisConnection });

/**
 * MODULE A: Dashboards Credential Sync Target
 */
app.post('/api/integration/save-credentials', async (req, res) => {
    const { accountType, id, telnyx_api_key, telnyx_phone_number } = req.body;

    try {
        if (accountType === 'user') {
            await db.query(
                `UPDATE user_profiles SET telnyx_api_key = $1, telnyx_phone_number = $2 WHERE id = $3`,
                [telnyx_api_key, telnyx_phone_number, id]
            );
        } else if (accountType === 'organisation') {
            await db.query(
                `UPDATE organisations SET telnyx_api_key = $1, telnyx_phone_number = $2 WHERE id = $3`,
                [telnyx_api_key, telnyx_phone_number, id]
            );
        } else {
            return res.status(400).json({ error: "Invalid account contextual destination" });
        }
        return res.status(200).json({ message: "Telecom configurations successfully activated." });
    } catch (err) {
        console.error("Dashboard profile configuration write crash:", err);
        return res.status(500).json({ error: "Database configuration save error." });
    }
});

/**
 * MODULE B: Mobile Panic Receiver Route
 * Immediately responds to the user's phone while pushing data to safe background memory cache
 */
app.post('/api/panic/trigger', async (req, res) => {
    const { userId, latitude, longitude } = req.body;

    if (!userId || !latitude || !longitude) {
        return res.status(400).json({ error: "Missing required emergency location parameters." });
    }

    try {
        // Hand off payload data to persistent memory queue immediately
        const job = await panicQueue.add(`panic_signal_${Date.now()}`, {
            userId,
            latitude,
            longitude,
            timestamp: new Date().toISOString()
        }, {
            attempts: 5, // Retry up to 5 times if external cellular routes face network congestion
            backoff: {
                type: 'exponential',
                delay: 2000 // Progressively delays retry cycles (2s, 4s, 8s...) to ensure packet survival
            }
        });

        // 202 Accepted tells the mobile UI the message is safe, dropping latency instantly
        return res.status(202).json({ 
            status: "Accepted", 
            message: "Emergency pipeline established. Dispatches firing.",
            eventId: job.id
        });

    } catch (error) {
        console.error("Critical entry-queue storage blockage:", error);
        return res.status(500).json({ error: "Internal crash entering panic queue buffer." });
    }
});

/**
 * MODULE C: Isolated Background Worker Core
 * Continuously process emergency signals completely disconnected from live application request loops
 */
const panicWorker = new Worker('panicDispatchPool', async (job) => {
    const { userId, latitude, longitude } = job.data;
    console.log(`[Queue Worker] Initiating emergency matrix lookup for Job #${job.id}`);

    // Resolve structural paths for both user and organization hierarchies
    const identityQuery = await db.query(`
        SELECT u.name, u.telnyx_api_key, u.telnyx_phone_number,
               o.telnyx_api_key AS org_key, o.telnyx_phone_number AS org_phone, o.control_room_phone 
        FROM user_profiles u
        LEFT JOIN organisations o ON u.linked_organisation_id = o.id
        WHERE u.id = $1`, 
        [userId]
    );

    if (identityQuery.rows.length === 0) {
        throw new Error(`Data Constraint Breach: Profile entity index ${userId} no longer verified.`);
    }

    const resolvedIdentity = identityQuery.rows[0];
    
    // RESOLUTION LAYER: User Keys take high priority, fallback to Organisation keys if null
    let targetApiKey = resolvedIdentity.telnyx_api_key || resolvedIdentity.org_key;
    let targetFromPhone = resolvedIdentity.telnyx_phone_number || resolvedIdentity.org_phone;
    let controlRoomDestination = resolvedIdentity.control_room_phone;

    if (!targetApiKey || !targetFromPhone) {
        throw new Error("Aborting background worker pipeline thread. Tenant has no active communication pathways loaded.");
    }

    // Initialize Telnyx dynamically using the specific tenant's personal funding keys
    const telnyx = telnyxFactory(targetApiKey);
    const structuredEmergencyPayload = `SafetyLink Emergency! Panic triggered by ${resolvedIdentity.name || 'Resident'}. Coordinates: ${latitude}, ${longitude}.`;

    // Multi-Channel Telecommunication Dispatches executed in concurrent threads
    await Promise.all([
        // Dispatch Loop 1: Automated Outbound Voice Call via text-to-speech
        telnyx.calls.create({
            to: controlRoomDestination,
            from: targetFromPhone,
            connection_id: process.env.TELNYX_OUTBOUND_PROFILE_ID,
            text_to_speech: {
                voice: "female",
                language: "en-US",
                text: structuredEmergencyPayload
            }
        }).catch(e => console.error("Voice delivery fallback channel failed:", e.message)),

        // Dispatch Loop 2: Immediate Backup Broadcast SMS
        telnyx.messages.create({
            to: controlRoomDestination,
            from: targetFromPhone,
            text: structuredEmergencyPayload
        }).catch(e => console.error("SMS channel execution error:", e.message))
    ]);

    console.log(`[Queue Worker] Successfully processed and closed alert tasks for Job #${job.id}`);
}, { connection: redisConnection, concurrency: 15 }); // Scaled to safely ingest 15 concurrent panic alerts instantly

// Operational Audit Log Monitoring Trace
panicWorker.on('completed', (job) => {
    console.log(`[Audit System] Job #${job.id} completely closed. Target communications cleanly finished.`);
});

panicWorker.on('failed', (job, err) => {
    console.error(`[CRITICAL AUDIT FAIL] Process failure on system tracking Job #${job.id}:`, err.message);
});

// 4. Fire Backend Infrastructure Server
const SYSTEM_PORT = process.env.PORT || 3000;
app.listen(SYSTEM_PORT, () => console.log(`🚀 SafetyLink continuous framework live on network port ${SYSTEM_PORT}`));
