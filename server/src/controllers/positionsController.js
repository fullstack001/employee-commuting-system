const Position = require('../models/Position');

exports.list = async (req, res) => {
  try {
    const positions = await Position.find().sort({ name: 1 });
    res.json(positions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, code, description } = req.body;
    if (!name || !code) return res.status(400).json({ message: 'Name and code required' });
    const position = await Position.create({
      name: String(name).trim(),
      code: String(code).trim(),
      description: description || '',
    });
    res.status(201).json(position);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Position code already exists' });
    res.status(500).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, code, description, isActive } = req.body;
    const position = await Position.findByIdAndUpdate(
      req.params.id,
      {
        ...(name != null && { name: String(name).trim() }),
        ...(code != null && { code: String(code).trim() }),
        ...(description != null && { description }),
        ...(isActive != null && { isActive }),
      },
      { new: true, runValidators: true }
    );
    if (!position) return res.status(404).json({ message: 'Position not found' });
    res.json(position);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Position code already exists' });
    res.status(500).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const position = await Position.findByIdAndDelete(req.params.id);
    if (!position) return res.status(404).json({ message: 'Position not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
