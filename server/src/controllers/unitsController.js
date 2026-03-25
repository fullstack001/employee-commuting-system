const Unit = require('../models/Unit');

exports.list = async (req, res) => {
  try {
    const filter =
      req.user.role === 'user' && req.user.unit ? { _id: req.user.unit } : {};
    const units = await Unit.find(filter).sort({ name: 1 });
    res.json(units);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, code, description } = req.body;
    if (!name || !code) return res.status(400).json({ message: 'Name and code required' });
    const unit = await Unit.create({
      name: String(name).trim(),
      code: String(code).trim(),
      description: description || '',
    });
    res.status(201).json(unit);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Unit code already exists' });
    res.status(500).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, code, description, isActive } = req.body;
    const unit = await Unit.findByIdAndUpdate(
      req.params.id,
      {
        ...(name != null && { name: String(name).trim() }),
        ...(code != null && { code: String(code).trim() }),
        ...(description != null && { description }),
        ...(isActive != null && { isActive }),
      },
      { new: true, runValidators: true }
    );
    if (!unit) return res.status(404).json({ message: 'Unit not found' });
    res.json(unit);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Unit code already exists' });
    res.status(500).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const unit = await Unit.findByIdAndDelete(req.params.id);
    if (!unit) return res.status(404).json({ message: 'Unit not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
