import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { error } = req.body;
    const logPath = path.join(process.cwd(), 'build.log');
    const logLine = `[${new Date().toISOString()}] ${error}\n`;
    fs.appendFileSync(logPath, logLine, 'utf8');
    res.status(200).json({ success: true });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}