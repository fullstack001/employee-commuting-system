const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');

const UPLOAD_ROOT = path.join(__dirname, '../../uploads');
const QR_DIR = path.join(UPLOAD_ROOT, 'qrcodes');

function ensureDirs() {
  [UPLOAD_ROOT, QR_DIR, path.join(UPLOAD_ROOT, 'profiles')].forEach((d) => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });
}

async function generateMemberQrFiles(memberId, qrCodeText) {
  ensureDirs();
  const fileName = `${memberId.replace(/[^a-zA-Z0-9-_]/g, '_')}.png`;
  const relativePath = path.join('uploads', 'qrcodes', fileName).replace(/\\/g, '/');
  const absolutePath = path.join(QR_DIR, fileName);
  await QRCode.toFile(absolutePath, qrCodeText, { width: 256, margin: 2 });
  return { relativePath, absolutePath };
}

module.exports = { generateMemberQrFiles, ensureDirs, UPLOAD_ROOT, QR_DIR };
