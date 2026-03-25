import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

export default function MembersPage() {
  const [items, setItems] = useState([]);
  const [units, setUnits] = useState([]);
  const [positions, setPositions] = useState([]);
  const [form, setForm] = useState({
    name: '',
    unit: '',
    position: '',
    profileImage: null,
  });

  const load = async () => {
    const [m, u, p] = await Promise.all([
      api.get('/members'),
      api.get('/units'),
      api.get('/positions'),
    ]);
    setItems(m.data);
    setUnits(u.data);
    setPositions(p.data);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('unit', form.unit);
    fd.append('position', form.position);
    if (form.profileImage) fd.append('profileImage', form.profileImage);
    await api.post('/members', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    setForm({
      name: '',
      unit: '',
      position: '',
      profileImage: null,
    });
    load();
  };

  const remove = async (id) => {
    if (!window.confirm('Delete member?')) return;
    await api.delete(`/members/${id}`);
    load();
  };

  return (
    <div>
      <h2 className="h4 mb-3">Members</h2>
      <form className="card card-body mb-4 shadow-sm" onSubmit={save}>
        <h3 className="h6">New member</h3>
        <div className="row g-2 align-items-end">
          <div className="col-md-3">
            <label className="form-label small">Name</label>
            <input
              className="form-control"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="col-md-3">
            <label className="form-label small">Unit</label>
            <select
              className="form-select"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              required
            >
              <option value="">—</option>
              {units.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label small">Position</label>
            <select
              className="form-select"
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
              required
            >
              <option value="">—</option>
              {positions.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label small">Photo</label>
            <input
              type="file"
              className="form-control"
              accept="image/*"
              onChange={(e) =>
                setForm({
                  ...form,
                  profileImage: (e.target.files && e.target.files[0]) || null,
                })
              }
            />
          </div>
          <div className="col-12">
            <button className="btn btn-primary" type="submit">
              Create member
            </button>
          </div>
        </div>
      </form>
      <div className="table-responsive bg-white rounded shadow-sm">
        <table className="table mb-0">
          <thead>
            <tr>
              <th>Member ID</th>
              <th>Name</th>
              <th>Unit</th>
              <th>Position</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m._id}>
                <td>{m.memberId}</td>
                <td>{m.name}</td>
                <td>{m.unit && m.unit.name}</td>
                <td>{m.position && m.position.name}</td>
                <td className="text-end">
                  <Link className="btn btn-sm btn-outline-primary me-1" to={`/members/${m._id}`}>
                    View
                  </Link>
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => remove(m._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
