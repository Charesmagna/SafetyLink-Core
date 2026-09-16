import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createOCUser } from './services/owncloud.js';
import cron from 'node-cron';
import axios from 'axios';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const OC_URL = process.env.OC_URL || 'http://localhost:8080';
const OC_ADMIN = process.env.OC_ADMIN || 'admin';
const OC_ADMIN_PASS = process.env.OC_ADMIN_PASS || 'admin';

// Test Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SafetyLink Custom Backend is running' });
});

// PART 1: POST /api/org/register
app.post('/api/org/register', async (req, res) => {
  try {
    const { code, name, contactName, phone } = req.body;
    
    // Auto-create OC User & Folder
    const { username: ocUsername, password: ocPassword } = await createOCUser(code, 'ORGANIZATION');

    // Save to Database
    const org = await prisma.organization.create({
      data: {
        code,
        name,
        contactName,
        phone,
        ocUsername,
        ocPassword
      }
    });

    res.json({ success: true, org });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PART 1: POST /api/family/register
app.post('/api/family/register', async (req, res) => {
  try {
    const { code, familyName } = req.body;
    
    // Auto-create OC User & Folder
    const { username: ocUsername, password: ocPassword } = await createOCUser(code, 'FAMILY');

    // Save to Database
    const family = await prisma.family.create({
      data: {
        code,
        familyName,
        ocUsername,
        ocPassword
      }
    });

    res.json({ success: true, family });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// CRON JOB: Auto-delete evidence after 90 days
// Runs every night at 3:00 AM
cron.schedule('0 3 * * *', async () => {
  console.log('[CRON] Starting 90-day retention sweep...');
  
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const oldIncidents = await prisma.incident.findMany({
      where: {
        createdAt: {
          lt: ninetyDaysAgo
        }
      }
    });

    console.log(`Found ${oldIncidents.length} incidents older than 90 days. Deleting files...`);

    for (const incident of oldIncidents) {
      if (incident.photoPath || incident.audioPath) {
        // Build the paths
        let folderCode = incident.orgCode || incident.familyCode;
        let type = incident.orgCode ? 'ORGANIZATION' : 'FAMILY';
        
        if (folderCode) {
          try {
            // Send DELETE requests to OwnCloud webdav
            if (incident.photoPath) {
              await axios.request({
                method: 'DELETE',
                url: `${OC_URL}/remote.php/webdav${incident.photoPath}`,
                auth: { username: OC_ADMIN, password: OC_ADMIN_PASS }
              });
            }
            if (incident.audioPath) {
              await axios.request({
                method: 'DELETE',
                url: `${OC_URL}/remote.php/webdav${incident.audioPath}`,
                auth: { username: OC_ADMIN, password: OC_ADMIN_PASS }
              });
            }
          } catch(e) {
            console.error(`Failed to delete evidence for incident ${incident.id} from OwnCloud:`, e.message);
          }
        }
      }

      // Delete the record from DB
      await prisma.incident.delete({
        where: { id: incident.id }
      });
    }

    console.log('[CRON] Retention sweep complete.');
  } catch (err) {
    console.error('[CRON Error]', err);
  }
});

app.listen(PORT, () => {
  console.log(`SafetyLink Custom Backend running on port ${PORT}`);
});
