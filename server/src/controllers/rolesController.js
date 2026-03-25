const Role = require('../models/Role');

exports.list = async (req, res) => {
  try {
    const roles = await Role.find().sort({ name: 1 });
    res.json(roles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, code, description } = req.body;
    if (!name || !code) return res.status(400).json({ message: 'Name and code required' });
    const role = await Role.create({
      name: String(name).trim(),
      code: String(code).trim(),
      description: description || '',
    });
    res.status(201).json(role);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Role code already exists' });
    res.status(500).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, code, description, isActive } = req.body;
    const role = await Role.findByIdAndUpdate(
      req.params.id,
      {
        ...(name != null && { name: String(name).trim() }),
        ...(code != null && { code: String(code).trim() }),
        ...(description != null && { description }),
        ...(isActive != null && { isActive }),
      },
      { new: true, runValidators: true }
    );
    if (!role) return res.status(404).json({ message: 'Role not found' });
    res.json(role);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Role code already exists' });
    res.status(500).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const role = await Role.findByIdAndDelete(req.params.id);
    if (!role) return res.status(404).json({ message: 'Role not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
