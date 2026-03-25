const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const Jimp = require('jimp');

const UPLOAD_ROOT = path.join(__dirname, '../../uploads');
const QR_DIR = path.join(UPLOAD_ROOT, 'qrcodes');
const ASSETS_DIR = path.join(__dirname, '../../assets');

/** QR module size in pixels (before footer). High error correction allows a center logo. */
const QR_PIXEL_SIZE = 420;
/** White strip below QR for labels */
const TEXT_BLOCK_HEIGHT = 132;
/** Logo max width/height as fraction of QR width */
const LOGO_MAX_FRACTION = 0.2;

function ensureDirs() {
  [UPLOAD_ROOT, QR_DIR, path.join(UPLOAD_ROOT, 'profiles'), ASSETS_DIR].forEach(function (d) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });
}

/**
 * Optional logo: set QR_LOGO_PATH in .env, or place assets/logo.png (or .jpg / .jpeg)
 */
function resolveLogoPath() {
  if (process.env.QR_LOGO_PATH && fs.existsSync(process.env.QR_LOGO_PATH)) {
    return process.env.QR_LOGO_PATH;
  }
  var candidates = [
    path.join(ASSETS_DIR, 'logo.png'),
    path.join(ASSETS_DIR, 'logo.jpg'),
    path.join(ASSETS_DIR, 'logo.jpeg'),
  ];
  for (var i = 0; i < candidates.length; i++) {
    if (fs.existsSync(candidates[i])) return candidates[i];
  }
  return null;
}

/**
 * @param {Object} opts
 * @param {string} opts.memberId
 * @param {string} opts.qrCodeText - payload encoded in QR
 * @param {string} [opts.unitName]
 * @param {string} [opts.positionName]
 * @param {string} [opts.memberName]
 * @returns {Promise<{ relativePath: string, absolutePath: string }>}
 */
async function generateMemberQrFiles(opts) {
  ensureDirs();
  var memberId = opts.memberId;
  var qrCodeText = opts.qrCodeText;
  var unitName = String(opts.unitName || '').trim();
  var positionName = String(opts.positionName || '').trim();
  var memberName = String(opts.memberName || '').trim();

  var fileName = memberId.replace(/[^a-zA-Z0-9-_]/g, '_') + '.png';
  var relativePath = path.join('uploads', 'qrcodes', fileName).replace(/\\/g, '/');
  var absolutePath = path.join(QR_DIR, fileName);

  var qrBuffer = await QRCode.toBuffer(qrCodeText, {
    type: 'png',
    width: QR_PIXEL_SIZE,
    margin: 2,
    errorCorrectionLevel: 'H',
  });

  var qrImage = await Jimp.read(qrBuffer);

  var logoPath = resolveLogoPath();
  if (logoPath) {
    var logo = await Jimp.read(logoPath);
    var max = Math.round(qrImage.bitmap.width * LOGO_MAX_FRACTION);
    logo.scaleToFit(max, max);
    var lx = Math.round((qrImage.bitmap.width - logo.bitmap.width) / 2);
    var ly = Math.round((qrImage.bitmap.height - logo.bitmap.height) / 2);
    qrImage.composite(logo, lx, ly);
  }

  var font = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
  var w = qrImage.bitmap.width;
  var qrH = qrImage.bitmap.height;
  var totalH = qrH + TEXT_BLOCK_HEIGHT;

  var image = await new Promise(function (resolve, reject) {
    new Jimp(w, totalH, 0xffffffff, function (err, img) {
      if (err) reject(err);
      else resolve(img);
    });
  });
  image.composite(qrImage, 0, 0);

  var line1 = unitName ? unitName.toUpperCase() : '—';
  var line2 = positionName || '—';
  var line3 = memberName || '—';
  var labelText = line1 + '\n' + line2 + '\n' + line3;

  image.print(
    font,
    0,
    qrH + 8,
    {
      text: labelText,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_TOP,
    },
    w,
    TEXT_BLOCK_HEIGHT - 16
  );

  await new Promise(function (resolve, reject) {
    image.write(absolutePath, function (err) {
      if (err) reject(err);
      else resolve();
    });
  });

  return { relativePath: relativePath, absolutePath: absolutePath };
}

module.exports = { generateMemberQrFiles, ensureDirs, UPLOAD_ROOT, QR_DIR, ASSETS_DIR };
