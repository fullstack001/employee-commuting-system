/** Restrict queries to the logged-in user's unit (role: user). */
function unitScope(req) {
  if (req.user.role === 'user' && req.user.unit) {
    const u = req.user.unit._id || req.user.unit;
    return { unit: u };
  }
  return {};
}

module.exports = { unitScope };
