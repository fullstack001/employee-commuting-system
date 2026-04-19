const path = require('path');
const Member = require('../models/Member');
const Unit = require('../models/Unit');
const Position = require('../models/Position');
const { generateMemberQrFiles } = require('../services/qrService');

async function nextMemberId() {
  const year = new Date().getFullYear();
  const prefix = `MEMBER-${year}-`;
  const regex = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\d+$`);
  const last = await Member.findOne({ memberId: regex }).sort({ memberId: -1 });
  let n = 1;
  if (last) {
    const num = parseInt(String(last.memberId).split('-').pop(), 10);
    if (!Number.isNaN(num)) n = num + 1;
  }
  return `${prefix}${String(n).padStart(4, '0')}`;
}

function listFilter(req) {
  if (req.user.role === 'user' && req.user.unit) {
    return { unit: req.user.unit._id || req.user.unit };
  }
  return {};
}

exports.list = async (req, res) => {
  try {
    const filter = { ...listFilter(req) };
    if (req.query.unitId) filter.unit = req.query.unitId;
    if (req.query.active === 'true') filter.isActive = true;
    if (req.query.active === 'false') filter.isActive = false;
    const members = await Member.find(filter)
      .populate('unit', 'name code')
      .populate('position', 'name code')
      .sort({ createdAt: -1 });
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...listFilter(req) };
    const member = await Member.findOne(filter)
      .populate('unit', 'name code')
      .populate('position', 'name code')
      .populate('createdBy', 'name email');
    if (!member) return res.status(404).json({ message: 'Member not found' });
    res.json(member);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, unit, position } = req.body;
    if (!name || !unit || !position) {
      return res.status(400).json({ message: 'Name, unit, and position are required' });
    }
    const memberId = await nextMemberId();
    const qrCodeText = memberId;
    const unitDoc = await Unit.findById(unit);
    const positionDoc = await Position.findById(position);
    const { relativePath } = await generateMemberQrFiles({
      memberId: memberId,
      qrCodeText: qrCodeText,
      unitName: unitDoc ? unitDoc.name : '',
      positionName: positionDoc ? positionDoc.name : '',
      memberName: String(name).trim(),
    });
    let profileImage = '';
    if (req.file) {
      profileImage = path.join('uploads', 'profiles', req.file.filename).replace(/\\/g, '/');
    }
    const member = await Member.create({
      memberId,
      name: String(name).trim(),
      unit,
      position,
      qrCodeText,
      qrCodeImage: relativePath,
      profileImage,
      isActive: true,
      createdBy: req.user._id,
    });
    const populated = await Member.findById(member._id)
      .populate('unit', 'name code')
      .populate('position', 'name code');
    res.status(201).json(populated);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Duplicate member or QR' });
    res.status(500).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...listFilter(req) };
    const { name, unit, position, isActive } = req.body;
    const member = await Member.findOneAndUpdate(
      filter,
      {
        ...(name != null && { name: String(name).trim() }),
        ...(unit != null && { unit }),
        ...(position != null && { position }),
        ...(isActive != null && { isActive }),
      },
      { new: true, runValidators: true }
    )
      .populate('unit', 'name code')
      .populate('position', 'name code');
    if (!member) return res.status(404).json({ message: 'Member not found' });
    if (req.file) {
      member.profileImage = path.join('uploads', 'profiles', req.file.filename).replace(/\\/g, '/');
      await member.save();
    }
    var regen =
      name != null || unit != null || position != null;
    if (regen && member.qrCodeImage) {
      await generateMemberQrFiles({
        memberId: member.memberId,
        qrCodeText: member.qrCodeText,
        unitName: member.unit && member.unit.name,
        positionName: member.position && member.position.name,
        memberName: member.name,
      });
    }
    res.json(member);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...listFilter(req) };
    const member = await Member.findOneAndDelete(filter);
    if (!member) return res.status(404).json({ message: 'Member not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.qrcodeFile = async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...listFilter(req) };
    const member = await Member.findOne(filter);
    if (!member || !member.qrCodeImage) return res.status(404).json({ message: 'Not found' });
    const abs = path.join(__dirname, '../../', member.qrCodeImage);
    res.sendFile(abs, (err) => {
      if (err) res.status(404).json({ message: 'File not found' });
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
