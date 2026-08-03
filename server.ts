import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// File-backed data storage path
const DATA_DIR = path.join(process.cwd(), 'data');
const VAULT_FILE = path.join(DATA_DIR, 'encrypted_vault.json');
const LOGS_FILE = path.join(DATA_DIR, 'activity_logs.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial vault structure helper
function readJsonFile(filePath: string, defaultValue: any) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return defaultValue;
}

function writeJsonFile(filePath: string, data: any) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

// Initialize Gemini API client lazily
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }
  return aiClient;
}

// --- API ROUTES ---

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get Vault Data (Encrypted blob)
app.get('/api/vault', (_req, res) => {
  const vaultData = readJsonFile(VAULT_FILE, {
    isConfigured: false,
    masterPasswordHash: null,
    recoveryKeyHash: null,
    salt: null,
    encryptedAccounts: [],
    categories: [],
    settings: {
      autoLockMinutes: 5,
      language: 'bn',
      theme: 'dark',
      twoFactorEnabled: false,
      twoFactorCode: null,
    },
    updatedAt: new Date().toISOString(),
  });
  res.json(vaultData);
});

// Save Vault Data
app.post('/api/vault', (req, res) => {
  const vaultData = req.body;
  vaultData.updatedAt = new Date().toISOString();
  const success = writeJsonFile(VAULT_FILE, vaultData);
  if (success) {
    res.json({ success: true, message: 'Vault saved successfully' });
  } else {
    res.status(500).json({ success: false, error: 'Failed to write vault data' });
  }
});

// Get Activity Logs
app.get('/api/logs', (_req, res) => {
  const logs = readJsonFile(LOGS_FILE, []);
  res.json(logs);
});

// Post Activity Log
app.post('/api/logs', (req, res) => {
  const { action, details, category } = req.body;
  const logs = readJsonFile(LOGS_FILE, []);
  const newLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    action,
    details: details || '',
    category: category || 'system',
    timestamp: new Date().toISOString(),
  };
  // keep last 200 logs
  logs.unshift(newLog);
  if (logs.length > 200) {
    logs.length = 200;
  }
  writeJsonFile(LOGS_FILE, logs);
  res.json({ success: true, log: newLog });
});

// Clear Activity Logs
app.delete('/api/logs', (_req, res) => {
  writeJsonFile(LOGS_FILE, []);
  res.json({ success: true });
});

// AI Security Advice Route (Uses Gemini to provide cybersecurity insights based on vault stats metadata, without raw passwords!)
app.post('/api/ai-security-advice', async (req, res) => {
  try {
    const { totalAccounts, weakCount, duplicateCount, oldPasswordCount, categoryCounts, language } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured.',
        advice: language === 'bn'
          ? 'Gemini API কি সেটআপ করা নেই। অনুগ্রহ করে সেটিংস প্যানেলে আপনার GEMINI_API_KEY প্রদান করুন।'
          : 'Gemini API key is not configured. Please add your GEMINI_API_KEY in the Secrets panel.'
      });
    }

    const langPrompt = language === 'bn'
      ? 'উত্তরটি সুন্দর, স্পষ্ট ও পেশাদার বাংলায় দিন।'
      : 'Provide the response in clear, encouraging English.';

    const prompt = `You are a Senior Cyber Security Auditor for a personal password manager.
Analyze these vault security metrics:
- Total Managed Accounts: ${totalAccounts}
- Weak Passwords Count: ${weakCount}
- Reused/Duplicate Passwords Count: ${duplicateCount}
- Old Passwords (>90 days unchanged): ${oldPasswordCount}
- Account Categories Distribution: ${JSON.stringify(categoryCounts)}

${langPrompt}
Provide a 3-bullet point executive security diagnosis and actionable suggestions to improve vault hygiene. Keep it concise, high-value, and motivating without jargon.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    const advice = response.text || 'Security analysis complete.';
    res.json({ success: true, advice });
  } catch (err: any) {
    console.error('Error generating AI security advice:', err);
    res.status(500).json({ error: 'Failed to generate security analysis', details: err?.message || String(err) });
  }
});

// --- VITE & PRODUCTION SETUP ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔒 Personal Password Manager Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
