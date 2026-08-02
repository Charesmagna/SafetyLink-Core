require('dotenv').config();
const express = require('express');
const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const { Pool } = require('pg');
const telnyxFactory = require('telnyx');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure required variables exist, otherwise mock
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://localhost:5432/safetylink';

const redisConnection = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
    // Add silent retry so app doesn't crash if Redis is unavailable in local testing
    retryStrategy(times) {
        return Math.min(times * 50, 2000);
    }
});

const db = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const panicQueue = new Queue('panicDispatchPool', { connection: redisConnection });

app.post('/api/integration/save-credentials', async (req, res) => {
    const { accountType, id, telnyx_api_key, telnyx_phone_number } = req.body;
    try {
        if (accountType === 'user') {
            await db.query(`UPDATE user_profiles SET telnyx_api_key = $1, telnyx_phone_number = $2 WHERE id = $3`, [telnyx_api_key, telnyx_phone_number, id]);
        } else if (accountType === 'organisation') {
            await db.query(`UPDATE organisations SET telnyx_api_key = $1, telnyx_phone_number = $2 WHERE id = $3`, [telnyx_api_key, telnyx_phone_number, id]);
        } else {
            return res.status(400).json({ error: "Invalid account type" });
        }
        return res.status(200).json({ message: "Telecom configurations successfully activated." });
    } catch (err) {
        console.error("Dashboard profile configuration write crash:", err);
        return res.status(500).json({ error: "Database configuration save error." });
    }
});

app.post('/api/panic/trigger', async (req, res) => {
    const { userId, latitude, longitude } = req.body;
    if (!userId || !latitude || !longitude) {
        return res.status(400).json({ error: "Missing required emergency location parameters." });
    }
    try {
        const job = await panicQueue.add(`panic_signal_${Date.now()}`, {
            userId, latitude, longitude, timestamp: new Date().toISOString()
        }, {
            attempts: 5,
            backoff: { type: 'exponential', delay: 2000 }
        });
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

const panicWorker = new Worker('panicDispatchPool', async (job) => {
    const { userId, latitude, longitude } = job.data;
    console.log(`[Queue Worker] Initiating emergency matrix lookup for Job #${job.id}`);

    try {
        const identityQuery = await db.query(`
            SELECT u.name, u.telnyx_api_key, u.telnyx_phone_number,
                   o.telnyx_api_key AS org_key, o.telnyx_phone_number AS org_phone, o.control_room_phone 
            FROM user_profiles u
            LEFT JOIN organisations o ON u.linked_organisation_id = o.id
            WHERE u.id = $1`, [userId]
        );

        if (identityQuery.rows.length === 0) {
            console.log(`[Mock Fallback] Profile ${userId} not in DB. Using fallback dispatch.`);
            return; 
        }

        const resolvedIdentity = identityQuery.rows[0];
        let targetApiKey = resolvedIdentity.telnyx_api_key || resolvedIdentity.org_key;
        let targetFromPhone = resolvedIdentity.telnyx_phone_number || resolvedIdentity.org_phone;
        let controlRoomDestination = resolvedIdentity.control_room_phone;

        if (!targetApiKey || !targetFromPhone) throw new Error("No active communication pathways loaded.");

        const telnyx = telnyxFactory(targetApiKey);
        const payload = `SafetyLink Emergency! Panic triggered by ${resolvedIdentity.name || 'Resident'}. Coordinates: ${latitude}, ${longitude}.`;

        await Promise.all([
            telnyx.calls.create({
                to: controlRoomDestination, from: targetFromPhone,
                connection_id: process.env.TELNYX_OUTBOUND_PROFILE_ID,
                text_to_speech: { voice: "female", language: "en-US", text: payload }
            }).catch(e => console.error("Voice delivery fallback channel failed:", e.message)),
            telnyx.messages.create({
                to: controlRoomDestination, from: targetFromPhone, text: payload
            }).catch(e => console.error("SMS channel execution error:", e.message))
        ]);
    } catch (e) {
        console.error(`[Worker Error] ${e.message}`);
    }
}, { connection: redisConnection, concurrency: 15 });

panicWorker.on('completed', (job) => console.log(`[Audit System] Job #${job.id} completed.`));
panicWorker.on('failed', (job, err) => console.error(`[CRITICAL AUDIT FAIL] Job #${job.id}:`, err.message));

const SYSTEM_PORT = process.env.PORT || 3001;
app.listen(SYSTEM_PORT, () => console.log(`🚀 SafetyLink dispatch framework live on network port ${SYSTEM_PORT}`));
